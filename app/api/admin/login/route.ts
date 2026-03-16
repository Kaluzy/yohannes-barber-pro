import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminKey } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = typeof body?.key === "string" ? body.key : "";

  if (!isValidAdminKey(key)) {
    return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
  return res;
}
