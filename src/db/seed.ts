import { db, divisions } from "./index";

const divisionData = [
  {
    name: "Under 12",
    slug: "u12",
    description: "Young groms 11 years and under showing the future of bodyboarding",
    minAge: 0,
    maxAge: 11,
    sortOrder: 1,
  },
  {
    name: "Under 18",
    slug: "u18",
    description: "Junior division for competitors 12-17 years old",
    minAge: 12,
    maxAge: 17,
    sortOrder: 2,
  },
  {
    name: "Adult Prone",
    slug: "adult",
    description: "Open division for all adults 18+",
    minAge: 18,
    maxAge: null,
    sortOrder: 3,
  },
  {
    name: "Drop Knee",
    slug: "dropknee",
    description: "DK specialists riding with one knee up",
    minAge: null,
    maxAge: null,
    sortOrder: 4,
  },
  {
    name: "Stand Up",
    slug: "standup",
    description: "Full stand-up bodyboarding division",
    minAge: null,
    maxAge: null,
    sortOrder: 5,
  },
];

async function seed() {
  console.log("🌊 Seeding divisions...");

  for (const div of divisionData) {
    await db.insert(divisions).values(div).onConflictDoNothing();
  }

  console.log("✅ Divisions seeded!");

  const allDivisions = await db.query.divisions.findMany();
  console.log("📋 Current divisions:", allDivisions);
}

seed().catch(console.error);
