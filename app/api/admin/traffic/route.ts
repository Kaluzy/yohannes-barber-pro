import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { readTraffic } from "@/lib/traffic";

export async function GET(req: NextRequest) {
  if (!assertAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await readTraffic();
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const events24h = db.events.filter((e) => new Date(e.ts).getTime() >= dayAgo);

  const byPath = new Map<string, number>();
  for (const e of events24h) {
    byPath.set(e.path, (byPath.get(e.path) ?? 0) + 1);
  }

  const topPaths = [...byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({ path, count }));

  return NextResponse.json({
    totalEvents: db.events.length,
    last24h: events24h.length,
    topPaths
  });
}
