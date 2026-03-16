import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendSms } from "@/lib/notifications";

function authorized(req: NextRequest) {
  return req.headers.get("x-job-key") === process.env.JOBS_SECRET;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const { data: appts } = await supabase
    .from("appointments")
    .select("id,customer_name,customer_phone,date,start_time,service_id,barber_id")
    .eq("status", "completed")
    .eq("date", yesterday);

  let sentCount = 0;

  for (const a of appts ?? []) {
    const { data: existing } = await supabase
      .from("message_logs")
      .select("id")
      .eq("appointment_id", a.id)
      .eq("purpose", "review_request")
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
      "review"
    );

    await supabase.from("message_logs").insert({
      appointment_id: a.id,
      purpose: "review_request",
      channel: "sms"
    });

    sentCount++;
  }

  return NextResponse.json({ ok: true, sentCount });
}
