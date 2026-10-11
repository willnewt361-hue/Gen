import { NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select({ count: count() }).from(subjects);
    return NextResponse.json({
      status: "ok",
      database: "connected",
      subjects: result[0]?.count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", database: "disconnected" },
      { status: 503 }
    );
  }
}
