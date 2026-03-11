import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("honls.db");
const db = drizzle(sqlite, { schema });

// Hawaiian-inspired competitor names
const names = [
  "Kai Nakamura",
  "Leilani Akana",
  "Makoa Kealoha",
  "Nalu Kaʻimiola",
  "Kona Mahoe",
  "Hina Palakiko",
  "Keoni Lua",
  "Moana Kekoa",
  "Ikaika Santos",
  "Malia Wong",
  "Kaimana Flores",
  "Nahele Kim",
  "Alana Medeiros",
  "Kawika Tanaka",
  "Liko Fernandez",
  "Pua Villanueva",
];

async function seed() {
  console.log("🌊 Seeding tournament data...\n");

  // Get the U12 division
  const u12Division = await db.query.divisions.findFirst({
    where: eq(schema.divisions.slug, "u12"),
  });

  if (!u12Division) {
    console.error("U12 division not found. Run migrations first.");
    process.exit(1);
  }

  // Create a test user
  const [testUser] = await db
    .insert(schema.users)
    .values({
      email: "tournament@honls.test",
      name: "Tournament Admin",
    })
    .onConflictDoNothing()
    .returning();

  const userId = testUser?.id || (await db.query.users.findFirst({ where: eq(schema.users.email, "tournament@honls.test") }))!.id;

  // Create 8 competitors for U12
  console.log("Creating competitors...");
  const competitorIds: string[] = [];
  
  for (let i = 0; i < 8; i++) {
    const [reg] = await db
      .insert(schema.registrations)
      .values({
        userId,
        divisionId: u12Division.id,
        competitorName: names[i],
        status: "confirmed",
        seedNumber: i + 1,
      })
      .returning();
    competitorIds.push(reg.id);
    console.log(`  ${i + 1}. ${names[i]}`);
  }

  // Create rounds
  console.log("\nCreating tournament rounds...");
  
  const [round1] = await db
    .insert(schema.rounds)
    .values({
      divisionId: u12Division.id,
      name: "Round 1",
      roundNumber: 1,
      status: "completed",
    })
    .returning();

  const [semis] = await db
    .insert(schema.rounds)
    .values({
      divisionId: u12Division.id,
      name: "Semifinals",
      roundNumber: 2,
      status: "in_progress",
    })
    .returning();

  const [finals] = await db
    .insert(schema.rounds)
    .values({
      divisionId: u12Division.id,
      name: "Finals",
      roundNumber: 3,
      status: "upcoming",
    })
    .returning();

  console.log("  ✓ Round 1 (completed)");
  console.log("  ✓ Semifinals (in progress)");
  console.log("  ✓ Finals (upcoming)");

  // Round 1: 2 heats of 4 competitors each
  console.log("\nCreating Round 1 heats...");

  const [heat1] = await db
    .insert(schema.heats)
    .values({
      roundId: round1.id,
      heatNumber: 1,
      status: "completed",
      scheduledTime: "7:00 AM",
    })
    .returning();

  const [heat2] = await db
    .insert(schema.heats)
    .values({
      roundId: round1.id,
      heatNumber: 2,
      status: "completed",
      scheduledTime: "7:30 AM",
    })
    .returning();

  // Heat 1 competitors (seeds 1, 4, 5, 8)
  const heat1Comps = [
    { regId: competitorIds[0], w1: 785, w2: 820, w3: 765, total: 1605, place: 1, adv: true },
    { regId: competitorIds[3], w1: 710, w2: 750, w3: 695, total: 1460, place: 2, adv: true },
    { regId: competitorIds[4], w1: 680, w2: 690, w3: 720, total: 1410, place: 3, adv: false },
    { regId: competitorIds[7], w1: 620, w2: 580, w3: 650, total: 1270, place: 4, adv: false },
  ];

  for (const c of heat1Comps) {
    await db.insert(schema.heatCompetitors).values({
      heatId: heat1.id,
      registrationId: c.regId,
      wave1Score: c.w1,
      wave2Score: c.w2,
      wave3Score: c.w3,
      totalScore: c.total,
      placement: c.place,
      advanced: c.adv,
    });
  }
  console.log("  ✓ Heat 1 (4 competitors)");

  // Heat 2 competitors (seeds 2, 3, 6, 7)
  const heat2Comps = [
    { regId: competitorIds[1], w1: 810, w2: 780, w3: 850, total: 1660, place: 1, adv: true },
    { regId: competitorIds[2], w1: 720, w2: 760, w3: 740, total: 1500, place: 2, adv: true },
    { regId: competitorIds[5], w1: 650, w2: 700, w3: 680, total: 1380, place: 3, adv: false },
    { regId: competitorIds[6], w1: 600, w2: 640, w3: 590, total: 1240, place: 4, adv: false },
  ];

  for (const c of heat2Comps) {
    await db.insert(schema.heatCompetitors).values({
      heatId: heat2.id,
      registrationId: c.regId,
      wave1Score: c.w1,
      wave2Score: c.w2,
      wave3Score: c.w3,
      totalScore: c.total,
      placement: c.place,
      advanced: c.adv,
    });
  }
  console.log("  ✓ Heat 2 (4 competitors)");

  // Semifinals: 1 heat with 4 advancing competitors
  console.log("\nCreating Semifinals heat...");

  const [semiHeat] = await db
    .insert(schema.heats)
    .values({
      roundId: semis.id,
      heatNumber: 1,
      status: "in_progress",
      scheduledTime: "9:00 AM",
    })
    .returning();

  // Semifinals competitors (top 2 from each heat)
  const semiComps = [
    { regId: competitorIds[1], w1: 830, w2: null, w3: null, total: null, place: null, adv: false }, // Currently leading
    { regId: competitorIds[0], w1: 790, w2: null, w3: null, total: null, place: null, adv: false },
    { regId: competitorIds[2], w1: 750, w2: null, w3: null, total: null, place: null, adv: false },
    { regId: competitorIds[3], w1: 680, w2: null, w3: null, total: null, place: null, adv: false },
  ];

  for (const c of semiComps) {
    await db.insert(schema.heatCompetitors).values({
      heatId: semiHeat.id,
      registrationId: c.regId,
      wave1Score: c.w1,
      wave2Score: c.w2,
      wave3Score: c.w3,
      totalScore: c.total,
      placement: c.place,
      advanced: c.adv,
    });
  }
  console.log("  ✓ Semifinal Heat (4 competitors, in progress)");

  // Finals: Empty heat awaiting semifinal results
  console.log("\nCreating Finals heat...");

  await db.insert(schema.heats).values({
    roundId: finals.id,
    heatNumber: 1,
    status: "upcoming",
    scheduledTime: "11:00 AM",
  });
  console.log("  ✓ Final Heat (TBD)");

  console.log("\n✅ Seed complete! U12 division now has tournament data.\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
