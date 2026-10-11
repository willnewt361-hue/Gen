import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "completed",
  "expired",
]);
export const classLevelEnum = pgEnum("class_level", [
  "senior_1",
  "senior_2",
  "senior_3",
  "senior_4",
  "senior_5",
  "senior_6",
]);

// ── Subjects ───────────────────────────────────────────────────────────────

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    icon: text("icon"), // emoji or icon identifier
    color: text("color"), // tailwind color class
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("subjects_slug_idx").on(table.slug)]
);

// ── Topics ─────────────────────────────────────────────────────────────────

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    classLevel: classLevelEnum("class_level").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("topics_subject_idx").on(table.subjectId),
    index("topics_class_level_idx").on(table.classLevel),
    index("topics_subject_class_idx").on(table.subjectId, table.classLevel),
  ]
);

// ── Questions ──────────────────────────────────────────────────────────────

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    difficulty: difficultyEnum("difficulty").notNull(),
    questionText: text("question_text").notNull(),
    markValue: integer("mark_value").notNull().default(1),
    explanation: text("explanation"),
    resourceRef: text("resource_ref"), // optional link to future resource
    isActive: boolean("is_active").notNull().default(true),
    isDemo: boolean("is_demo").notNull().default(true), // seeded demo content
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("questions_topic_idx").on(table.topicId),
    index("questions_difficulty_idx").on(table.difficulty),
    index("questions_active_idx").on(table.isActive),
    index("questions_topic_diff_idx").on(table.topicId, table.difficulty, table.isActive),
  ]
);

// ── Question Options ───────────────────────────────────────────────────────

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    optionKey: text("option_key").notNull(), // "A", "B", "C", "D"
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    index("question_options_question_idx").on(table.questionId),
  ]
);

// ── Sessions ───────────────────────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
    classLevel: classLevelEnum("class_level").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    questionCount: integer("question_count").notNull(),
    isTimed: boolean("is_timed").notNull().default(false),
    durationMinutes: integer("duration_minutes"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    status: sessionStatusEnum("status").notNull().default("active"),
    totalMarks: integer("total_marks").notNull().default(0),
    marksObtained: integer("marks_obtained"),
    correctCount: integer("correct_count"),
    incorrectCount: integer("incorrect_count"),
    unansweredCount: integer("unanswered_count"),
    percentage: integer("percentage"), // stored as 0-100
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sessions_status_idx").on(table.status),
    index("sessions_subject_idx").on(table.subjectId),
    index("sessions_deadline_idx").on(table.deadlineAt),
  ]
);

// ── Session Questions (ordered list of questions in a session) ─────────────

export const sessionQuestions = pgTable(
  "session_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    index("session_questions_session_idx").on(table.sessionId),
  ]
);

// ── Session Answers ────────────────────────────────────────────────────────

export const sessionAnswers = pgTable(
  "session_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    selectedOptionId: uuid("selected_option_id").references(() => questionOptions.id),
    isFlagged: boolean("is_flagged").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("session_answers_session_idx").on(table.sessionId),
    index("session_answers_session_question_idx").on(
      table.sessionId,
      table.questionId
    ),
  ]
);

// ── Previous Attempts (completed session summary) ──────────────────────────

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id)
      .unique(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
    classLevel: classLevelEnum("class_level").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    questionCount: integer("question_count").notNull(),
    totalMarks: integer("total_marks").notNull(),
    marksObtained: integer("marks_obtained").notNull(),
    percentage: integer("percentage").notNull(),
    correctCount: integer("correct_count").notNull(),
    incorrectCount: integer("incorrect_count").notNull(),
    unansweredCount: integer("unanswered_count").notNull(),
    isTimed: boolean("is_timed").notNull(),
    durationMinutes: integer("duration_minutes"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("attempts_subject_idx").on(table.subjectId),
    index("attempts_completed_idx").on(table.completedAt),
  ]
);
