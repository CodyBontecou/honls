import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb, type CloudflareEnv, type DB } from "@/db";

// Get the Cloudflare environment and database
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext();
  return env as CloudflareEnv;
}

export async function getDatabase(): Promise<DB> {
  const env = await getCloudflareEnv();
  return getDb(env.DB);
}
