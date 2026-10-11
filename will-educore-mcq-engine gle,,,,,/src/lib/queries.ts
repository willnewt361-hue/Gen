import { db } from "@/db";
import {
  subjects,
  topics,
  questions,
  questionOptions,
  sessions,
  sessionQuestions,
  sessionAnswers,
  attempts,
} from "@/db/schema";
import { eq, and, inArray, count, sql, desc, isNull } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type Subject = InferSelectModel<typeof subjects>;
type Topic = InferSelectModel<typeof topics>;
type Question = InferSelectModel<typeof questions>;
type QuestionOption = InferSelectModel<typeof questionOptions>;
type Session = InferSelectModel<typeof sessions>;
type SessionAnswer = InferSelectModel<typeof sessionAnswers>;
type Attempt = InferSelectModel<typeof attempts>;

// ── Subjects & Topics ──────────────────────────────────────────────────────

export async function getAllSubjects() {
  return db.select().from(subjects).orderBy(subjects.name);
}

export async function getSubjectBySlug(slug: string) {
  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.slug, slug));
  return rows[0] ?? null;
}

export async function getTopicsBySubject(subjectId: string) {
  return db
    .select()
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .orderBy(topics.name);
}

export async function getTopicsBySubjectAndClass(
  subjectId: string,
  classLevel: string
) {
  return db
    .select()
    .from(topics)
    .where(and(eq(topics.subjectId, subjectId), eq(topics.classLevel, classLevel as any)))
    .orderBy(topics.name);
}

// ── Questions ──────────────────────────────────────────────────────────────

export async function getQuestionCount(
  topicId: string,
  difficulty: string
) {
  const rows = await db
    .select({ count: count() })
    .from(questions)
    .where(
      and(
        eq(questions.topicId, topicId),
        eq(questions.difficulty, difficulty as any),
        eq(questions.isActive, true)
      )
    );
  return rows[0]?.count ?? 0;
}

export async function getQuestionCountByClassLevel(
  topicId: string,
  difficulty: string,
  classLevel: string
) {
  // Join with topics to filter by class level
  const rows = await db
    .select({ count: count() })
    .from(questions)
    .innerJoin(topics, eq(questions.topicId, topics.id))
    .where(
      and(
        eq(questions.topicId, topicId),
        eq(questions.difficulty, difficulty as any),
        eq(questions.isActive, true),
        eq(topics.classLevel, classLevel as any)
      )
    );
  return rows[0]?.count ?? 0;
}

export async function getRandomQuestions(
  topicId: string,
  difficulty: string,
  limit: number
) {
  // Get random active questions for the topic and difficulty
  const rows = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.topicId, topicId),
        eq(questions.difficulty, difficulty as any),
        eq(questions.isActive, true)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(limit);
  return rows;
}

export async function getQuestionWithOptions(questionId: string) {
  const q = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId));
  if (!q[0]) return null;

  const opts = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.questionId, questionId))
    .orderBy(questionOptions.displayOrder);

  return { ...q[0], options: opts };
}

export async function getQuestionsWithOptions(questionIds: string[]) {
  if (questionIds.length === 0) return [];

  const qs = await db
    .select()
    .from(questions)
    .where(inArray(questions.id, questionIds));

  const opts = await db
    .select()
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds))
    .orderBy(questionOptions.displayOrder);

  const optMap = new Map<string, QuestionOption[]>();
  for (const o of opts) {
    const arr = optMap.get(o.questionId) ?? [];
    arr.push(o);
    optMap.set(o.questionId, arr);
  }

  return qs.map((q) => ({
    ...q,
    options: optMap.get(q.id) ?? [],
  }));
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function createSession({
  subjectId,
  topicId,
  classLevel,
  difficulty,
  questionCount,
  isTimed,
  durationMinutes,
}: {
  subjectId: string;
  topicId: string;
  classLevel: string;
  difficulty: string;
  questionCount: number;
  isTimed: boolean;
  durationMinutes: number | null;
}) {
  // Get random questions
  const selectedQuestions = await getRandomQuestions(
    topicId,
    difficulty,
    questionCount
  );

  if (selectedQuestions.length === 0) {
    throw new Error("No questions available for this configuration");
  }

  const actualCount = selectedQuestions.length;
  const totalMarks = selectedQuestions.reduce(
    (sum, q) => sum + q.markValue,
    0
  );

  const now = new Date();
  const deadline = isTimed && durationMinutes
    ? new Date(now.getTime() + durationMinutes * 60 * 1000)
    : null;

  // Insert session
  const [session] = await db
    .insert(sessions)
    .values({
      subjectId,
      topicId,
      classLevel: classLevel as any,
      difficulty: difficulty as any,
      questionCount: actualCount,
      isTimed,
      durationMinutes,
      startedAt: now,
      deadlineAt: deadline,
      status: "active",
      totalMarks,
    })
    .returning();

  // Insert session questions (ordered)
  await db.insert(sessionQuestions).values(
    selectedQuestions.map((q, i) => ({
      sessionId: session.id,
      questionId: q.id,
      displayOrder: i,
    }))
  );

  // Insert empty session answers for each question
  await db.insert(sessionAnswers).values(
    selectedQuestions.map((q) => ({
      sessionId: session.id,
      questionId: q.id,
      selectedOptionId: null,
      isFlagged: false,
    }))
  );

  return session;
}

export async function getSession(sessionId: string) {
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));
  return rows[0] ?? null;
}

export async function getSessionQuestions(sessionId: string) {
  const sqs = await db
    .select({
      id: sessionQuestions.id,
      questionId: sessionQuestions.questionId,
      displayOrder: sessionQuestions.displayOrder,
    })
    .from(sessionQuestions)
    .where(eq(sessionQuestions.sessionId, sessionId))
    .orderBy(sessionQuestions.displayOrder);

  return sqs;
}

export async function getSessionAnswers(sessionId: string) {
  return db
    .select()
    .from(sessionAnswers)
    .where(eq(sessionAnswers.sessionId, sessionId));
}

export async function getSessionWithQuestions(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session) return null;

  const sqs = await getSessionQuestions(sessionId);
  const questionIds = sqs.map((sq) => sq.questionId);
  const questionsWithOptions = await getQuestionsWithOptions(questionIds);

  // Create a map for quick lookup, preserving order
  const qMap = new Map(questionsWithOptions.map((q) => [q.id, q]));
  const orderedQuestions = sqs.map((sq) => qMap.get(sq.questionId)!).filter(Boolean);

  const answers = await getSessionAnswers(sessionId);
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  return {
    ...session,
    questions: orderedQuestions,
    answers: answerMap,
  };
}

// For active sessions: return questions WITHOUT correct answer info
export async function getActiveSessionForClient(sessionId: string) {
  const data = await getSessionWithQuestions(sessionId);
  if (!data) return null;

  // Strip isCorrect from options
  const safeQuestions = data.questions.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    difficulty: q.difficulty,
    questionText: q.questionText,
    markValue: q.markValue,
    explanation: null, // don't expose during active session
    options: q.options.map((o) => ({
      id: o.id,
      optionKey: o.optionKey,
      optionText: o.optionText,
      // deliberately omit isCorrect
    })),
  }));

  const safeAnswers = Array.from(data.answers.entries()).map(
    ([questionId, a]) => ({
      questionId,
      selectedOptionId: a.selectedOptionId,
      isFlagged: a.isFlagged,
    })
  );

  return {
    ...data,
    questions: safeQuestions,
    answers: safeAnswers,
  };
}

// ── Answer & Flag Updates ──────────────────────────────────────────────────

export async function saveAnswer(
  sessionId: string,
  questionId: string,
  selectedOptionId: string | null
) {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session is not active");
  }

  // Validate option belongs to the question
  if (selectedOptionId) {
    const opts = await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.id, selectedOptionId));
    if (!opts[0] || opts[0].questionId !== questionId) {
      throw new Error("Invalid option for this question");
    }
  }

  await db
    .update(sessionAnswers)
    .set({
      selectedOptionId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sessionAnswers.sessionId, sessionId),
        eq(sessionAnswers.questionId, questionId)
      )
    );
}

export async function toggleFlag(
  sessionId: string,
  questionId: string,
  isFlagged: boolean
) {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session is not active");
  }

  await db
    .update(sessionAnswers)
    .set({
      isFlagged,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sessionAnswers.sessionId, sessionId),
        eq(sessionAnswers.questionId, questionId)
      )
    );
}

// ── Submission ─────────────────────────────────────────────────────────────

export async function submitSession(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status === "completed" || session.status === "expired") {
    // Already submitted — return existing results (idempotent)
    return session;
  }
  if (session.status !== "active") {
    throw new Error("Invalid session state");
  }

  // Check if timed session has expired
  if (session.isTimed && session.deadlineAt && new Date() > session.deadlineAt) {
    // Mark as expired and still process
  }

  // Get all answers with correct option info
  const answers = await getSessionAnswers(sessionId);
  const sqs = await getSessionQuestions(sessionId);
  const questionIds = sqs.map((sq) => sq.questionId);

  // Get correct options for all questions
  const allOptions = await db
    .select()
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds));

  const correctMap = new Map<string, string>(); // questionId -> correct optionId
  for (const o of allOptions) {
    if (o.isCorrect) {
      correctMap.set(o.questionId, o.id);
    }
  }

  // Get question mark values
  const qs = await db
    .select()
    .from(questions)
    .where(inArray(questions.id, questionIds));
  const markMap = new Map(qs.map((q) => [q.id, q.markValue]));

  let marksObtained = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const a of answers) {
    if (!a.selectedOptionId) {
      unansweredCount++;
    } else if (a.selectedOptionId === correctMap.get(a.questionId)) {
      correctCount++;
      marksObtained += markMap.get(a.questionId) ?? 1;
    } else {
      incorrectCount++;
    }
  }

  const percentage =
    session.totalMarks > 0
      ? Math.round((marksObtained / session.totalMarks) * 100)
      : 0;

  const now = new Date();
  const finalStatus: "completed" | "expired" =
    session.isTimed && session.deadlineAt && now > session.deadlineAt
      ? "expired"
      : "completed";

  // Update session
  const [updated] = await db
    .update(sessions)
    .set({
      status: finalStatus,
      submittedAt: now,
      marksObtained,
      correctCount,
      incorrectCount,
      unansweredCount,
      percentage,
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  // Create attempt record
  await db.insert(attempts).values({
    sessionId,
    subjectId: session.subjectId,
    topicId: session.topicId,
    classLevel: session.classLevel,
    difficulty: session.difficulty,
    questionCount: session.questionCount,
    totalMarks: session.totalMarks,
    marksObtained,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    isTimed: session.isTimed,
    durationMinutes: session.durationMinutes,
    completedAt: now,
  });

  return updated;
}

// ── Results (exposes correct answers + explanations) ───────────────────────

export async function getSessionResults(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session || (session.status !== "completed" && session.status !== "expired")) {
    return null;
  }

  const data = await getSessionWithQuestions(sessionId);
  if (!data) return null;

  return data; // includes correct answers and explanations
}

// ── Auto-submit expired sessions ───────────────────────────────────────────

export async function autoSubmitExpiredSessions() {
  const now = new Date();
  const expiredSessions = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.status, "active"),
        eq(sessions.isTimed, true),
        sql`${sessions.deadlineAt} < ${now}`
      )
    );

  const results = [];
  for (const s of expiredSessions) {
    try {
      const result = await submitSession(s.id);
      results.push(result);
    } catch {
      // skip
    }
  }
  return results;
}

// ── Attempts ───────────────────────────────────────────────────────────────

export async function getRecentAttempts(limit = 20) {
  return db
    .select({
      id: attempts.id,
      sessionId: attempts.sessionId,
      subjectId: attempts.subjectId,
      topicId: attempts.topicId,
      classLevel: attempts.classLevel,
      difficulty: attempts.difficulty,
      questionCount: attempts.questionCount,
      totalMarks: attempts.totalMarks,
      marksObtained: attempts.marksObtained,
      percentage: attempts.percentage,
      correctCount: attempts.correctCount,
      incorrectCount: attempts.incorrectCount,
      unansweredCount: attempts.unansweredCount,
      isTimed: attempts.isTimed,
      durationMinutes: attempts.durationMinutes,
      completedAt: attempts.completedAt,
      subjectName: subjects.name,
      topicName: topics.name,
    })
    .from(attempts)
    .innerJoin(subjects, eq(attempts.subjectId, subjects.id))
    .innerJoin(topics, eq(attempts.topicId, topics.id))
    .orderBy(desc(attempts.completedAt))
    .limit(limit);
}

// ── Dashboard Stats ────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const totalAttempts = await db.select({ count: count() }).from(attempts);
  const subjectCount = await db.select({ count: count() }).from(subjects);

  const recentAttempts = await db
    .select({
      percentage: attempts.percentage,
    })
    .from(attempts)
    .orderBy(desc(attempts.completedAt))
    .limit(10);

  const avgPercentage =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce((s, a) => s + a.percentage, 0) /
            recentAttempts.length
        )
      : 0;

  return {
    totalAttempts: totalAttempts[0]?.count ?? 0,
    totalSubjects: subjectCount[0]?.count ?? 0,
    averagePercentage: avgPercentage,
  };
}

// ── Validation helpers ─────────────────────────────────────────────────────

export function validateSessionConfig(body: {
  subjectId?: string;
  topicId?: string;
  classLevel?: string;
  difficulty?: string;
  questionCount?: number;
  isTimed?: boolean;
  durationMinutes?: number;
}): { valid: boolean; error?: string } {
  if (!body.subjectId) return { valid: false, error: "Subject is required" };
  if (!body.topicId) return { valid: false, error: "Topic is required" };
  if (!body.classLevel)
    return { valid: false, error: "Class level is required" };
  if (!body.difficulty)
    return { valid: false, error: "Difficulty is required" };

  const validClassLevels = [
    "senior_1",
    "senior_2",
    "senior_3",
    "senior_4",
    "senior_5",
    "senior_6",
  ];
  if (!validClassLevels.includes(body.classLevel))
    return { valid: false, error: "Invalid class level" };

  const validDifficulties = ["easy", "medium", "hard"];
  if (!validDifficulties.includes(body.difficulty))
    return { valid: false, error: "Invalid difficulty" };

  if (
    !body.questionCount ||
    body.questionCount < 1 ||
    body.questionCount > 100
  )
    return {
      valid: false,
      error: "Question count must be between 1 and 100",
    };

  if (body.isTimed) {
    if (!body.durationMinutes || body.durationMinutes < 1 || body.durationMinutes > 300)
      return {
        valid: false,
        error: "Duration must be between 1 and 300 minutes",
      };
  }

  return { valid: true };
}
