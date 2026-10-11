import { NextRequest, NextResponse } from "next/server";
import { saveAnswer } from "@/lib/queries";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { questionId, selectedOptionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    await saveAnswer(id, questionId, selectedOptionId ?? null);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving answer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save answer" },
      { status: 400 }
    );
  }
}
