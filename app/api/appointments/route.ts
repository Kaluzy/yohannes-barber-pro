import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { endTimeFrom, getSlots, toMinutes } from "@/lib/time";
import { sendBookingEmail, sendSms } from "@/lib/notifications";
import { hasSupabaseEnv } from "@/lib/env";
import { insertAppointment, readDb } from "@/lib/local-db";

const ACTIVE_STATUSES = ["pending", "confirmed", "completed"];

function localDateISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const barberId = req.nextUrl.searchParams.get("barberId");
  const serviceId = req.nextUrl.searchParams.get("serviceId");

  if (!date || !barberId || !serviceId) {
    return NextResponse.json({ error: "date, barberId, serviceId required" }, { status: 400 });
  }

  let service: any = null;
  let appts: any[] = [];
  let blocks: any[] = [];

  if (hasSupabaseEnv()) {
    const supabaseAdmin = getSupabaseAdmin();
    const [{ data: s }, { data: a }, { data: b }] = await Promise.all([
      supabaseAdmin.from("services").select("duration_min").eq("id", serviceId).single(),
      supabaseAdmin
        .from("appointments")
        .select("start_time,end_time,status")
        .eq("barber_id", barberId)
        .eq("date", date)
        .in("status", ACTIVE_STATUSES),
      supabaseAdmin
        .from("blocked_times")
        .select("start_time,end_time")
        .eq("barber_id", barberId)
        .eq("date", date)
    ]);
    service = s;
    appts = a ?? [];
    blocks = b ?? [];
  } else {
    const db = await readDb();
    service = db.services.find((s) => s.id === serviceId);
    appts = db.appointments.filter(
      (a) => a.barber_id === barberId && a.date === date && ACTIVE_STATUSES.includes(a.status)
    );
    blocks = db.blocked_times.filter((b) => b.barber_id === barberId && b.date === date);
  }

  if (!service) return NextResponse.json({ slots: [] });

  const now = new Date();
  const isToday = date === localDateISO(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = getSlots("09:00", "19:00", 30).map((slot) => {
    const slotEnd = endTimeFrom(slot, service.duration_min);
    const s1 = toMinutes(slot.slice(0, 5));
    const e1 = toMinutes(slotEnd.slice(0, 5));

    const collidesAppointment = appts.some((a) => {
      const s2 = toMinutes(a.start_time.slice(0, 5));
      const e2 = toMinutes(a.end_time.slice(0, 5));
      return s1 < e2 && e1 > s2;
    });

    const collidesBlock = blocks.some((b) => {
      const s2 = toMinutes(b.start_time.slice(0, 5));
      const e2 = toMinutes(b.end_time.slice(0, 5));
      return s1 < e2 && e1 > s2;
    });

    const inPast = isToday && s1 <= nowMinutes;
    const outsideHours = e1 > 19 * 60;

    return {
      start_time: slot,
      end_time: slotEnd,
      available: !collidesAppointment && !collidesBlock && !inPast && !outsideHours
    };
  });

  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const required = [
    "customer_name",
    "customer_phone",
    "customer_email",
    "service_id",
    "barber_id",
    "date",
    "start_time"
  ];

  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  let service: any = null;
  let sameDay: any[] = [];
  let blocks: any[] = [];
  let barberName = "your barber";

  if (hasSupabaseEnv()) {
    const supabaseAdmin = getSupabaseAdmin();
    const [{ data: s }, { data: day }, { data: bl }, { data: barber }] = await Promise.all([
      supabaseAdmin
        .from("services")
        .select("duration_min,name,requires_deposit,deposit_amount")
        .eq("id", body.service_id)
        .single(),
      supabaseAdmin
        .from("appointments")
        .select("id,start_time,end_time,status")
        .eq("barber_id", body.barber_id)
        .eq("date", body.date)
        .in("status", ACTIVE_STATUSES),
      supabaseAdmin
        .from("blocked_times")
        .select("start_time,end_time")
        .eq("barber_id", body.barber_id)
        .eq("date", body.date),
      supabaseAdmin.from("barbers").select("full_name").eq("id", body.barber_id).single()
    ]);
    service = s;
    sameDay = day ?? [];
    blocks = bl ?? [];
    barberName = barber?.full_name ?? barberName;
  } else {
    const db = await readDb();
    service = db.services.find((s) => s.id === body.service_id);
    sameDay = db.appointments.filter(
      (a) => a.barber_id === body.barber_id && a.date === body.date && ACTIVE_STATUSES.includes(a.status)
    );
    blocks = db.blocked_times.filter((b) => b.barber_id === body.barber_id && b.date === body.date);
    barberName = db.barbers.find((b) => b.id === body.barber_id)?.full_name ?? barberName;
  }

  if (!service) return NextResponse.json({ error: "Invalid service" }, { status: 400 });

  const end_time = endTimeFrom(body.start_time, service.duration_min);
  const s1 = toMinutes(body.start_time.slice(0, 5));
  const e1 = toMinutes(end_time.slice(0, 5));

  const conflict = sameDay.some((a) => {
    const s2 = toMinutes(a.start_time.slice(0, 5));
    const e2 = toMinutes(a.end_time.slice(0, 5));
    return s1 < e2 && e1 > s2;
  });

  if (conflict) {
    return NextResponse.json({ error: "Time slot no longer available" }, { status: 409 });
  }

  const blocked = blocks.some((b) => {
    const s2 = toMinutes(b.start_time.slice(0, 5));
    const e2 = toMinutes(b.end_time.slice(0, 5));
    return s1 < e2 && e1 > s2;
  });

  if (blocked) {
    return NextResponse.json({ error: "Selected time is blocked" }, { status: 409 });
  }

  const now = new Date();
  const target = new Date(`${body.date}T${body.start_time}`);
  if (target.getTime() < now.getTime()) {
    return NextResponse.json({ error: "Cannot book in the past" }, { status: 400 });
  }

  let appointmentId = "";

  if (hasSupabaseEnv()) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        ...body,
        end_time,
        status: "confirmed"
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    appointmentId = data.id;
  } else {
    const appt = await insertAppointment({
      ...body,
      end_time,
      status: "confirmed"
    });
    appointmentId = appt.id;
  }

  const notifyPayload = {
    toEmail: body.customer_email,
    toPhone: body.customer_phone,
    customerName: body.customer_name,
    serviceName: service.name,
    barberName,
    date: body.date,
    startTime: body.start_time
  };

  await Promise.allSettled([sendBookingEmail(notifyPayload), sendSms(notifyPayload, "confirmation")]);

  return NextResponse.json({
    ok: true,
    appointmentId,
    depositRequired: Boolean(service.requires_deposit),
    depositAmount: Number(service.deposit_amount ?? 0)
  });
}
