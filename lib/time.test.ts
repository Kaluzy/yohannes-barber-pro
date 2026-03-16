import { describe, expect, it } from "vitest";
import { endTimeFrom, getSlots, humanTime, toMinutes } from "./time";

describe("time helpers", () => {
  it("converts HH:mm to minutes", () => {
    expect(toMinutes("09:30")).toBe(570);
  });

  it("builds 30-min slots in a day window", () => {
    const slots = getSlots("09:00", "10:30", 30);
    expect(slots).toEqual(["09:00:00", "09:30:00", "10:00:00"]);
  });

  it("computes end time from start + duration", () => {
    expect(endTimeFrom("10:00", 45)).toBe("10:45:00");
    expect(endTimeFrom("18:30", 60)).toBe("19:30:00");
  });

  it("renders user-friendly time", () => {
    expect(humanTime("13:00:00")).toMatch(/1:00\s*PM/i);
  });
});
