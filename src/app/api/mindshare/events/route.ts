import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface ProjectEventItem {
  date: string;
  title: string;
  description?: string;
  type: string;
  logo_url?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const id = searchParams.get("id");
  const type = searchParams.get("type") || undefined;
  const limit = Number(searchParams.get("limit") || 30);

  if (!q && !id) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q or id required" } }, { status: 400 });
  }

  const result = await surf<ProjectEventItem[]>(
    "search-events",
    {
      q: q || undefined,
      id: id || undefined,
      type,
      limit,
    },
    { ttlSeconds: 600 }
  );

  if (result.error) {
    const status = result.error.code === "NOT_FOUND" ? 200 : 502;
    return NextResponse.json({ error: result.error, data: [] }, { status });
  }
  return NextResponse.json(result);
}
