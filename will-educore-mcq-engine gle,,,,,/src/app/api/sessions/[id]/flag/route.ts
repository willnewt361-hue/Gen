import { NextRequest, NextResponse } from "next/server";
import { toggleFlag } from "@/lib/queries";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { questionId, isFlagged } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    await toggleFlag(id, questionId, isFlagged ?? false);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error toggling flag:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle flag" },
      { status: 400 }
    );
  }
}
