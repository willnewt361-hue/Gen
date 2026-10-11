import { NextRequest, NextResponse } from "next/server";
import { getRecentAttempts } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const attempts = await getRecentAttempts(Math.min(limit, 100));
    return NextResponse.json({ attempts });
  } catch (error: any) {
    console.error("Error fetching attempts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
