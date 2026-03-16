import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hasSupabaseEnv } from "@/lib/env";
import { addBlockedTime } from "@/lib/local-db";

export async function POST(req: NextRequest) {
  if (!assertAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const required = ["barber_id", "date", "start_time", "end_time", "reason"];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} required` }, { status: 400 });
    }
  }

  if (hasSupabaseEnv()) {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("blocked_times").insert(body);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    await addBlockedTime(body);
  }

  return NextResponse.json({ ok: true });
}
