import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const { appointmentId } = await req.json();
  if (!appointmentId) return NextResponse.json({ error: "appointmentId required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id,customer_name,service_id")
    .eq("id", appointmentId)
    .single();

  if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  const { data: service } = await supabase
    .from("services")
    .select("name,deposit_amount,requires_deposit")
    .eq("id", appt.service_id)
    .single();

  if (!service?.requires_deposit || Number(service.deposit_amount) <= 0) {
    return NextResponse.json({ error: "Deposit not required" }, { status: 400 });
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?id=${appt.id}&paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?id=${appt.id}&paid=0`,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": `Deposit — ${service.name}`,
      "line_items[0][price_data][unit_amount]": String(Math.round(Number(service.deposit_amount) * 100)),
      "line_items[0][quantity]": "1",
      "metadata[appointment_id]": appt.id,
      "metadata[customer_name]": appt.customer_name
    })
  });

  const stripe = await stripeRes.json();
  if (!stripeRes.ok) {
    return NextResponse.json({ error: stripe.error?.message ?? "Stripe error" }, { status: 500 });
  }

  return NextResponse.json({ url: stripe.url });
}
