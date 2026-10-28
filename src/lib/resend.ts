// Sending email through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Plain fetch, no SDK; no server-only import here, so it is unit-tested with a fake fetch.
import type { Mailer } from "./notification-email";

/** Resend's shared test sender: until a domain is verified, it only delivers to the Resend account's own email */
export const RESEND_TEST_FROM = "Baito.az <onboarding@resend.dev>";

export function createResendMailer(options: { apiKey?: string; from?: string; fetch?: typeof fetch }): Mailer {
  const apiKey = options.apiKey?.trim();
  const from = options.from?.trim() || RESEND_TEST_FROM;
  const doFetch = options.fetch ?? fetch;
  return {
    configured: !!apiKey,
    async send(email) {
      if (!apiKey) throw new Error("RESEND_API_KEY is not set");
      const res = await doFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await errorMessage(res)}`);
    },
  };
}

/** Resend's own explanation of a refused email (e.g. an unverified domain), never the API key */
async function errorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body.message === "string") return body.message;
  } catch {}
  return res.statusText || "request failed";
}
