import { NextRequest, NextResponse } from "next/server";
import { getQuestionCount } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");

    if (!topicId || !difficulty) {
      return NextResponse.json(
        { error: "topicId and difficulty are required" },
        { status: 400 }
      );
    }

    const count = await getQuestionCount(topicId, difficulty);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting questions:", error);
    return NextResponse.json(
      { error: "Failed to count questions" },
      { status: 500 }
    );
  }
}
