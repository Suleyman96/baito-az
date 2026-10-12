// Email content and delivery decisions for "new application" notifications; no database here, so it is unit-tested

export type Email = { to: string; subject: string; text: string };
export type Mailer = { configured: boolean; send(email: Email): Promise<void> };
export type EmailStatusValue = "PENDING" | "SENT" | "FAILED" | "NOT_CONFIGURED" | "NO_ADDRESS";

/** Public address of the site, for links in emails */
export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** The email to an employer. No CV is attached: the link leads to the application, behind login. */
export function buildApplicationEmail(input: { to: string; applicantName: string; jobTitle: string; appliedAt: Date; link: string }): Email {
  const date = new Intl.DateTimeFormat("az", { timeZone: "Asia/Baku", dateStyle: "long", timeStyle: "short" }).format(input.appliedAt);
  return {
    to: input.to,
    subject: `Yeni müraciət: ${input.jobTitle}`,
    text: [
      "Salam,",
      "",
      `«${input.jobTitle}» vakansiyanıza yeni müraciət gəldi.`,
      "",
      `Namizəd: ${input.applicantName}`,
      `Tarix: ${date}`,
      "",
      `Müraciətə baxmaq üçün (hesabınıza daxil olmaq lazımdır):`,
      input.link,
      "",
      "ZaqaWork",
    ].join("\n"),
  };
}

/**
 * Tries to email one notification and says what to record. Never throws: a mail problem must
 * not turn a saved application into an error for the job seeker. Already-sent ones are skipped,
 * so retrying never emails twice.
 */
export async function deliver(
  status: EmailStatusValue,
  email: Email | null,
  mailer: Mailer,
): Promise<{ emailStatus: EmailStatusValue; emailError?: string; emailedAt?: Date } | null> {
  if (status === "SENT") return null;
  if (!email) return { emailStatus: "NO_ADDRESS" };
  if (!mailer.configured) return { emailStatus: "NOT_CONFIGURED" };
  try {
    await mailer.send(email);
    return { emailStatus: "SENT", emailedAt: new Date() };
  } catch (e) {
    return { emailStatus: "FAILED", emailError: e instanceof Error ? e.message.slice(0, 500) : "Unknown error" };
  }
}
