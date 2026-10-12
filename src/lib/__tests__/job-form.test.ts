import { describe, expect, it } from "vitest";
import { jobToFormValues, parseJobForm } from "../job-form";

// 2026-10-11 12:00 in Baku
const now = new Date("2026-10-11T08:00:00Z");

const base = {
  title: "Həyət təmizləmə işi",
  description: "Böyük həyətin yarpaqlardan təmizlənməsi.",
  categoryId: "10",
  locationId: "3",
  contactPhone: "050 123 45 67",
};

describe("parseJobForm", () => {
  it("accepts a one-day job and reads the time as Baku time", () => {
    const result = parseJobForm(
      { ...base, employmentType: "ONE_DAY", workDate: "2026-10-15", startTime: "10:00", durationHours: "5", workersNeeded: "2", payAmount: "40", payPeriod: "JOB", salaryMin: "junk" },
      now,
    );
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        employmentType: "ONE_DAY",
        workStart: new Date("2026-10-15T06:00:00Z"),
        durationHours: 5,
        workersNeeded: 2,
        salaryMin: 40,
        salaryMax: null,
        payPeriod: "JOB",
        contactPhone: "+994501234567",
      }),
    });
  });

  it("defaults to one worker and allows hourly pay or no pay amount", () => {
    const hourly = parseJobForm({ ...base, employmentType: "ONE_DAY", workDate: "2026-10-15", startTime: "10:00", durationHours: "5", payAmount: "8", payPeriod: "HOUR" }, now);
    expect(hourly.success && hourly.data).toMatchObject({ workersNeeded: 1, salaryMin: 8, payPeriod: "HOUR" });
    const negotiable = parseJobForm({ ...base, employmentType: "ONE_DAY", workDate: "2026-10-15", startTime: "10:00", durationHours: "5", payAmount: "" }, now);
    expect(negotiable.success && negotiable.data.salaryMin).toBeNull();
  });

  it("rejects one-day jobs in the past, too far ahead, or without date and duration", () => {
    const errors = (extra: object) => {
      const r = parseJobForm({ ...base, employmentType: "ONE_DAY", durationHours: "5", ...extra }, now);
      return r.success ? {} : r.errors;
    };
    expect(errors({ workDate: "2026-10-11", startTime: "11:00" })).toEqual({ workDate: "dateInPast" });
    expect(errors({ workDate: "2027-03-01", startTime: "10:00" })).toEqual({ workDate: "dateTooFar" });
    expect(errors({ workDate: "", startTime: "", durationHours: "" })).toEqual({ workDate: "dateRequired", durationHours: "durationInvalid" });
    expect(errors({ workDate: "2026-10-15", startTime: "10:00", durationHours: "30" })).toEqual({ durationHours: "durationInvalid" });
  });

  it("accepts a monthly job and ignores one-day fields", () => {
    const result = parseJobForm({ ...base, employmentType: "FULL_TIME", salaryMin: "400", salaryMax: "", workDate: "nonsense", durationHours: "99" }, now);
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ employmentType: "FULL_TIME", salaryMin: 400, salaryMax: null, payPeriod: "MONTH", workStart: null, durationHours: null }),
    });
  });

  it("lets full-time and part-time jobs be paid per hour", () => {
    const hourly = parseJobForm({ ...base, employmentType: "PART_TIME", salaryMin: "5", salaryMax: "7", salaryPeriod: "HOUR", payPeriod: "JOB" }, now);
    expect(hourly.success && hourly.data).toMatchObject({ salaryMin: 5, salaryMax: 7, payPeriod: "HOUR" });
    const monthly = parseJobForm({ ...base, employmentType: "FULL_TIME", salaryMin: "500" }, now);
    expect(monthly.success && monthly.data.payPeriod).toBe("MONTH");
  });

  it("reports missing fields and a reversed salary range", () => {
    const result = parseJobForm({ employmentType: "PART_TIME", title: "", description: "qısa", categoryId: "", locationId: "", contactPhone: "123", salaryMin: "500", salaryMax: "300" }, now);
    expect(result.success ? {} : result.errors).toEqual({
      title: "titleRequired",
      description: "descriptionRequired",
      categoryId: "categoryRequired",
      locationId: "locationRequired",
      contactPhone: "phoneInvalid",
    });
    const range = parseJobForm({ ...base, employmentType: "PART_TIME", salaryMin: "500", salaryMax: "300" }, now);
    expect(range.success ? {} : range.errors).toEqual({ salaryMax: "salaryRange" });
  });
});

describe("jobToFormValues", () => {
  const oneDayInput = { ...base, employmentType: "ONE_DAY", workDate: "2026-10-15", startTime: "09:30", durationHours: "5", workersNeeded: "2", payAmount: "8", payPeriod: "HOUR" };

  it("round-trips a one-day job through the form", () => {
    const parsed = parseJobForm(oneDayInput, now);
    if (!parsed.success) throw new Error("fixture should be valid");
    const values = jobToFormValues({ ...parsed.data, location: { district: { slug: "zaqatala" } } });
    expect(values).toMatchObject({ workDate: "2026-10-15", startTime: "09:30", payAmount: "8", payPeriod: "HOUR", district: "zaqatala", contactPhone: "+994501234567" });
    expect(parseJobForm(values, now)).toEqual(parsed);
  });

  it("clears the date when copying a one-day job", () => {
    const parsed = parseJobForm(oneDayInput, now);
    if (!parsed.success) throw new Error("fixture should be valid");
    expect(jobToFormValues({ ...parsed.data, location: { district: { slug: "zaqatala" } } }, { copy: true }).workDate).toBe("");
  });

  it("keeps an hourly salary range of a part-time job", () => {
    const parsed = parseJobForm({ ...base, employmentType: "PART_TIME", salaryMin: "5", salaryMax: "7", salaryPeriod: "HOUR" }, now);
    if (!parsed.success) throw new Error("fixture should be valid");
    expect(jobToFormValues({ ...parsed.data, location: { district: { slug: "qax" } } })).toMatchObject({ salaryMin: "5", salaryMax: "7", salaryPeriod: "HOUR" });
  });
});

describe("daily pay", () => {
  it("accepts a daily rate for monthly-type jobs and for one-day jobs", () => {
    const partTime = parseJobForm({ ...base, employmentType: "PART_TIME", salaryMin: "25", salaryMax: "30", salaryPeriod: "DAY" }, now);
    expect(partTime.success && partTime.data).toMatchObject({ payPeriod: "DAY", salaryMin: 25, salaryMax: 30 });
    const oneDay = parseJobForm({ ...base, employmentType: "ONE_DAY", workDate: "2026-10-15", startTime: "09:00", durationHours: "8", payAmount: "35", payPeriod: "DAY" }, now);
    expect(oneDay.success && oneDay.data).toMatchObject({ payPeriod: "DAY", salaryMin: 35 });
  });

  it("round-trips a daily rate through the edit form", () => {
    const parsed = parseJobForm({ ...base, employmentType: "FULL_TIME", salaryMin: "20", salaryPeriod: "DAY" }, now);
    if (!parsed.success) throw new Error("fixture should be valid");
    expect(jobToFormValues({ ...parsed.data, location: { district: { slug: "qax" } } })).toMatchObject({ salaryMin: "20", salaryPeriod: "DAY" });
  });
});
