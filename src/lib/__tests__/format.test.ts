import { describe, expect, it } from "vitest";
import { bakuMidnight, formatRelativeDate, formatSalary, formatWorkStart, t } from "../format";

const labels = { negotiable: "Negotiable", from: "From {min} {currency}", upTo: "Up to {max} {currency}" };

describe("formatSalary", () => {
  it("formats a range", () => expect(formatSalary(400, 600, labels)).toBe("400–600 AZN"));
  it("formats a lower bound only", () => expect(formatSalary(500, null, labels)).toBe("From 500 AZN"));
  it("formats an upper bound only", () => expect(formatSalary(null, 300, labels)).toBe("Up to 300 AZN"));
  it("falls back to negotiable", () => expect(formatSalary(null, null, labels)).toBe("Negotiable"));
});

describe("t", () => {
  it("fills placeholders and keeps unknown ones", () => {
    expect(t("{count} jobs, {x}", { count: 3 })).toBe("3 jobs, {x}");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  it("uses days for older dates", () => {
    expect(formatRelativeDate(new Date("2026-10-09T12:00:00Z"), "en", now)).toBe("2 days ago");
  });
  it("uses hours within a day", () => {
    expect(formatRelativeDate(new Date("2026-10-11T09:00:00Z"), "en", now)).toBe("3 hours ago");
  });
  it("localizes to Japanese", () => {
    expect(formatRelativeDate(new Date("2026-10-11T09:00:00Z"), "ja", now)).toBe("3 時間前");
  });
});

describe("formatWorkStart", () => {
  it("shows Baku time whatever the machine's time zone", () => {
    const start = new Date("2026-10-20T05:30:00Z");
    expect(formatWorkStart(start, "az")).toBe("20 oktyabr, çərşənbə axşamı, 09:30");
    expect(formatWorkStart(start, "en")).toBe("Tuesday, October 20, 09:30");
  });
});

describe("bakuMidnight", () => {
  it("uses the Baku calendar day, not the UTC one", () => {
    // 22:30 UTC on the 11th is already 02:30 on the 12th in Baku
    expect(bakuMidnight(new Date("2026-10-11T22:30:00Z"))).toEqual(new Date("2026-10-11T20:00:00Z"));
    expect(bakuMidnight(new Date("2026-10-11T22:30:00Z"), 2)).toEqual(new Date("2026-10-13T20:00:00Z"));
  });
});
