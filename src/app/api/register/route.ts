import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/cloudflare";
import { registrations, divisions } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to register" },
        { status: 401 }
      );
    }

    const { divisionId, competitorName, dateOfBirth, emergencyContact, emergencyPhone } = await request.json() as {
      divisionId: string;
      competitorName: string;
      dateOfBirth?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
    };

    if (!divisionId || !competitorName) {
      return NextResponse.json(
        { error: "Division and competitor name are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if division exists
    const division = await db.query.divisions.findFirst({
      where: eq(divisions.id, divisionId),
    });

    if (!division) {
      return NextResponse.json(
        { error: "Invalid division" },
        { status: 400 }
      );
    }

    // Check for existing registration in this division
    const existingReg = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.userId, session.user.id),
        eq(registrations.divisionId, divisionId)
      ),
    });

    if (existingReg) {
      return NextResponse.json(
        { error: "You are already registered for this division" },
        { status: 400 }
      );
    }

    // Create registration
    const [newReg] = await db
      .insert(registrations)
      .values({
        userId: session.user.id,
        divisionId,
        competitorName,
        dateOfBirth,
        emergencyContact,
        emergencyPhone,
        status: "confirmed",
      })
      .returning();

    return NextResponse.json({ registration: newReg });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const userRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.userId, session.user.id),
    });

    return NextResponse.json({ registrations: userRegistrations });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { registrationId } = await request.json() as { registrationId: string };

    const db = await getDatabase();
    const reg = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.id, registrationId),
        eq(registrations.userId, session.user.id)
      ),
    });

    if (!reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    await db.delete(registrations).where(eq(registrations.id, registrationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
