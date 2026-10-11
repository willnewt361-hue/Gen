"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  icon: string | null;
  topics: { id: string; name: string; classLevel: string }[];
}

const CLASS_LEVELS = [
  { value: "senior_1", label: "Senior 1" },
  { value: "senior_2", label: "Senior 2" },
  { value: "senior_3", label: "Senior 3" },
  { value: "senior_4", label: "Senior 4" },
  { value: "senior_5", label: "Senior 5" },
  { value: "senior_6", label: "Senior 6" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Foundational concepts" },
  { value: "medium", label: "Medium", desc: "Application and analysis" },
  { value: "hard", label: "Hard", desc: "Advanced problem-solving" },
];

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /> Loading…</div>}>
      <ConfigureContent />
    </Suspense>
  );
}

function ConfigureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [subjectId, setSubjectId] = useState(searchParams.get("subjectId") || "");
  const [topicId, setTopicId] = useState(searchParams.get("topicId") || "");
  const [classLevel, setClassLevel] = useState(searchParams.get("classLevel") || "senior_3");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [isTimed, setIsTimed] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [availableCount, setAvailableCount] = useState<number | null>(null);

  // Load subjects
  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => {
        setSubjects(d.subjects || []);
        // Auto-seed if empty
        if (!d.subjects || d.subjects.length === 0) {
          fetch("/api/seed", { method: "POST" })
            .then(() => fetch("/api/subjects"))
            .then((r) => r.json())
            .then((d2) => setSubjects(d2.subjects || []))
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get selected subject
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  // Filter topics by selected class level
  const filteredTopics = selectedSubject
    ? selectedSubject.topics.filter((t) => t.classLevel === classLevel)
    : [];

  // Fetch question count when topic + difficulty change
  const fetchCount = useCallback(async () => {
    if (!topicId || !difficulty) {
      setAvailableCount(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/questions/count?topicId=${topicId}&difficulty=${difficulty}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableCount(data.count);
      }
    } catch {
      setAvailableCount(null);
    }
  }, [topicId, difficulty]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Auto-select topic if only one available
  useEffect(() => {
    if (filteredTopics.length === 1 && (!topicId || !filteredTopics.find(t => t.id === topicId))) {
      setTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, topicId]);

  const handleCreate = async () => {
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          topicId,
          classLevel,
          difficulty,
          questionCount,
          isTimed,
          durationMinutes: isTimed ? durationMinutes : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create session");
        return;
      }
      router.push(`/session/${data.session.id}`);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading…
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Configure Session</h1>
      <p className="page-subtitle">
        Set up your MCQ practice or timed test.
      </p>

      {error && (
        <div
          style={{
            background: "var(--danger-light)",
            border: "1px solid var(--danger)",
            borderRadius: 10,
            padding: "12px 20px",
            marginBottom: 20,
            color: "var(--danger)",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-body">
          {/* Subject */}
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
              }}
            >
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Level */}
          <div className="form-group">
            <label className="form-label">Class Level</label>
            <select
              className="form-select"
              value={classLevel}
              onChange={(e) => {
                setClassLevel(e.target.value);
                setTopicId("");
              }}
            >
              {CLASS_LEVELS.map((cl) => (
                <option key={cl.value} value={cl.value}>
                  {cl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div className="form-group">
            <label className="form-label">Topic</label>
            <select
              className="form-select"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={!subjectId}
            >
              <option value="">Select a topic</option>
              {filteredTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {subjectId && filteredTopics.length === 0 && (
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                No topics available for this subject at the selected class level.
              </div>
            )}
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <div style={{ display: "flex", gap: 10 }}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  className={`btn ${difficulty === d.value ? "btn-primary" : "btn-secondary"}`}
                  style={{ flex: 1, flexDirection: "column", padding: "14px 10px" }}
                  onClick={() => setDifficulty(d.value)}
                >
                  <span style={{ fontWeight: 700 }}>{d.label}</span>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      opacity: 0.8,
                      fontWeight: 400,
                    }}
                  >
                    {d.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="form-group">
            <label className="form-label">
              Number of Questions
              {availableCount !== null && (
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: "none",
                    marginLeft: 8,
                  }}
                >
                  (max {availableCount} available)
                </span>
              )}
            </label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={availableCount || 100}
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
            {availableCount !== null && questionCount > availableCount && (
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--warning)",
                  marginTop: 6,
                }}
              >
                Only {availableCount} questions available. Session will use all
                available questions.
              </div>
            )}
          </div>

          {/* Mode */}
          <div className="form-group">
            <label className="form-label">Mode</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className={`btn ${!isTimed ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => setIsTimed(false)}
              >
                📝 Untimed Practice
              </button>
              <button
                className={`btn ${isTimed ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => setIsTimed(true)}
              >
                ⏱️ Timed Test
              </button>
            </div>
          </div>

          {/* Duration (timed only) */}
          {isTimed && (
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select
                className="form-select"
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(parseInt(e.target.value))
                }
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
          )}

          {/* Start Button */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 8 }}
            disabled={!subjectId || !topicId || creating}
            onClick={handleCreate}
          >
            {creating ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Creating Session…
              </>
            ) : (
              <>🚀 Start {isTimed ? "Timed Test" : "Practice"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
