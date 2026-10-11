import { NextResponse } from "next/server";
import { getDashboardStats, getAllSubjects, getRecentAttempts } from "@/lib/queries";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    const subjectList = await getAllSubjects();
    const recentAttempts = await getRecentAttempts(5);
    return NextResponse.json({
      stats,
      subjects: subjectList,
      recentAttempts,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
