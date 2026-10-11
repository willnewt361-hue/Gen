import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getActiveSessionForClient,
  getSessionResults,
  submitSession,
  saveAnswer,
  toggleFlag,
  validateSessionConfig,
  autoSubmitExpiredSessions,
} from "@/lib/queries";

// POST /api/sessions — Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateSessionConfig(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const session = await createSession({
      subjectId: body.subjectId,
      topicId: body.topicId,
      classLevel: body.classLevel,
      difficulty: body.difficulty,
      questionCount: body.questionCount,
      isTimed: body.isTimed ?? false,
      durationMinutes: body.durationMinutes ?? null,
    });

    // Return the active session without answer keys
    const clientSession = await getActiveSessionForClient(session.id);
    return NextResponse.json({ session: clientSession }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

// GET /api/sessions?id=xxx — Get an active session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Try to get results first (for completed/expired sessions)
    const results = await getSessionResults(sessionId);
    if (results) {
      return NextResponse.json({ session: results, completed: true });
    }

    // Otherwise return active session without answer keys
    const clientSession = await getActiveSessionForClient(sessionId);
    if (!clientSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if this is a timed session that has expired
    if (
      clientSession.isTimed &&
      clientSession.deadlineAt &&
      new Date() > new Date(clientSession.deadlineAt)
    ) {
      // Auto-submit
      const submitted = await submitSession(sessionId);
      const results = await getSessionResults(sessionId);
      return NextResponse.json({ session: results, completed: true, autoSubmitted: true });
    }

    return NextResponse.json({ session: clientSession, completed: false });
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
