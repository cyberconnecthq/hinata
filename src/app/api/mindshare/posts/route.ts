import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import type { SocialPost } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const limit = Number(searchParams.get("limit") || 30);

  if (!q) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q required" } }, { status: 400 });
  }

  const result = await surf<SocialPost[]>(
    "search-social-posts",
    { q, limit },
    { ttlSeconds: 120 }
  );

  if (result.error) {
    return NextResponse.json({ error: result.error, data: [] }, { status: 502 });
  }
  return NextResponse.json(result);
}
