import { NextResponse } from "next/server";
import { getAllSubjects, getTopicsBySubject } from "@/lib/queries";

export async function GET() {
  try {
    const subjectList = await getAllSubjects();
    const result = [];
    for (const s of subjectList) {
      const topicList = await getTopicsBySubject(s.id);
      result.push({
        ...s,
        topics: topicList,
      });
    }
    return NextResponse.json({ subjects: result });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
