import { NextRequest, NextResponse } from "next/server";
import { addHours, format } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendSms } from "@/lib/notifications";

function authorized(req: NextRequest) {
  return req.headers.get("x-job-key") === process.env.JOBS_SECRET;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const target = addHours(now, 24);
  const date = format(target, "yyyy-MM-dd");
  const hour = target.getHours();

  const { data: appts } = await supabase
    .from("appointments")
    .select("id,customer_name,customer_phone,date,start_time,service_id,barber_id,status")
    .eq("date", date)
    .eq("status", "confirmed");

  const sent: string[] = [];

  for (const a of appts ?? []) {
    const apptHour = Number(a.start_time.slice(0, 2));
    if (Math.abs(apptHour - hour) > 1) continue;

    const { data: existing } = await supabase
      .from("message_logs")
      .select("id")
      .eq("appointment_id", a.id)
      .eq("purpose", "reminder_24h")
      .maybeSingle();

    if (existing) continue;

    const { data: service } = await supabase.from("services").select("name").eq("id", a.service_id).single();
    const { data: barber } = await supabase.from("barbers").select("full_name").eq("id", a.barber_id).single();

    await sendSms(
      {
        toPhone: a.customer_phone,
        customerName: a.customer_name,
        serviceName: service?.name ?? "service",
        barberName: barber?.full_name ?? "barber",
        date: a.date,
        startTime: a.start_time
      },
      "reminder"
    );

    await supabase.from("message_logs").insert({
      appointment_id: a.id,
      purpose: "reminder_24h",
      channel: "sms"
    });

    sent.push(a.id);
  }

  return NextResponse.json({ ok: true, sentCount: sent.length, sent });
}
