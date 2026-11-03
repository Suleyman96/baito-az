// Format rules shared by the forms (live, in the browser) and the server actions (zod schemas), so both
// accept exactly the same input. No server-only code here: client components import it too.

/** Spaces at the ends removed, runs of spaces inside made one */
export const squeezeSpaces = (value: string) => value.trim().replace(/\s+/gu, " ");

// Letters of any script (Azerbaijani, Russian, Japanese, ...) with their combining marks. Words are joined by
// one space, a hyphen, an apostrophe or the Japanese middle dot: "Əli Məmmədov", "Anna-Mariya", "O'Neil", "ヤマダ・タロウ"
const NAME = /^[\p{L}\p{M}]+(?:[ \-'’・][\p{L}\p{M}]+)*$/u;

/** A person's name: letters only (no digits or symbols), 2 to 80 characters */
export function isPersonName(value: string) {
  const name = squeezeSpaces(value);
  return name.length >= 2 && name.length <= 80 && NAME.test(name);
}

/** Characters a name field accepts while typing; anything else is dropped as it is typed */
export const NAME_CHARS = "\\p{L}\\p{M} \\-'’・";

// Letters, digits and the punctuation real company names use: "Bərəkət Market — Qax", "«Aqro» MMC", "A&B Co.", "№1 Aptek"
const COMPANY = /^[\p{L}\p{M}\p{N} .,&'’"«»“”()\-–—/+#№!:]+$/u;

/** A company name: up to 100 characters, with at least one letter or digit */
export function isCompanyName(value: string) {
  const name = squeezeSpaces(value);
  return name.length >= 2 && name.length <= 100 && COMPANY.test(name) && /[\p{L}\p{N}]/u.test(name);
}

/** A job title: 3 to 100 characters with at least one letter */
export function isJobTitle(value: string) {
  const title = squeezeSpaces(value);
  return title.length >= 3 && title.length <= 100 && /\p{L}/u.test(title);
}

/**
 * Free text (descriptions, bios, messages): control characters removed (line breaks and tabs are kept),
 * as are the direction overrides that can make text display differently from what it is; Windows line
 * breaks made plain and the ends trimmed. Any letters, symbols and emoji are allowed.
 */
export function cleanText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\p{Cc}‪-‮⁦-⁩]/gu, (c) => (c === "\n" || c === "\t" ? c : ""))
    .trim();
}

export const MAX_EMAIL_LENGTH = 254;

/**
 * An email address, the server's and the browser's rule alike (zod's default, which unlike the browser's
 * own check wants a domain ending: "ali@mail" is refused, "ali@mail.az" is fine)
 */
export const EMAIL = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

/** Bytes bcrypt reads: anything after the first 72 bytes of a password would be ignored */
export const MAX_PASSWORD_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 8;

export type PasswordProblem = "passwordShort" | "passwordWeak" | "passwordLong";

/** A new password: at least 8 characters with a letter and a digit, at most 72 bytes */
export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "passwordShort";
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return "passwordLong";
  if (!/\p{L}/u.test(password) || !/\p{N}/u.test(password)) return "passwordWeak";
  return null;
}

export const MAX_AMOUNT = 100_000;

/**
 * An amount of money in AZN as typed: "3", "3.5", "3,50" or "1 500". Up to 2 decimals, more than 0 and at
 * most MAX_AMOUNT. "" → null (not given); anything else invalid → undefined.
 */
export function parseAmount(raw: string): number | null | undefined {
  const value = raw.replace(/\s/g, "").replace(",", ".");
  if (value === "") return null;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return undefined;
  const amount = Number(value);
  if (amount <= 0 || amount > MAX_AMOUNT) return undefined;
  return Math.round(amount * 100) / 100;
}

/** Characters an amount field accepts while typing */
export const AMOUNT_CHARS = "0-9.,";

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

/** Characters a phone field accepts while typing: digits, "+", spaces, brackets and dashes */
export const PHONE_CHARS = "0-9+() \\-";
