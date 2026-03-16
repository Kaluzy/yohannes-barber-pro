import { addMinutes, format } from "date-fns";

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

export function humanTime(sqlTime: string): string {
  const [h, m] = sqlTime.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return format(d, "h:mm a");
}

export function getSlots(start = "09:00", end = "19:00", step = 30) {
  const slots: string[] = [];
  let cursor = toMinutes(start);
  const limit = toMinutes(end);

  while (cursor < limit) {
    slots.push(fromMinutes(cursor));
    cursor += step;
  }

  return slots;
}

export function endTimeFrom(startTime: string, durationMin: number) {
  const [h, m] = startTime.split(":").map(Number);
  const dt = new Date();
  dt.setHours(h, m, 0, 0);
  return format(addMinutes(dt, durationMin), "HH:mm:ss");
}
