import { NextRequest, NextResponse } from "next/server";
import { addTrafficEvent } from "@/lib/traffic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const path = typeof body?.path === "string" ? body.path.slice(0, 120) : "/";
    await addTrafficEvent(path || "/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
