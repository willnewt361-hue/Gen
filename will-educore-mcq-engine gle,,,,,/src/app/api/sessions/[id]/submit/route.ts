import { NextRequest, NextResponse } from "next/server";
import { submitSession, getSessionResults } from "@/lib/queries";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Submit the session (idempotent — returns existing if already submitted)
    const session = await submitSession(id);

    // Return full results with answer keys
    const results = await getSessionResults(id);
    if (!results) {
      return NextResponse.json(
        { error: "Failed to retrieve results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: {
        id: results.id,
        status: results.status,
        totalMarks: results.totalMarks,
        marksObtained: results.marksObtained,
        percentage: results.percentage,
        correctCount: results.correctCount,
        incorrectCount: results.incorrectCount,
        unansweredCount: results.unansweredCount,
        submittedAt: results.submittedAt,
      },
    });
  } catch (error: any) {
    console.error("Error submitting session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit session" },
      { status: 400 }
    );
  }
}
