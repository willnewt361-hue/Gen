"use client";

import { useEffect, useState } from "react";

interface Attempt {
  id: string;
  sessionId: string;
  subjectName: string;
  topicName: string;
  classLevel: string;
  difficulty: string;
  questionCount: number;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  isTimed: boolean;
  durationMinutes: number | null;
  completedAt: string;
}

const CLASS_LABELS: Record<string, string> = {
  senior_1: "S1",
  senior_2: "S2",
  senior_3: "S3",
  senior_4: "S4",
  senior_5: "S5",
  senior_6: "S6",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--success)",
  medium: "var(--warning)",
  hard: "var(--danger)",
};

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attempts?limit=50")
      .then((r) => r.json())
      .then((d) => setAttempts(d.attempts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading attempts…
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="fade-in">
        <h1 className="page-title">Attempt History</h1>
        <p className="page-subtitle">Your completed practice sessions and tests.</p>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No attempts yet</h3>
            <p>Complete a practice session to see your history here.</p>
            <a
              href="/configure"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              Start Practicing
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Compute stats
  const avgPercentage = Math.round(
    attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
  );
  const bestPercentage = Math.max(...attempts.map((a) => a.percentage));
  const totalQuestions = attempts.reduce((sum, a) => sum + a.questionCount, 0);

  return (
    <div className="fade-in">
      <h1 className="page-title">Attempt History</h1>
      <p className="page-subtitle">Your completed practice sessions and tests.</p>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: "var(--accent)" }}>
            {attempts.length}
          </div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {avgPercentage}%
          </div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="card stat-card">
          <div
            className="stat-value"
            style={{ color: "var(--accent)" }}
          >
            {bestPercentage}%
          </div>
          <div className="stat-label">Best Score</div>
        </div>
        <div className="card stat-card">
          <div
            className="stat-value"
            style={{ color: "var(--text-primary)" }}
          >
            {totalQuestions}
          </div>
          <div className="stat-label">Questions Done</div>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
            All Attempts
          </span>
        </div>
        <div>
          {attempts.map((a) => (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.875rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{a.subjectName}</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {a.topicName} · {CLASS_LABELS[a.classLevel] || a.classLevel}
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color:
                      DIFFICULTY_COLORS[a.difficulty] || "var(--text-secondary)",
                  }}
                >
                  {a.difficulty.toUpperCase()}
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {a.percentage}%
                </span>
              </div>
              <div style={{ textAlign: "center", color: "var(--success)" }}>
                {a.correctCount}/{a.questionCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {a.isTimed ? `⏱ ${a.durationMinutes}m` : "📝"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <a
                  href={`/review/${a.sessionId}`}
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: "none" }}
                >
                  Review
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
