import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").unique().notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
}, (vt) => [
  primaryKey({ columns: [vt.identifier, vt.token] }),
]);

export const divisions = sqliteTable("divisions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  sortOrder: integer("sort_order").default(0),
});

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  divisionId: text("division_id").notNull().references(() => divisions.id, { onDelete: "cascade" }),
  competitorName: text("competitor_name").notNull(),
  dateOfBirth: text("date_of_birth"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  status: text("status").default("pending"), // pending, confirmed, withdrawn
  seedNumber: integer("seed_number"), // seeding position for bracket
});

// Tournament rounds within a division
export const rounds = sqliteTable("rounds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  divisionId: text("division_id").notNull().references(() => divisions.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Round 1", "Quarterfinals", "Semifinals", "Finals"
  roundNumber: integer("round_number").notNull(), // 1, 2, 3, 4... (lower = earlier)
  status: text("status").default("upcoming"), // upcoming, in_progress, completed
});

// Heats within a round (3-4 competitors per heat)
export const heats = sqliteTable("heats", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roundId: text("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
  heatNumber: integer("heat_number").notNull(),
  status: text("status").default("upcoming"), // upcoming, in_progress, completed
  scheduledTime: text("scheduled_time"),
});

// Competitors assigned to heats with their scores
export const heatCompetitors = sqliteTable("heat_competitors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  heatId: text("heat_id").notNull().references(() => heats.id, { onDelete: "cascade" }),
  registrationId: text("registration_id").notNull().references(() => registrations.id, { onDelete: "cascade" }),
  wave1Score: integer("wave_1_score"), // Score * 100 for precision (850 = 8.50)
  wave2Score: integer("wave_2_score"),
  wave3Score: integer("wave_3_score"),
  totalScore: integer("total_score"), // Best 2 of 3 waves combined
  placement: integer("placement"), // 1st, 2nd, 3rd, 4th in heat
  advanced: integer("advanced", { mode: "boolean" }).default(false),
});
