import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, type CloudflareEnv, type DB } from "@/db";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema";

// Singleton for local dev database
let localDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getLocalDatabase() {
  if (!localDb) {
    const sqlite = new Database("honls.db");
    localDb = drizzle(sqlite, { schema });
  }
  return localDb;
}

// Get the Cloudflare environment and database
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext();
  return env as CloudflareEnv;
}

export async function getDatabase(): Promise<DB> {
  // In local development, use better-sqlite3
  if (process.env.NODE_ENV === "development") {
    return getLocalDatabase() as unknown as DB;
  }
  
  // In production, use Cloudflare D1
  const env = await getCloudflareEnv();
  return getDb(env.DB);
}
