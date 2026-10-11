"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  percentage: number;
  questions: Question[];
  answers: Map<string, { selectedOptionId: string | null; isFlagged: boolean }>;
}

export default function ReviewPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/results`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.session) return;
        const s = data.session;
        const answerMap = new Map();
        if (Array.isArray(s.answers)) {
          for (const a of s.answers) {
            answerMap.set(a.questionId, a);
          }
        }
        setResult({ ...s, answers: answerMap });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading review…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="fade-in">
        <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
          <div className="card-body" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>
              Could not load review data.
            </p>
            <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
              Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = result.questions[currentIdx];
  const currentAnswer = result.answers.get(currentQuestion?.id);
  const correctOption = currentQuestion?.options.find((o) => o.isCorrect);
  const isCorrect = currentAnswer?.selectedOptionId === correctOption?.id;
  const isUnanswered = !currentAnswer?.selectedOptionId;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: 24 }}>
        {/* Main review area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nav header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              Reviewing Question {currentIdx + 1} of {result.questions.length}
            </h2>
            <a href={`/results/${sessionId}`} className="btn btn-secondary btn-sm">
              ← Back to Results
            </a>
          </div>

          {/* Question card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              {/* Status badge */}
              <div style={{ marginBottom: 12 }}>
                {isUnanswered ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "var(--bg-secondary)",
                      color: "var(--text-muted)",
                    }}
                  >
                    ○ Unanswered
                  </span>
                ) : isCorrect ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "var(--success-light)",
                      color: "var(--success)",
                    }}
                  >
                    ✓ Correct
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "var(--danger-light)",
                      color: "var(--danger)",
                    }}
                  >
                    ✗ Incorrect
                  </span>
                )}
              </div>

              <div className="question-text">{currentQuestion.questionText}</div>

              {/* Options with correct/incorrect highlighting */}
              {currentQuestion.options.map((opt) => {
                const isSelected = currentAnswer?.selectedOptionId === opt.id;
                const isCorrectOpt = opt.isCorrect;
                let cls = "option-card";
                if (isCorrectOpt) cls += " correct";
                else if (isSelected && !isCorrectOpt) cls += " incorrect";
                else if (isSelected) cls += " selected";

                return (
                  <div key={opt.id} className={cls}>
                    <span className="option-key">{opt.optionKey}</span>
                    <span className="option-text">{opt.optionText}</span>
                    {isCorrectOpt && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--success)",
                          flexShrink: 0,
                        }}
                      >
                        ✓ Correct
                      </span>
                    )}
                    {isSelected && !isCorrectOpt && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--danger)",
                          flexShrink: 0,
                        }}
                      >
                        Your answer
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Explanation */}
              {currentQuestion.explanation && (
                <div className="explanation-box">
                  <h4>Explanation</h4>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            <button
              className="btn btn-secondary"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary"
              disabled={currentIdx === result.questions.length - 1}
              onClick={() => setCurrentIdx(currentIdx + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Question navigator */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="card" style={{ position: "sticky", top: 80 }}>
            <div className="card-header">
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                Questions
              </span>
            </div>
            <div className="card-body">
              <div className="question-nav">
                {result.questions.map((q, i) => {
                  const ans = result.answers.get(q.id);
                  const correctOpt = q.options.find((o) => o.isCorrect);
                  const wasCorrect = ans?.selectedOptionId === correctOpt?.id;
                  const wasUnanswered = !ans?.selectedOptionId;

                  let cls = "question-nav-item";
                  if (i === currentIdx) cls += " active";
                  else if (wasUnanswered) cls += "";
                  else if (wasCorrect) cls += " answered";
                  else cls += " flagged"; // use flagged style for wrong answers

                  return (
                    <button
                      key={q.id}
                      className={cls}
                      onClick={() => setCurrentIdx(i)}
                      title={
                        wasUnanswered
                          ? "Unanswered"
                          : wasCorrect
                            ? "Correct"
                            : "Incorrect"
                      }
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
