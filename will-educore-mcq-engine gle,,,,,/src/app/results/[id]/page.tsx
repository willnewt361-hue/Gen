"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Option {
  id: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  markValue: number;
  explanation: string | null;
  options: Option[];
}

interface SessionResult {
  id: string;
  status: string;
  isTimed: boolean;
  questionCount: number;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questions: Question[];
  answers: Map<string, { selectedOptionId: string | null; isFlagged: boolean }>;
  submittedAt: string | null;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.session) {
          setError("Results not available");
          return;
        }
        const s = data.session;
        // Convert answers array to map
        const answerMap = new Map();
        if (Array.isArray(s.answers)) {
          for (const a of s.answers) {
            answerMap.set(a.questionId, a);
          }
        }
        setResult({ ...s, answers: answerMap });
      })
      .catch((e) => setError(e.message || "Failed to load results"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading results…
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
          <div className="card-body" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</p>
            <a href="/" className="btn btn-primary">
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const passed = result.percentage >= 50;
  const pctColor =
    result.percentage >= 70
      ? "var(--success)"
      : result.percentage >= 50
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <div className="fade-in">
      {/* Score Card */}
      <div className="card" style={{ marginBottom: 24, textAlign: "center" }}>
        <div className="card-body" style={{ padding: "32px" }}>
          <div className="result-score" style={{ color: pctColor, marginBottom: 8 }}>
            {result.percentage}%
          </div>
          <div
            className={`result-badge ${passed ? "pass" : "fail"}`}
            style={{ marginBottom: 16 }}
          >
            {passed ? "✓ PASS" : "✗ BELOW PASS MARK"}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 32,
              marginTop: 20,
              fontSize: "0.9375rem",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--success)" }}>
                {result.correctCount}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                Correct
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--danger)" }}>
                {result.incorrectCount}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                Incorrect
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-muted)" }}>
                {result.unansweredCount}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                Unanswered
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>
                {result.marksObtained}/{result.totalMarks}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                Marks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <a href={`/review/${sessionId}`} className="btn btn-primary">
          📋 Review Answers
        </a>
        <a href="/configure" className="btn btn-secondary">
          🔄 Retry
        </a>
        <a href="/" className="btn btn-secondary">
          🏠 Dashboard
        </a>
      </div>

      {/* Question Summary */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
            Question Summary
          </span>
        </div>
        <div>
          {result.questions.map((q, i) => {
            const answer = result.answers.get(q.id);
            const correctOption = q.options.find((o) => o.isCorrect);
            const isCorrect = answer?.selectedOptionId === correctOption?.id;
            const isUnanswered = !answer?.selectedOptionId;

            return (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: "0.875rem",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    flexShrink: 0,
                    background: isUnanswered
                      ? "var(--bg-secondary)"
                      : isCorrect
                        ? "var(--success-light)"
                        : "var(--danger-light)",
                    color: isUnanswered
                      ? "var(--text-muted)"
                      : isCorrect
                        ? "var(--success)"
                        : "var(--danger)",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.questionText}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: isUnanswered
                      ? "var(--text-muted)"
                      : isCorrect
                        ? "var(--success)"
                        : "var(--danger)",
                  }}
                >
                  {isUnanswered ? "—" : isCorrect ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
