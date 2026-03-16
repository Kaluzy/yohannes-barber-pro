import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type TrafficEvent = { path: string; ts: string };

type TrafficDb = {
  events: TrafficEvent[];
};

const TRAFFIC_PATH = join(process.cwd(), "data", "traffic.json");

async function ensureTrafficDb() {
  try {
    await readFile(TRAFFIC_PATH, "utf8");
  } catch {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await writeFile(TRAFFIC_PATH, JSON.stringify({ events: [] }, null, 2), "utf8");
  }
}

export async function readTraffic(): Promise<TrafficDb> {
  await ensureTrafficDb();
  const raw = await readFile(TRAFFIC_PATH, "utf8");
  return JSON.parse(raw) as TrafficDb;
}

export async function addTrafficEvent(path: string) {
  const db = await readTraffic();
  db.events.push({ path, ts: new Date().toISOString() });
  if (db.events.length > 10000) {
    db.events = db.events.slice(-10000);
  }
  await writeFile(TRAFFIC_PATH, JSON.stringify(db, null, 2), "utf8");
}
