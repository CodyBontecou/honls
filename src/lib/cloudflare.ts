import { getDb, type CloudflareEnv, type DB } from "@/db";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema";

// Singleton for local dev database
let localDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let runtimeCloudflareEnv: Promise<CloudflareEnv | null> | null = null;

function getLocalDatabase() {
  if (!localDb) {
    const sqlite = new Database("huilauloa.db");
    localDb = drizzle(sqlite, { schema });
  }
  return localDb;
}

async function getRuntimeCloudflareEnv(): Promise<CloudflareEnv | null> {
  if (!runtimeCloudflareEnv) {
    runtimeCloudflareEnv = (async () => {
      try {
        const { env } = await import("cloudflare:workers");
        return env as CloudflareEnv;
      } catch {
        return null;
      }
    })();
  }

  return runtimeCloudflareEnv;
}

// Get Cloudflare bindings when running in workerd, or process.env locally
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  const env = await getRuntimeCloudflareEnv();
  if (env) return env;
  return process.env as unknown as CloudflareEnv;
}

export async function getDatabase(): Promise<DB> {
  const env = await getRuntimeCloudflareEnv();

  // In Cloudflare runtime, use D1 binding
  if (env?.DB) {
    return getDb(env.DB);
  }

  // Local fallback for vinext dev/start
  return getLocalDatabase() as unknown as DB;
}
