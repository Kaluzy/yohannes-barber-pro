import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: assertAdminRequest(req) });
}
