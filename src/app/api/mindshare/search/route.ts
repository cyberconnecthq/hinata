import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProjectSearchItem {
  id: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo_url?: string;
  description?: string;
  tags?: string[];
  tokens?: { id: string; name: string; symbol?: string; image?: string }[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const limit = Number(searchParams.get("limit") || 8);
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }
  const result = await surf<ProjectSearchItem[]>(
    "search-project",
    { q, limit },
    { ttlSeconds: 600 }
  );
  if (result.error) {
    return NextResponse.json({ error: result.error, data: [] }, { status: 502 });
  }
  return NextResponse.json(result);
}
