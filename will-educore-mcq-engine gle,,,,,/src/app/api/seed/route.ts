import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: "Database seeded" });
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
