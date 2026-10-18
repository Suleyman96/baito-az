/**
 * Job offers: an employer writes to a job seeker from the seeker's public profile, the seeker accepts
 * or declines with an optional answer. These are the pure input checks; the rules that need the
 * database (who may send, to whom, about which job) are in job-offer-actions.ts.
 */

export const OFFER_MESSAGE_MIN = 10;
export const OFFER_MESSAGE_MAX = 1000;
export const OFFER_REPLY_MAX = 1000;
/** Offers one employer can send in 24 hours, so the feature cannot be used to spam job seekers */
export const OFFERS_PER_DAY = 30;

export type OfferErrorKey =
  | "messageShort"
  | "messageLong"
  | "replyLong"
  | "decisionRequired"
  | "loginRequired"
  | "employersOnly"
  | "ownProfile"
  | "notAvailable"
  | "jobInvalid"
  | "alreadySent"
  | "tooMany"
  | "offerClosed"
  | "failed";

export type OfferStatusValue = "PENDING" | "ACCEPTED" | "DECLINED";

export function parseOffer(input: { message?: string; jobId?: string }):
  | { success: true; data: { message: string; jobId: string | null } }
  | { success: false; errors: Partial<Record<"message", OfferErrorKey>> } {
  const message = (input.message ?? "").trim();
  if (message.length < OFFER_MESSAGE_MIN) return { success: false, errors: { message: "messageShort" } };
  if (message.length > OFFER_MESSAGE_MAX) return { success: false, errors: { message: "messageLong" } };
  const jobId = (input.jobId ?? "").trim();
  return { success: true, data: { message, jobId: jobId || null } };
}

export function parseReply(input: { decision?: string; reply?: string }):
  | { success: true; data: { status: "ACCEPTED" | "DECLINED"; reply: string | null } }
  | { success: false; errors: Partial<Record<"decision" | "reply", OfferErrorKey>> } {
  const errors: Partial<Record<"decision" | "reply", OfferErrorKey>> = {};
  const decision = input.decision;
  if (decision !== "ACCEPTED" && decision !== "DECLINED") errors.decision = "decisionRequired";
  const reply = (input.reply ?? "").trim();
  if (reply.length > OFFER_REPLY_MAX) errors.reply = "replyLong";
  if (Object.keys(errors).length) return { success: false, errors };
  return { success: true, data: { status: decision as "ACCEPTED" | "DECLINED", reply: reply || null } };
}
