import { z } from "zod";

// Error messages are dictionary keys (auth.errors.*), translated in the form
export type AuthErrorKey =
  | "nameRequired"
  | "emailInvalid"
  | "phoneInvalid"
  | "contactRequired"
  | "passwordShort"
  | "companyRequired"
  | "emailTaken"
  | "phoneTaken"
  | "invalidCredentials";

// Azerbaijani mobile operator codes (Azercell, Bakcell, Nar, Naxtel)
const MOBILE_CODES = ["10", "50", "51", "55", "60", "70", "77", "99"];

/**
 * Accepts the ways people write a local mobile number ("050 123 45 67", "+994 50 123-45-67",
 * "994501234567", "501234567") and returns "+994501234567", or null if it is not a valid mobile number.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  digits = digits.replace(/^\+/, "");
  if (digits.startsWith("994")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 9 || !MOBILE_CODES.includes(digits.slice(0, 2))) return null;
  return `+994${digits}`;
}

// Empty form fields arrive as "", which should count as "not provided"
const optionalText = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

const password = z.string().min(8, "passwordShort").max(100, "passwordShort");

export const registerSchema = z
  .object({
    role: z.enum(["SEEKER", "EMPLOYER"]).catch("SEEKER"),
    name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
    email: optionalText.pipe(z.email("emailInvalid").toLowerCase().optional()),
    phone: optionalText.transform((v, ctx) => {
      if (v === undefined) return undefined;
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "phoneInvalid" });
        return z.NEVER;
      }
      return phone;
    }),
    password,
    companyName: optionalText,
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "contactRequired" });
    }
    if (data.role === "EMPLOYER" && (!data.companyName || data.companyName.length < 2)) {
      ctx.addIssue({ code: "custom", path: ["companyName"], message: "companyRequired" });
    }
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "invalidCredentials"),
  password: z.string().min(1, "invalidCredentials"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Splits a login identifier into an email or a normalized phone number. */
export function parseIdentifier(identifier: string): { email: string } | { phone: string } | null {
  if (identifier.includes("@")) return { email: identifier.trim().toLowerCase() };
  const phone = normalizePhone(identifier);
  return phone ? { phone } : null;
}

/** First error per field, as dictionary keys. */
export function fieldErrors(error: z.ZodError): Record<string, AuthErrorKey> {
  const result: Record<string, AuthErrorKey> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    result[field] ??= issue.message as AuthErrorKey;
  }
  return result;
}

/**
 * Where to go after login. Only same-site paths are allowed, so a crafted
 * ?next=https://evil.example link cannot send users to another site.
 */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
