import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { AppointmentStatus, Barber } from "@/types/db";

type LocalService = {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  deposit_amount: number;
  requires_deposit: boolean;
  description: string;
  is_active: boolean;
};

type LocalBarber = {
  id: string;
  full_name: string;
  slug: string;
  bio: string;
  avatar_url: string | null;
  is_active: boolean;
};

type LocalAppointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
};

type LocalBlock = {
  id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
};

type LocalDB = {
  services: LocalService[];
  barbers: LocalBarber[];
  appointments: LocalAppointment[];
  blocked_times: LocalBlock[];
};

const DB_PATH = join(process.cwd(), "data", "local-db.json");

const seed: LocalDB = {
  services: [
    { id: "svc-haircut", name: "Haircut", duration_min: 45, price: 40, deposit_amount: 0, requires_deposit: false, description: "Fade or classic cut.", is_active: true },
    { id: "svc-beard", name: "Beard Trim", duration_min: 25, price: 25, deposit_amount: 0, requires_deposit: false, description: "Beard shaping.", is_active: true },
    { id: "svc-combo", name: "Haircut + Beard", duration_min: 60, price: 60, deposit_amount: 10, requires_deposit: true, description: "Most booked combo.", is_active: true },
    { id: "svc-kids", name: "Kids Cut", duration_min: 30, price: 30, deposit_amount: 0, requires_deposit: false, description: "Under 12.", is_active: true },
    { id: "svc-lineup", name: "Line Up", duration_min: 20, price: 20, deposit_amount: 0, requires_deposit: false, description: "Quick refresh.", is_active: true },
    { id: "svc-premium", name: "Premium Package", duration_min: 75, price: 80, deposit_amount: 20, requires_deposit: true, description: "Full grooming package.", is_active: true }
  ],
  barbers: [
    { id: "barber-yohannes", full_name: "Yohannes", slug: "yohannes", bio: "Precision fades and beard sculpting.", avatar_url: null, is_active: true }
  ],
  appointments: [],
  blocked_times: []
};

async function ensureDb() {
  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await writeFile(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
  }
}

export async function readDb(): Promise<LocalDB> {
  await ensureDb();
  const raw = await readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as LocalDB;
}

export async function writeDb(db: LocalDB) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function insertAppointment(
  payload: Omit<LocalAppointment, "id" | "created_at">
): Promise<LocalAppointment> {
  const db = await readDb();
  const appt: LocalAppointment = {
    ...payload,
    id: randomUUID(),
    created_at: new Date().toISOString()
  };
  db.appointments.push(appt);
  await writeDb(db);
  return appt;
}

export async function addBlockedTime(payload: Omit<LocalBlock, "id">) {
  const db = await readDb();
  db.blocked_times.push({ ...payload, id: randomUUID() });
  await writeDb(db);
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const db = await readDb();
  db.appointments = db.appointments.map((a) => (a.id === id ? { ...a, status } : a));
  await writeDb(db);
}

export async function addBarber(payload: {
  full_name: string;
  slug: string;
  bio?: string;
  avatar_url?: string | null;
  is_active?: boolean;
}): Promise<Barber> {
  const db = await readDb();
  const barber: Barber = {
    id: `barber-${payload.slug}`,
    full_name: payload.full_name,
    slug: payload.slug,
    bio: payload.bio ?? "",
    avatar_url: payload.avatar_url ?? null,
    is_active: payload.is_active ?? true
  };
  db.barbers.push(barber as any);
  await writeDb(db);
  return barber;
}
