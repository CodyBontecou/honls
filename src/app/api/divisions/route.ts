import { NextResponse } from "next/server";
import { db, divisions } from "@/db";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allDivisions = await db.query.divisions.findMany({
      orderBy: asc(divisions.sortOrder),
    });

    return NextResponse.json({ divisions: allDivisions });
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
