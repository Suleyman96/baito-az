import { describe, expect, it } from "vitest";
import { matchingSlugs, professionGroupOf } from "@/config/professions";
import { parseWorkerProfile } from "../worker-profile";

const minimal = { name: "Əli Məmmədov", phone: "050 123 45 67", primaryProfession: "electrician", district: "zaqatala", workTypes: ["PART_TIME"] };

describe("parseWorkerProfile", () => {
  it("accepts the required fields alone and leaves optional ones empty", () => {
    const r = parseWorkerProfile(minimal);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data).toMatchObject({
      phone: "+994501234567",
      primaryProfession: "electrician",
      district: "zaqatala",
      workTypes: ["PART_TIME"],
      ageRange: null,
      bio: null,
      experienceYears: null,
      expectedPay: null,
      locationId: null,
      availableFrom: null,
      visible: false,
      additionalProfessions: [],
      skills: [],
    });
  });

  it("requires name, phone, a known profession, a district and a work type", () => {
    const r = parseWorkerProfile({ name: "", phone: "", primaryProfession: "astronaut", district: "paris", workTypes: [] });
    expect(r.success ? {} : r.errors).toEqual({
      name: "nameRequired",
      phone: "phoneRequired",
      primaryProfession: "professionRequired",
      district: "districtRequired",
      workTypes: "workTypeRequired",
    });
  });

  it("keeps only known codes and never repeats the primary profession", () => {
    const r = parseWorkerProfile({
      ...minimal,
      additionalProfessions: ["plumber", "electrician", "hacker", "plumber"],
      skills: ["license_b", "<script>", "welding"],
      preferredDistricts: ["sheki", "moon"],
    });
    expect(r.success && r.data).toMatchObject({ additionalProfessions: ["plumber"], skills: ["license_b", "welding"], preferredDistricts: ["sheki"] });
  });

  it("reads numbers, dates, checkboxes and limits", () => {
    const ok = parseWorkerProfile({ ...minimal, experienceYears: "5", expectedPay: "30", expectedPayPeriod: "DAY", availableFrom: "2026-11-01", visible: "on", availableWeekends: "on", ageRange: "25-34" });
    expect(ok.success && ok.data).toMatchObject({ experienceYears: 5, expectedPay: 30, expectedPayPeriod: "DAY", visible: true, availableWeekends: true, ageRange: "25-34" });
    expect(ok.success && ok.data.availableFrom?.toISOString()).toBe("2026-10-31T20:00:00.000Z");

    const bad = parseWorkerProfile({ ...minimal, experienceYears: "-2", expectedPay: "abc", availableFrom: "soon", bio: "x".repeat(501) });
    expect(bad.success ? {} : bad.errors).toEqual({ experienceYears: "numberInvalid", expectedPay: "numberInvalid", availableFrom: "dateInvalid", bio: "textTooLong" });

    const many = parseWorkerProfile({ ...minimal, skills: ["license_b", "license_c", "forklift", "lang_russian", "lang_english", "lang_turkish", "lang_georgian", "computer_basics", "ms_office", "accounting_software", "social_media", "electrical_work", "plumbing_work", "welding", "painting_work", "woodwork"] });
    expect(many.success ? {} : many.errors).toEqual({ skills: "tooManySkills" });
  });
});

describe("profession data", () => {
  it("finds professions and skills by name in any language", () => {
    expect(matchingSlugs("elektrik").professions).toContain("electrician");
    expect(matchingSlugs("Электрик").professions).toContain("electrician");
    expect(matchingSlugs("excel").skills).toContain("ms_office");
    expect(professionGroupOf("waiter")).toBe("hospitality");
  });
});
