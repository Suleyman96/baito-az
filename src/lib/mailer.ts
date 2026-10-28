import "server-only";
import { createResendMailer } from "./resend";

/**
 * The site's email sender, through Resend. Without RESEND_API_KEY nothing is sent: notifications
 * are still stored and shown on the site (status NOT_CONFIGURED). MAIL_FROM is the sender, e.g.
 * «Baito.az <no-reply@baito.az>» once that domain is verified in Resend; until then Resend's test
 * sender is used, which only delivers to the Resend account's own email.
 */
export const mailer = createResendMailer({ apiKey: process.env.RESEND_API_KEY, from: process.env.MAIL_FROM });
