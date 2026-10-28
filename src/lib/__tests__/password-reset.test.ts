import { describe, expect, it } from "vitest";
import az from "../../i18n/dictionaries/az.json";
import en from "../../i18n/dictionaries/en.json";
import ja from "../../i18n/dictionaries/ja.json";
import ru from "../../i18n/dictionaries/ru.json";
import { buildPasswordResetEmail, hashResetToken, isResetTokenShaped, newResetToken, RESET_LINK_MINUTES, resetLinkUsable } from "../auth/password-reset";

describe("newResetToken", () => {
  it("gives a link-safe random token and stores only its hash", () => {
    const a = newResetToken();
    const b = newResetToken();
    expect(isResetTokenShaped(a.token)).toBe(true);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashResetToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });

  it("refuses anything that is not a token before looking it up", () => {
    expect(isResetTokenShaped(undefined)).toBe(false);
    expect(isResetTokenShaped(["x"])).toBe(false);
    expect(isResetTokenShaped("short")).toBe(false);
    expect(isResetTokenShaped(`${"a".repeat(42)}'`)).toBe(false);
  });
});

describe("resetLinkUsable", () => {
  const now = new Date("2026-10-28T10:00:00Z");
  const link = { email: "a@example.az", expiresAt: new Date("2026-10-28T10:30:00Z") };
  const user = { email: "a@example.az", blockedAt: null, deletedAt: null };

  it("works for the account it was sent to, until it expires", () => {
    expect(resetLinkUsable(link, user, now)).toBe(true);
    expect(resetLinkUsable(link, user, new Date("2026-10-28T10:30:00Z"))).toBe(false);
  });

  it("stops working when the email changed or the account is blocked or deleted", () => {
    expect(resetLinkUsable(link, { ...user, email: "new@example.az" }, now)).toBe(false);
    expect(resetLinkUsable(link, { ...user, email: null }, now)).toBe(false);
    expect(resetLinkUsable(link, { ...user, blockedAt: now }, now)).toBe(false);
    expect(resetLinkUsable(link, { ...user, deletedAt: now }, now)).toBe(false);
  });
});

describe("buildPasswordResetEmail", () => {
  it("fills in the name, the link and the time limit", () => {
    const email = buildPasswordResetEmail({ to: "a@example.az", name: "Əli", link: "https://baito.az/az/reset-password?token=x", t: az.passwordReset.email });
    expect(email.to).toBe("a@example.az");
    expect(email.subject).toBe("Baito.az: şifrənin bərpası");
    expect(email.text).toContain("Salam, Əli!");
    expect(email.text).toContain("https://baito.az/az/reset-password?token=x");
    expect(email.text).toContain(`${RESET_LINK_MINUTES} dəqiqə`);
    expect(email.text).not.toMatch(/\{\w+\}/);
  });
});

describe("reset texts", () => {
  it.each(Object.entries({ az, en, ja, ru }))("%s has the link, the name and the time limit in the email", (_, dict) => {
    for (const key of ["{name}", "{link}", "{minutes}"]) expect(dict.passwordReset.email.text).toContain(key);
    expect(dict.passwordReset.sentText).toContain("{email}");
    expect(dict.passwordReset.sentText).toContain("{minutes}");
  });
});
