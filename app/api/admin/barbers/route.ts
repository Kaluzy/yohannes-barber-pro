import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addBarber, readDb } from "@/lib/local-db";

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  if (!assertAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("barbers").select("*").order("full_name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ barbers: data ?? [] });
  }

  const db = await readDb();
  return NextResponse.json({ barbers: db.barbers });
}

export async function POST(req: NextRequest) {
  if (!assertAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.full_name) {
    return NextResponse.json({ error: "full_name required" }, { status: 400 });
  }

  const slug = slugify(body.slug || body.full_name);
  if (!slug) return NextResponse.json({ error: "invalid slug" }, { status: 400 });

  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("barbers").select("id").eq("slug", slug).maybeSingle();
    if (existing) return NextResponse.json({ error: "slug already exists" }, { status: 409 });

    const { data, error } = await supabase
      .from("barbers")
      .insert({
        full_name: body.full_name,
        slug,
        bio: body.bio ?? "",
        avatar_url: body.avatar_url ?? null,
        is_active: body.is_active ?? true
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, barber: data });
  }

  const db = await readDb();
  if (db.barbers.some((b) => b.slug === slug)) {
    return NextResponse.json({ error: "slug already exists" }, { status: 409 });
  }

  const barber = await addBarber({
    full_name: body.full_name,
    slug,
    bio: body.bio ?? "",
    avatar_url: body.avatar_url ?? null,
    is_active: body.is_active ?? true
  });

  return NextResponse.json({ ok: true, barber });
}
