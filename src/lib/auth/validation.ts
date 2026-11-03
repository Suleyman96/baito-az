import { z } from "zod";
import { cleanText, EMAIL, isCompanyName, isPersonName, MAX_EMAIL_LENGTH, normalizePhone, passwordProblem, squeezeSpaces } from "@/lib/validation-rules";

// Error messages are dictionary keys (auth.errors.*), translated in the form
export type AuthErrorKey =
  | "nameRequired"
  | "nameInvalid"
  | "emailInvalid"
  | "phoneInvalid"
  | "contactRequired"
  | "passwordShort"
  | "passwordWeak"
  | "passwordLong"
  | "emailTaken"
  | "phoneTaken"
  | "invalidCredentials"
  | "blocked"
  | "tooManyAttempts"
  | "currentPasswordWrong"
  | "companyNameLong"
  | "companyNameInvalid"
  | "descriptionLong"
  | "addressLong"
  | "locationInvalid"
  | "socialInvalid"
  | "companyNameTaken"
  | "confirmRequired"
  | "deleteNotAllowed"
  | "termsRequired";

// Phone numbers: the rules live in validation-rules.ts (also used in the browser); imported from here by the server code
export { normalizePhone } from "@/lib/validation-rules";

// Empty form fields arrive as "", which should count as "not provided"
const optionalText = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

/** A new password (sign-up, change, reset): the rules of validation-rules.ts. Logging in checks none of them */
const password = z.string().superRefine((v, ctx) => {
  const problem = passwordProblem(v);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});

/** A person's name: letters, spaces, hyphens and apostrophes; stored with single spaces */
const personName = z
  .string()
  .transform(squeezeSpaces)
  .superRefine((v, ctx) => {
    if (!v) ctx.addIssue({ code: "custom", message: "nameRequired" });
    else if (!isPersonName(v)) ctx.addIssue({ code: "custom", message: "nameInvalid" });
  });

/** An optional email: trimmed and lowercased, "" = not given */
const optionalEmail = optionalText.pipe(z.email({ pattern: EMAIL, error: "emailInvalid" }).max(MAX_EMAIL_LENGTH, "emailInvalid").toLowerCase().optional());

/** An optional company name ("" = a private person): the characters real names use, up to 100 */
const optionalCompanyName = optionalText.pipe(
  z
    .string()
    .transform(squeezeSpaces)
    .superRefine((v, ctx) => {
      if (v.length > 100) ctx.addIssue({ code: "custom", message: "companyNameLong" });
      else if (!isCompanyName(v)) ctx.addIssue({ code: "custom", message: "companyNameInvalid" });
    })
    .optional(),
);

/** Optional free text (description, address): invisible control characters removed, "" = not given */
const optionalFreeText = (max: number, message: AuthErrorKey) =>
  z
    .string()
    .transform(cleanText)
    .pipe(z.string().max(max, message))
    .transform((v) => v || undefined)
    .optional();

export const registerSchema = z
  .object({
    role: z.enum(["SEEKER", "EMPLOYER"]).catch("SEEKER"),
    name: personName,
    email: optionalEmail,
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
    companyName: optionalCompanyName,
    // The Terms of Use and Privacy Policy checkbox: a ticked box sends "on", an unticked one nothing
    acceptTerms: z.literal("on", "termsRequired"),
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
 * Control characters and spaces are refused too: browsers drop tabs and newlines from URLs,
 * so "/\t/evil.example" would otherwise become "//evil.example".
 */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(next)) {
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
    name: personName,
    email: optionalEmail,
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
    companyName: optionalCompanyName,
    description: optionalFreeText(1000, "descriptionLong"),
    phone: phoneField,
    address: optionalFreeText(200, "addressLong"),
    latitude: coordinate(90),
    longitude: coordinate(180),
  })
  .superRefine((data, ctx) => {
    if ((data.latitude === undefined) !== (data.longitude === undefined)) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "locationInvalid" });
    }
  });

/** "Forgot password": the account's email */
export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().max(MAX_EMAIL_LENGTH, "emailInvalid").pipe(z.email({ pattern: EMAIL, error: "emailInvalid" })),
});

/** The new password set through a reset link */
export const resetPasswordSchema = z.object({ password });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "currentPasswordWrong"),
  newPassword: password,
});
