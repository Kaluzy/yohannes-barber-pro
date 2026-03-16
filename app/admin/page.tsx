"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Appointment, Barber, Service } from "@/types/db";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function servicePinClass(serviceName: string) {
  const key = serviceName.toLowerCase();
  if (key.includes("premium")) return "bg-purple-400 ring-purple-300";
  if (key.includes("haircut + beard") || key.includes("combo")) return "bg-emerald-400 ring-emerald-300";
  if (key.includes("haircut")) return "bg-sky-400 ring-sky-300";
  if (key.includes("beard")) return "bg-amber-400 ring-amber-300";
  if (key.includes("kids")) return "bg-pink-400 ring-pink-300";
  if (key.includes("line")) return "bg-orange-400 ring-orange-300";
  return "bg-zinc-400 ring-zinc-300";
}

function serviceDotClass(serviceName: string) {
  const key = serviceName.toLowerCase();
  if (key.includes("premium")) return "bg-purple-400";
  if (key.includes("haircut + beard") || key.includes("combo")) return "bg-emerald-400";
  if (key.includes("haircut")) return "bg-sky-400";
  if (key.includes("beard")) return "bg-amber-400";
  if (key.includes("kids")) return "bg-pink-400";
  if (key.includes("line")) return "bg-orange-400";
  return "bg-zinc-400";
}

export default function AdminPage() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [adminKey, setAdminKey] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "loading" | "ok" | "unauthorized" | "error">("idle");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"today" | "upcoming" | "no_show" | "all">("upcoming");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [traffic, setTraffic] = useState<{ totalEvents: number; last24h: number; topPaths: { path: string; count: number }[] }>({
    totalEvents: 0,
    last24h: 0,
    topPaths: []
  });
  const [newBarber, setNewBarber] = useState({ full_name: "", slug: "", bio: "" });
  const [blockForm, setBlockForm] = useState({
    barber_id: "",
    date: today,
    start_time: "12:00:00",
    end_time: "13:00:00",
    reason: "Break"
  });

  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/admin/session");
      const data = await res.json();
      if (!data.ok) {
        router.push("/admin/login");
        return;
      }

      const key = localStorage.getItem("admin-key") || "";
      setAdminKey(key);
      loadOverview(key || undefined);
    }

    checkSession();
  }, []);

  useEffect(() => {
    async function loadBarbers() {
      const res = await fetch("/api/public/bootstrap");
      const data = await res.json();
      const arr = (data.barbers ?? []) as Barber[];
      const svc = (data.services ?? []) as Service[];
      setBarbers(arr);
      setServices(svc);
      if (arr[0] && !blockForm.barber_id) {
        setBlockForm((prev) => ({ ...prev, barber_id: arr[0].id }));
      }
    }

    loadBarbers();
  }, [today]);

  async function loadOverview(keyOverride?: string) {
    const key = (keyOverride ?? adminKey).trim();

    setAdminStatus("loading");
    const res = await fetch("/api/admin/overview", {
      headers: key ? { "x-admin-key": key } : undefined
    });

    if (res.status === 401) {
      setAdminStatus("unauthorized");
      return;
    }

    if (!res.ok) {
      setAdminStatus("error");
      return;
    }

    const data = await res.json();
    setAppointments((data.appointments ?? []) as Appointment[]);
    const arr = (data.barbers ?? []) as Barber[];
    if (arr.length) setBarbers(arr);

    const trafficRes = await fetch("/api/admin/traffic", {
      headers: key ? { "x-admin-key": key } : undefined
    });
    if (trafficRes.ok) {
      const t = await trafficRes.json();
      setTraffic(t);
    }

    localStorage.setItem("admin-key", key);
    setAdminStatus("ok");
  }

  useEffect(() => {
    if (!adminKey) return;
    loadOverview();
  }, [adminKey]);

  useEffect(() => {
    if (!adminKey || !autoRefresh) return;
    const t = setInterval(() => {
      loadOverview();
    }, 30000);
    return () => clearInterval(t);
  }, [adminKey, autoRefresh]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return appointments.filter((a) => {
      const isToday = a.date === today;
      const isUpcoming = a.date >= today;

      const viewMatch =
        view === "today"
          ? isToday
          : view === "upcoming"
            ? isUpcoming
            : view === "no_show"
              ? a.status === "no_show"
              : true;

      if (!viewMatch) return false;
      if (!q) return true;

      return [a.customer_name, a.customer_phone, a.customer_email]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [appointments, search, view, today]);

  const stats = useMemo(() => {
    const svcPrice = new Map(services.map((s) => [s.id, Number(s.price)]));
    const todayItems = appointments.filter((a) => a.date === today);
    const completedItems = appointments.filter((a) => a.status === "completed");
    const noShow = appointments.filter((a) => a.status === "no_show").length;

    const todayRevenue = todayItems
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + (svcPrice.get(a.service_id) ?? 0), 0);

    const totalRevenue = completedItems.reduce((sum, a) => sum + (svcPrice.get(a.service_id) ?? 0), 0);

    return {
      todayCount: todayItems.length,
      upcomingCount: appointments.filter((a) => a.date >= today).length,
      completed: completedItems.length,
      noShow,
      noShowRate: appointments.length ? Math.round((noShow / appointments.length) * 100) : 0,
      todayRevenue,
      totalRevenue
    };
  }, [appointments, today, services]);

  function exportCsv() {
    const rows = filteredAppointments.map((a) => ({
      date: a.date,
      start_time: a.start_time,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      customer_email: a.customer_email,
      status: a.status,
      service_id: a.service_id,
      barber_id: a.barber_id
    }));

    const headers = Object.keys(rows[0] ?? {
      date: "",
      start_time: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      status: "",
      service_id: "",
      barber_id: ""
    });

    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function updateStatus(id: string, status: string) {
    if (!adminKey) return alert("Set admin key first");

    const res = await fetch(`/api/admin/appointments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as any } : a)));
    }
  }

  async function blockTime(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("admin-key", adminKey);

    const res = await fetch("/api/admin/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify(blockForm)
    });

    if (res.ok) alert("Time blocked");
    else alert("Failed to block time");
  }

  async function createBarber(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey) return alert("Set admin key first");
    if (!newBarber.full_name.trim()) return alert("Barber name is required");

    const res = await fetch("/api/admin/barbers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify(newBarber)
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error ?? "Failed to add barber");

    setNewBarber({ full_name: "", slug: "", bio: "" });
    await loadOverview(adminKey);
    alert("Barber added");
  }

  return (
    <main className="container-shell py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Owner Dashboard</h1>
          <p className="mt-2 text-zinc-400">Manage appointments, statuses, and blocked times.</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            localStorage.removeItem('admin-key');
            router.push('/admin/login');
          }}
          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
        >
          Logout
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <a href="#admin-reservations" className="rounded-full border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800">Reservations</a>
        <a href="#admin-traffic" className="rounded-full border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800">Traffic</a>
        <a href="#admin-barbers" className="rounded-full border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800">Barbers</a>
        <a href="#admin-block" className="rounded-full border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800">Block Time</a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Today" value={stats.todayCount} />
        <StatCard label="Upcoming" value={stats.upcomingCount} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="No-show" value={stats.noShow} />
        <StatCard label="No-show rate" value={`${stats.noShowRate}%`} />
        <StatCard label="Today income" value={`$${stats.todayRevenue.toFixed(0)}`} />
        <StatCard label="Total income" value={`$${stats.totalRevenue.toFixed(0)}`} />
        <StatCard label="Traffic (24h)" value={traffic.last24h} />
      </div>

      <div className="mt-3 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section id="admin-reservations" className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Reservations</h2>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                Auto-refresh (30s)
              </label>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
              >
                Export CSV
              </button>
              <div className="text-xs text-zinc-400">Showing {filteredAppointments.length}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["no_show", "No-show"],
              ["all", "All"]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key as any)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                  view === key
                    ? "bg-gold text-black ring-gold"
                    : "bg-zinc-900 text-zinc-300 ring-zinc-700 hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
            {services.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1">
                <i className={`h-2.5 w-2.5 rounded-full ${serviceDotClass(s.name)}`} />
                {s.name}
              </span>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, or email"
            className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />

          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-400">
                <tr>
                  <th className="pb-2">When</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Contact</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => (
                  <tr key={a.id} className="border-t border-zinc-800 align-top">
                    <td className="py-4 pr-3 whitespace-nowrap">{format(new Date(`${a.date}T00:00:00`), "MMM d")} {a.start_time.slice(0,5)}</td>
                    <td className="py-4 pr-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-3 w-3 rounded-full ring-2 ${servicePinClass(
                            services.find((s) => s.id === a.service_id)?.name ?? a.service_id
                          )}`}
                          title={services.find((s) => s.id === a.service_id)?.name ?? a.service_id}
                        />
                        <span>{a.customer_name}</span>
                      </div>
                      <p className="mt-1 text-xs font-normal text-zinc-400">
                        {services.find((s) => s.id === a.service_id)?.name ?? a.service_id}
                      </p>
                    </td>
                    <td className="py-4 pr-3 text-zinc-300">{a.customer_phone}<br />{a.customer_email}</td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          a.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                            : a.status === "canceled"
                              ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30"
                              : a.status === "no_show"
                                ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30"
                                : "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30"
                        }`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(a.id, "completed")}
                          className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25"
                        >
                          ✅ Complete
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, "canceled")}
                          className="rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/30 transition hover:bg-rose-500/25"
                        >
                          ✖ Cancel
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, "no_show")}
                          className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25"
                        >
                          ⚠ No-show
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-500">
                      No reservations match this filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-bold">Operations</h2>
          <label className="mt-3 block text-sm">Admin key
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key (local default: local-admin)"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={() => loadOverview(adminKey)}
            className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-2 font-semibold"
          >
            Load Reservations
          </button>

          {adminStatus === "loading" ? <p className="mt-2 text-xs text-zinc-400">Loading…</p> : null}
          {adminStatus === "ok" ? <p className="mt-2 text-xs text-emerald-400">Reservations loaded.</p> : null}
          {adminStatus === "unauthorized" ? <p className="mt-2 text-xs text-red-400">Wrong admin key.</p> : null}
          {adminStatus === "error" ? <p className="mt-2 text-xs text-red-400">Could not load reservations.</p> : null}

          <div id="admin-traffic" className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Top traffic paths (24h)</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-300">
              {traffic.topPaths.length ? traffic.topPaths.map((t) => (
                <div key={t.path} className="flex items-center justify-between">
                  <span>{t.path}</span>
                  <span className="text-zinc-400">{t.count}</span>
                </div>
              )) : <p className="text-zinc-500">No traffic yet.</p>}
            </div>
          </div>

          <form id="admin-barbers" onSubmit={createBarber} className="mt-4 space-y-3 rounded-xl border border-zinc-800 p-3">
            <p className="text-sm font-bold">Add Available Barber</p>
            <label className="block text-sm">Name
              <input value={newBarber.full_name} onChange={(e)=>setNewBarber({...newBarber, full_name: e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <label className="block text-sm">Slug (optional)
              <input value={newBarber.slug} onChange={(e)=>setNewBarber({...newBarber, slug: e.target.value})} placeholder="ex: mike" className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <label className="block text-sm">Bio (optional)
              <input value={newBarber.bio} onChange={(e)=>setNewBarber({...newBarber, bio: e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <button className="w-full rounded-xl bg-gold px-4 py-2 font-bold text-black">Add Barber</button>
            <p className="text-xs text-zinc-500">New barber will appear in booking and admin lists.</p>
          </form>

          <form id="admin-block" onSubmit={blockTime} className="mt-4 space-y-3">
            <label className="block text-sm">Barber
              <select value={blockForm.barber_id} onChange={(e)=>setBlockForm({...blockForm, barber_id: e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                {barbers.map((b)=><option key={b.id} value={b.id}>{b.full_name}</option>)}
              </select>
            </label>
            <label className="block text-sm">Date
              <input type="date" value={blockForm.date} onChange={(e)=>setBlockForm({...blockForm, date: e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <label className="block text-sm">Start time
              <input type="time" value={blockForm.start_time.slice(0,5)} onChange={(e)=>setBlockForm({...blockForm, start_time: `${e.target.value}:00`})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <label className="block text-sm">End time
              <input type="time" value={blockForm.end_time.slice(0,5)} onChange={(e)=>setBlockForm({...blockForm, end_time: `${e.target.value}:00`})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <label className="block text-sm">Reason
              <input value={blockForm.reason} onChange={(e)=>setBlockForm({...blockForm, reason: e.target.value})} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2" />
            </label>
            <button className="w-full rounded-xl bg-gold px-4 py-2 font-bold text-black">Block Time</button>
          </form>
        </section>
      </div>
    </main>
  );
}
