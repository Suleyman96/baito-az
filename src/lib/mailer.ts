import "server-only";
import type { Mailer } from "./notification-email";

/**
 * The site's email sender. No email service is set up yet, so nothing is sent:
 * notifications are stored and shown on the site (status NOT_CONFIGURED).
 * To start sending, implement `send` here (e.g. SMTP with nodemailer, or Resend) and set `configured: true`.
 */
export const mailer: Mailer = {
  configured: false,
  async send() {
    throw new Error("Email delivery is not configured");
  },
};
