import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzleD1<typeof schema>>;

// For Cloudflare D1 - get db from request context
export function getDb(d1: D1Database): DB {
  return drizzleD1(d1, { schema });
}

// Re-export schema
export * from "./schema";

// Type for the Cloudflare env bindings
export interface CloudflareEnv {
  DB: D1Database;
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}
