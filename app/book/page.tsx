"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { humanTime } from "@/lib/time";
import type { Barber, Service } from "@/types/db";

type Slot = { start_time: string; end_time: string; available: boolean };

export default function BookPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_id: "",
    barber_id: "",
    date: today,
    start_time: "",
    notes: ""
  });

  useEffect(() => {
    async function bootstrap() {
      const res = await fetch("/api/public/bootstrap");
      const data = await res.json();
      const s = (data.services ?? []) as Service[];
      const b = (data.barbers ?? []) as Barber[];

      setServices(s);
      setBarbers(b);

      setForm((prev) => ({
        ...prev,
        service_id: s[0]?.id ?? "",
        barber_id: b[0]?.id ?? ""
      }));
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!form.service_id || !form.barber_id || !form.date) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setError("");
      const params = new URLSearchParams({
        date: form.date,
        barberId: form.barber_id,
        serviceId: form.service_id
      });
      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
      setLoadingSlots(false);
    }

    loadSlots();
  }, [form.service_id, form.barber_id, form.date]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Booking failed.");
        return;
      }

      const qs = new URLSearchParams({ id: data.appointmentId });
      if (data.depositRequired) {
        qs.set("deposit", String(data.depositAmount ?? 0));
      }
      router.push(`/booking/success?${qs.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container-shell py-10">
      <h1 className="text-3xl font-black">Book Your Appointment</h1>
      <p className="mt-2 text-zinc-400">Pick your service, barber, date, and slot.</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <section className="card p-5">
          <h2 className="text-xl font-bold">Booking Details</h2>
          <div className="mt-4 grid gap-3">
            <Input label="Full Name" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} required />
            <Input label="Phone" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} required />
            <Input label="Email" type="email" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} required />

            <Select
              label="Service"
              value={form.service_id}
              onChange={(v) => setForm({ ...form, service_id: v, start_time: "" })}
              options={services.map((s) => ({ value: s.id, label: `${s.name} • ${s.duration_min}m • $${s.price}` }))}
            />

            <Select
              label="Barber"
              value={form.barber_id}
              onChange={(v) => setForm({ ...form, barber_id: v, start_time: "" })}
              options={barbers.map((b) => ({ value: b.id, label: b.full_name }))}
            />

            <label className="text-sm font-medium">
              Date
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value, start_time: "" })}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>

            <label className="text-sm font-medium">
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-bold">Available Slots</h2>
          {loadingSlots ? <p className="mt-3 text-zinc-400">Loading slots...</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {slots.map((s) => (
              <button
                key={s.start_time}
                type="button"
                disabled={!s.available}
                onClick={() => setForm({ ...form, start_time: s.start_time })}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  form.start_time === s.start_time
                    ? "border-gold bg-gold text-black"
                    : s.available
                      ? "border-zinc-700"
                      : "cursor-not-allowed border-zinc-800 text-zinc-600"
                }`}
              >
                {humanTime(s.start_time)}
              </button>
            ))}
          </div>

          {!loadingSlots && slots.length > 0 && slots.every((s) => !s.available) ? (
            <p className="mt-3 text-sm text-amber-400">No available slots for this date. Pick another date.</p>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={!form.start_time || submitting}
            className="mt-5 w-full rounded-xl bg-gold px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </section>
      </form>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
