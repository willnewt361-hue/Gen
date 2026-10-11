"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Option {
  id: string;
  optionKey: string;
  optionText: string;
}

interface Question {
  id: string;
  questionText: string;
  markValue: number;
  options: Option[];
}

interface Answer {
  questionId: string;
  selectedOptionId: string | null;
  isFlagged: boolean;
}

interface SessionData {
  id: string;
  isTimed: boolean;
  deadlineAt: string | null;
  questionCount: number;
  totalMarks: number;
  questions: Question[];
  answers: Answer[];
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveQueueRef = useRef<Map<string, string | null>>(new Map());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load session");
        return;
      }
      if (data.completed) {
        router.replace(`/results/${sessionId}`);
        return;
      }
      if (data.autoSubmitted) {
        router.replace(`/results/${sessionId}`);
        return;
      }
      setSession(data.session);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Timer for timed sessions
  useEffect(() => {
    if (!session?.isTimed || !session.deadlineAt) return;

    const deadline = new Date(session.deadlineAt).getTime();

    const updateTimer = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        // Auto-submit
        if (timerRef.current) clearInterval(timerRef.current);
        handleSubmit(true);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.isTimed, session?.deadlineAt]);

  // Persist answers to IndexedDB for offline recovery
  useEffect(() => {
    if (!session) return;
    try {
      const offlineData = {
        sessionId: session.id,
        answers: session.answers,
        currentIdx,
        savedAt: Date.now(),
      };
      localStorage.setItem(
        `will-session-${session.id}`,
        JSON.stringify(offlineData)
      );
    } catch {
      // ignore
    }
  }, [session, currentIdx]);

  // Batch save answers to server
  const flushSaves = useCallback(async () => {
    if (!session || saveQueueRef.current.size === 0) return;
    const saves = new Map(saveQueueRef.current);
    saveQueueRef.current.clear();

    for (const [questionId, optionId] of saves) {
      try {
        await fetch(`/api/sessions/${session.id}/answer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedOptionId: optionId }),
        });
      } catch {
        // Re-queue on failure
        saveQueueRef.current.set(questionId, optionId);
      }
    }
  }, [session]);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSaves, 500);
  }, [flushSaves]);

  // Select answer
  const selectOption = (questionId: string, optionId: string) => {
    if (!session) return;
    saveQueueRef.current.set(questionId, optionId);
    setSession({
      ...session,
      answers: session.answers.map((a) =>
        a.questionId === questionId
          ? { ...a, selectedOptionId: optionId }
          : a
      ),
    });
    scheduleSave();
  };

  // Toggle flag
  const toggleFlag = async (questionId: string, currentFlag: boolean) => {
    if (!session) return;
    const newFlag = !currentFlag;
    setSession({
      ...session,
      answers: session.answers.map((a) =>
        a.questionId === questionId ? { ...a, isFlagged: newFlag } : a
      ),
    });
    try {
      await fetch(`/api/sessions/${session.id}/flag`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, isFlagged: newFlag }),
      });
    } catch {
      // revert on failure
    }
  };

  // Submit
  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    setSubmitting(true);

    // Flush pending saves first
    await flushSaves();

    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: "POST",
      });
      if (res.ok) {
        router.replace(`/results/${sessionId}`);
      } else {
        const data = await res.json();
        setError(data.error || "Submission failed");
        setSubmitting(false);
      }
    } catch (e: any) {
      setError(e.message || "Network error");
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading session…
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="fade-in">
        <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
          <div className="card-body" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</p>
            <a href="/configure" className="btn btn-primary">
              Start New Session
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentQuestion = session.questions[currentIdx];
  const currentAnswer = session.answers.find(
    (a) => a.questionId === currentQuestion?.id
  );
  const answeredCount = session.answers.filter(
    (a) => a.selectedOptionId
  ).length;
  const flaggedCount = session.answers.filter((a) => a.isFlagged).length;
  const unansweredCount = session.questionCount - answeredCount;

  return (
    <div className="fade-in">
      {/* Timer bar for timed sessions */}
      {session.isTimed && timeLeft !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            padding: "12px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>⏱️</span>
            <span
              className={`timer${
                timeLeft < 60000
                  ? " danger"
                  : timeLeft < 300000
                    ? " warning"
                    : ""
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {session.isTimed ? "Timed Test" : "Practice"}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        {/* Main question area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Progress */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
            }}
          >
            <span>
              Question {currentIdx + 1} of {session.questionCount}
            </span>
            <span>
              {answeredCount} answered · {unansweredCount} unanswered
              {flaggedCount > 0 && ` · ${flaggedCount} flagged`}
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 24 }}>
            <div
              className="progress-fill"
              style={{
                width: `${(answeredCount / session.questionCount) * 100}%`,
                background: "var(--accent)",
              }}
            />
          </div>

          {/* Question */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {currentQuestion.markValue} mark{currentQuestion.markValue !== 1 ? "s" : ""}
                </div>
                <button
                  className={`flag-btn${currentAnswer?.isFlagged ? " flagged" : ""}`}
                  onClick={() =>
                    toggleFlag(currentQuestion.id, currentAnswer?.isFlagged ?? false)
                  }
                  title={currentAnswer?.isFlagged ? "Remove flag" : "Flag for review"}
                >
                  🚩
                </button>
              </div>
              <div className="question-text">{currentQuestion.questionText}</div>

              {/* Options */}
              {currentQuestion.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`option-card${
                    currentAnswer?.selectedOptionId === opt.id ? " selected" : ""
                  }`}
                  onClick={() => selectOption(currentQuestion.id, opt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectOption(currentQuestion.id, opt.id);
                    }
                  }}
                >
                  <span className="option-key">{opt.optionKey}</span>
                  <span className="option-text">{opt.optionText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button
              className="btn btn-secondary"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
            >
              ← Previous
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              {currentIdx < session.questionCount - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit Session"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
          }}
          className="hidden-mobile"
        >
          <div className="card" style={{ position: "sticky", top: 80 }}>
            <div className="card-header">
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Questions
              </span>
            </div>
            <div className="card-body">
              <div className="question-nav">
                {session.questions.map((q, i) => {
                  const ans = session.answers.find((a) => a.questionId === q.id);
                  let cls = "question-nav-item";
                  if (i === currentIdx) cls += " active";
                  else if (ans?.selectedOptionId) cls += " answered";
                  if (ans?.isFlagged) cls += " flagged";
                  return (
                    <button
                      key={q.id}
                      className={cls}
                      onClick={() => setCurrentIdx(i)}
                      title={
                        ans?.isFlagged
                          ? `Q${i + 1} (flagged)`
                          : `Q${i + 1}`
                      }
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Submit button in navigator */}
              <button
                className="btn btn-success btn-sm"
                style={{ width: "100%", marginTop: 12 }}
                onClick={() => handleSubmit()}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit All"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile question nav */}
      <div
        style={{ marginTop: 20, display: "none" }}
        className="show-mobile-block"
      >
        <div className="question-nav">
          {session.questions.map((q, i) => {
            const ans = session.answers.find((a) => a.questionId === q.id);
            let cls = "question-nav-item";
            if (i === currentIdx) cls += " active";
            else if (ans?.selectedOptionId) cls += " answered";
            if (ans?.isFlagged) cls += " flagged";
            return (
              <button
                key={q.id}
                className={cls}
                onClick={() => setCurrentIdx(i)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="dialog-overlay" onClick={() => setShowConfirm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Session?</h3>
            <p>
              {unansweredCount > 0 ? (
                <>
                  You have <strong>{unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}</strong>.
                  Unanswered questions will be marked as incorrect.
                </>
              ) : (
                "All questions have been answered. Are you ready to submit?"
              )}
            </p>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Continue
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSubmit()}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
