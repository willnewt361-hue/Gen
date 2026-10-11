import { NextRequest, NextResponse } from "next/server";
import { getSessionResults } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = await getSessionResults(id);

    if (!results) {
      return NextResponse.json(
        { error: "Results not available — session may still be active" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: results });
  } catch (error: any) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch results" },
      { status: 500 }
    );
  }
}
