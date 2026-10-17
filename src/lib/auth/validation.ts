import { z } from "zod";

// Error messages are dictionary keys (auth.errors.*), translated in the form
export type AuthErrorKey =
  | "nameRequired"
  | "emailInvalid"
  | "phoneInvalid"
  | "contactRequired"
  | "passwordShort"
  | "emailTaken"
  | "phoneTaken"
  | "invalidCredentials"
  | "blocked"
  | "currentPasswordWrong"
  | "companyNameLong"
  | "descriptionLong"
  | "addressLong"
  | "locationInvalid"
  | "socialInvalid";

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
    // Optional: private persons (e.g. someone hiring for one day) leave it empty
    companyName: optionalText.pipe(z.string().max(100).optional()),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "contactRequired" });
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

const phoneField = optionalText.transform((v, ctx) => {
  if (v === undefined) return undefined;
  const phone = normalizePhone(v);
  if (!phone) {
    ctx.addIssue({ code: "custom", message: "phoneInvalid" });
    return z.NEVER;
  }
  return phone;
});

/** Profile: name and contacts. As at sign-up, at least one of email or phone stays set. */
export const accountSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
    email: optionalText.pipe(z.email("emailInvalid").toLowerCase().optional()),
    phone: phoneField,
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "contactRequired" });
    }
  });

// A coordinate from a hidden form field: empty means "not set"
const coordinate = (limit: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number({ message: "locationInvalid" }).min(-limit, "locationInvalid").max(limit, "locationInvalid").optional(),
  );

/**
 * Employer's company details. An empty name means "post under my own name".
 * The location is optional: an address, a map point (latitude + longitude together), both or neither.
 */
export const companySchema = z
  .object({
    companyName: optionalText.pipe(z.string().max(100, "companyNameLong").optional()),
    description: optionalText.pipe(z.string().max(1000, "descriptionLong").optional()),
    phone: phoneField,
    address: optionalText.pipe(z.string().max(200, "addressLong").optional()),
    latitude: coordinate(90),
    longitude: coordinate(180),
  })
  .superRefine((data, ctx) => {
    if ((data.latitude === undefined) !== (data.longitude === undefined)) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "locationInvalid" });
    }
  });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "currentPasswordWrong"),
  newPassword: password,
});
