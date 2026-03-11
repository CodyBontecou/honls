import { getAuthHandlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { handlers } = await getAuthHandlers();
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const { handlers } = await getAuthHandlers();
  return handlers.POST(request);
}
