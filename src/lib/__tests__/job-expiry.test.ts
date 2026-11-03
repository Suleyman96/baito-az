import { describe, expect, it } from "vitest";
import { addMonthBaku, bakuDate, checkEndDate, lastListedDay, monthlyExpiry, oneDayEndDate, oneDayExpiry } from "../job-expiry";

// Baku is UTC+4: "10:00+04:00" is 06:00Z
const baku = (s: string) => new Date(`${s}+04:00`);

describe("monthly listings (full-time / part-time)", () => {
  it("last one calendar month, to the minute, in Baku time", () => {
    expect(monthlyExpiry(baku("2026-11-03T15:30:00"))).toEqual(baku("2026-12-03T15:30:00"));
    expect(addMonthBaku(baku("2026-12-15T09:00:00"))).toEqual(baku("2027-01-15T09:00:00"));
  });

  it("use the Baku date, not the UTC one, near midnight", () => {
    // 1 November 02:00 in Baku is still 31 October in UTC
    expect(addMonthBaku(baku("2026-11-01T02:00:00"))).toEqual(baku("2026-12-01T02:00:00"));
  });

  it("end on the last day of a shorter month", () => {
    expect(addMonthBaku(baku("2026-01-31T12:00:00"))).toEqual(baku("2026-02-28T12:00:00"));
    expect(addMonthBaku(baku("2028-01-31T12:00:00"))).toEqual(baku("2028-02-29T12:00:00"));
    expect(addMonthBaku(baku("2026-10-31T23:30:00"))).toEqual(baku("2026-11-30T23:30:00"));
  });
});

describe("one-day listings", () => {
  const work = baku("2026-11-07T10:00:00");

  it("last until the end of the third day after the work date by default", () => {
    expect(oneDayEndDate(work, null)).toBe("2026-11-10");
    expect(oneDayExpiry(work, null)).toEqual(baku("2026-11-11T00:00:00"));
  });

  it("last until the end of the picked end date", () => {
    expect(oneDayEndDate(work, "2026-11-08")).toBe("2026-11-08");
    expect(oneDayExpiry(work, "2026-11-08")).toEqual(baku("2026-11-09T00:00:00"));
  });

  it("count days in Baku even when the work starts right after midnight", () => {
    // 00:30 on 7 November in Baku is 20:30Z on 6 November
    expect(oneDayExpiry(baku("2026-11-07T00:30:00"), null)).toEqual(baku("2026-11-11T00:00:00"));
  });

  it("show the right last day", () => {
    expect(lastListedDay(oneDayExpiry(work, null))).toBe("2026-11-10");
    expect(lastListedDay(baku("2026-12-03T15:30:00"))).toBe("2026-12-03");
    expect(bakuDate(baku("2026-11-07T23:59:00"))).toBe("2026-11-07");
  });
});

describe("checkEndDate", () => {
  const now = baku("2026-11-03T12:00:00");
  const work = baku("2026-11-07T10:00:00");

  it("treats an empty field as the default", () => {
    expect(checkEndDate("", work, now)).toEqual({ endDate: null });
    expect(checkEndDate("  ", work, now)).toEqual({ endDate: null });
  });

  it("accepts the work date up to 30 days after it", () => {
    expect(checkEndDate("2026-11-07", work, now)).toEqual({ endDate: "2026-11-07" });
    expect(checkEndDate("2026-12-07", work, now)).toEqual({ endDate: "2026-12-07" });
  });

  it("refuses past, too late and malformed dates", () => {
    expect(checkEndDate("2026-11-02", work, now)).toEqual({ error: "endDateInPast" });
    // 4 November is today or later, but before the work on 7 November
    expect(checkEndDate("2026-11-04", work, now)).toEqual({ error: "endDateBeforeWork" });
    expect(checkEndDate("2026-11-06", work, now)).toEqual({ error: "endDateBeforeWork" });
    expect(checkEndDate("2026-12-08", work, now)).toEqual({ error: "endDateTooFar" });
    expect(checkEndDate("2026-02-30", work, now)).toEqual({ error: "endDateInvalid" });
    expect(checkEndDate("08.11.2026", work, now)).toEqual({ error: "endDateInvalid" });
  });
});
