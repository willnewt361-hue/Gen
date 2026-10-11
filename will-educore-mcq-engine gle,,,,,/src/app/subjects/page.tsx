"use client";

import { useEffect, useState } from "react";

interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  topics: { id: string; name: string; slug: string; classLevel: string }[];
}

const CLASS_LABELS: Record<string, string> = {
  senior_1: "Senior 1",
  senior_2: "Senior 2",
  senior_3: "Senior 3",
  senior_4: "Senior 4",
  senior_5: "Senior 5",
  senior_6: "Senior 6",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading subjects…
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Browse Subjects</h1>
      <p className="page-subtitle">
        Select a subject to explore its topics and start practicing.
      </p>

      {subjects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No subjects available</h3>
            <p>
              The question bank has not been seeded yet. Click below to load
              demo content.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: "16px" }}
              onClick={() => {
                fetch("/api/seed", { method: "POST" })
                  .then(() => window.location.reload())
                  .catch(console.error);
              }}
            >
              Seed Demo Content
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {subjects.map((s) => (
            <div key={s.id} className="card">
              <div className="card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.5rem" }}>{s.icon || "📖"}</span>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                    {s.name}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {s.topics.length} topic{s.topics.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="card-body">
                {/* Group topics by class level */}
                {Object.entries(
                  s.topics.reduce(
                    (acc, t) => {
                      const cl = t.classLevel;
                      if (!acc[cl]) acc[cl] = [];
                      acc[cl].push(t);
                      return acc;
                    },
                    {} as Record<string, typeof s.topics>
                  )
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([classLevel, topics]) => (
                    <div key={classLevel} style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "8px",
                        }}
                      >
                        {CLASS_LABELS[classLevel] || classLevel}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {topics.map((t) => (
                          <a
                            key={t.id}
                            href={`/configure?subjectId=${s.id}&topicId=${t.id}&classLevel=${t.classLevel}`}
                            className="btn btn-secondary btn-sm"
                            style={{ textDecoration: "none" }}
                          >
                            {t.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
