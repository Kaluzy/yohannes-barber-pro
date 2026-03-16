import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hasSupabaseEnv } from "@/lib/env";
import { updateAppointmentStatus } from "@/lib/local-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!assertAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (hasSupabaseEnv()) {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ status: body.status })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    await updateAppointmentStatus(id, body.status);
  }

  return NextResponse.json({ ok: true });
}
