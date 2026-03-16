import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDb } from "@/lib/local-db";

export async function GET(req: NextRequest) {
  if (!assertAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin();
    const [{ data: appointments }, { data: barbers }] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(100),
      supabase.from("barbers").select("*").eq("is_active", true)
    ]);

    return NextResponse.json({ appointments: appointments ?? [], barbers: barbers ?? [] });
  }

  const db = await readDb();
  return NextResponse.json({
    appointments: db.appointments
      .filter((a) => a.date >= today)
      .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`)),
    barbers: db.barbers.filter((b) => b.is_active)
  });
}
