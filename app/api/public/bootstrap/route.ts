import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDb } from "@/lib/local-db";

export async function GET() {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin();
    const [{ data: services }, { data: barbers }] = await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("price"),
      supabase.from("barbers").select("*").eq("is_active", true).order("full_name")
    ]);
    return NextResponse.json({ services: services ?? [], barbers: barbers ?? [] });
  }

  const db = await readDb();
  return NextResponse.json({
    services: db.services.filter((s) => s.is_active),
    barbers: db.barbers.filter((b) => b.is_active)
  });
}
