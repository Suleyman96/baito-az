import { describe, expect, it, vi } from "vitest";
import { buildApplicationEmail, buildArchiveEmail, deliver, type Mailer } from "../notification-email";

const email = buildApplicationEmail({
  to: "employer@example.az",
  applicantName: "Əli Məmmədov",
  jobTitle: "Ofisiant",
  appliedAt: new Date("2026-10-12T08:30:00Z"),
  link: "https://zaqawork.az/az/my/applications/abc",
});

describe("buildApplicationEmail", () => {
  it("names the applicant, the job and the date, and links to the application", () => {
    expect(email.subject).toBe("Yeni müraciət: Ofisiant");
    expect(email.text).toContain("Əli Məmmədov");
    expect(email.text).toContain("12:30"); // Baku time
    expect(email.text).toContain("https://zaqawork.az/az/my/applications/abc");
  });
});

describe("deliver", () => {
  const working: Mailer = { configured: true, send: vi.fn(async () => {}) };

  it("sends once and records it", async () => {
    expect(await deliver("PENDING", email, working)).toMatchObject({ emailStatus: "SENT" });
    expect(working.send).toHaveBeenCalledWith(email);
  });

  it("never sends an already-sent notification again (retried submit)", async () => {
    const mailer: Mailer = { configured: true, send: vi.fn(async () => {}) };
    expect(await deliver("SENT", email, mailer)).toBeNull();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it("records a failure instead of throwing", async () => {
    const failing: Mailer = { configured: true, send: async () => { throw new Error("SMTP timeout"); } };
    await expect(deliver("PENDING", email, failing)).resolves.toEqual({ emailStatus: "FAILED", emailError: "SMTP timeout" });
  });

  it("does not try without an email service or an address, and retries failed ones", async () => {
    const off: Mailer = { configured: false, send: vi.fn(async () => {}) };
    expect(await deliver("PENDING", email, off)).toEqual({ emailStatus: "NOT_CONFIGURED" });
    expect(off.send).not.toHaveBeenCalled();
    expect(await deliver("PENDING", null, working)).toEqual({ emailStatus: "NO_ADDRESS" });
    expect(await deliver("FAILED", email, working)).toMatchObject({ emailStatus: "SENT" });
  });
});

describe("buildArchiveEmail", () => {
  const archive = buildArchiveEmail({
    to: "employer@example.az",
    jobTitle: "Kassir",
    jobType: "Part-time",
    archivedAt: new Date("2026-11-03T20:00:00Z"),
    link: "https://baito.az/az/my/jobs",
    idempotencyKey: "job-archive/n1",
  });

  it("names the job, its type, the Baku date and how to reactivate it", () => {
    expect(archive.subject).toBe("Elan arxivə keçirildi: Kassir");
    expect(archive.text).toContain("Elan: Kassir");
    expect(archive.text).toContain("Növ: Part-time");
    expect(archive.text).toContain("4 noyabr 2026"); // 20:00Z is already 4 November in Baku
    expect(archive.text).toContain("yenidən aktivləşdirə");
    expect(archive.text).toContain("https://baito.az/az/my/jobs");
    expect(archive.idempotencyKey).toBe("job-archive/n1");
  });
});
