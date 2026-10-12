import { describe, expect, it } from "vitest";
import { applyProblem, applySchema, canViewResume } from "../applications";

describe("applyProblem", () => {
  it("requires a CV for full-time jobs only", () => {
    expect(applyProblem({ employmentType: "FULL_TIME" }, false)).toBe("resumeRequired");
    expect(applyProblem({ employmentType: "FULL_TIME" }, true)).toBeNull();
    expect(applyProblem({ employmentType: "PART_TIME" }, false)).toBeNull();
    expect(applyProblem({ employmentType: "ONE_DAY" }, false)).toBeNull();
  });
});

describe("applySchema", () => {
  it("makes the message optional and limits its length", () => {
    expect(applySchema.parse({ message: "  " })).toEqual({ message: undefined });
    expect(applySchema.safeParse({ message: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("canViewResume", () => {
  const resume = { ownerId: "seeker", sentTo: ["employerA"] };

  it("lets the owner, admins and employers it was sent to see it", () => {
    expect(canViewResume({ id: "seeker", role: "SEEKER" }, resume)).toBe(true);
    expect(canViewResume({ id: "admin", role: "ADMIN" }, resume)).toBe(true);
    expect(canViewResume({ id: "employerA", role: "EMPLOYER" }, resume)).toBe(true);
  });

  it("refuses everyone else, including other employers and other seekers", () => {
    expect(canViewResume(null, resume)).toBe(false);
    expect(canViewResume({ id: "employerB", role: "EMPLOYER" }, resume)).toBe(false);
    expect(canViewResume({ id: "otherSeeker", role: "SEEKER" }, resume)).toBe(false);
    // An employer id in sentTo only counts for employer accounts
    expect(canViewResume({ id: "employerA", role: "SEEKER" }, resume)).toBe(false);
  });
});
