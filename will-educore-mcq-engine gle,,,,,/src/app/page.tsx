"use client";

import { useEffect, useState } from "react";

interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  topics: { id: string; name: string; classLevel: string }[];
}

interface Attempt {
  id: string;
  subjectName: string;
  topicName: string;
  percentage: number;
  correctCount: number;
  questionCount: number;
  completedAt: string;
  difficulty: string;
  isTimed: boolean;
}

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState({ totalAttempts: 0, totalSubjects: 0, averagePercentage: 0 });
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, subjRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/subjects"),
        ]);
        if (dashRes.ok) {
          const dash = await dashRes.json();
          setStats(dash.stats);
          setRecentAttempts(dash.recentAttempts || []);
        }
        if (subjRes.ok) {
          const subj = await subjRes.json();
          setSubjects(subj.subjects || []);
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading dashboard…
      </div>
    );
  }

  const difficultyColor: Record<string, string> = {
    easy: "var(--success)",
    medium: "var(--warning)",
    hard: "var(--danger)",
  };

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: "32px" }}>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: "var(--accent)" }}>
            {stats.totalSubjects}
          </div>
          <div className="stat-label">Subjects Available</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {stats.totalAttempts}
          </div>
          <div className="stat-label">Completed Attempts</div>
        </div>
        <div className="card stat-card">
          <div
            className="stat-value"
            style={{
              color:
                stats.averagePercentage >= 50
                  ? "var(--success)"
                  : "var(--danger)",
            }}
          >
            {stats.averagePercentage}%
          </div>
          <div className="stat-label">Average Score</div>
        </div>
      </div>

      {/* Quick Start */}
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>
        Quick Start
      </h3>
      <div className="grid-2" style={{ marginBottom: "32px" }}>
        <a href="/configure" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              padding: "28px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              🎯
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                Start Practice
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Configure and begin an MCQ session
              </div>
            </div>
          </div>
        </a>
        <a href="/subjects" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              padding: "28px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "var(--success-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              📚
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                Browse Subjects
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Explore topics and questions
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* Subjects Overview */}
      {subjects.length > 0 && (
        <>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Subjects
          </h3>
          <div className="grid-4" style={{ marginBottom: "32px" }}>
            {subjects.map((s) => (
              <a
                key={s.id}
                href={`/configure?subjectId=${s.id}`}
                className="card subject-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="subject-icon">{s.icon || "📖"}</div>
                <div>
                  <div className="subject-name">{s.name}</div>
                  <div className="subject-topics">
                    {s.topics.length} topic{s.topics.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Recent Attempts */}
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>
        Recent Attempts
      </h3>
      {recentAttempts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No attempts yet</h3>
            <p>Start a practice session to see your results here.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          {recentAttempts.map((a) => (
            <div className="attempt-row" key={a.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.subjectName}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {a.topicName}
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: difficultyColor[a.difficulty] || "var(--text-secondary)",
                  }}
                >
                  {a.difficulty.toUpperCase()}
                </span>
              </div>
              <div style={{ fontWeight: 600 }}>{a.percentage}%</div>
              <div style={{ color: "var(--text-secondary)" }}>
                {a.correctCount}/{a.questionCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {new Date(a.completedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
