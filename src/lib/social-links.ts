import { normalizePhone } from "@/lib/auth/validation";

/**
 * Social and messenger links on public profiles (job seekers and employers).
 * People may type a username, "@username" or a full link; only the username (WhatsApp: the number's digits)
 * is stored, and links are always rebuilt from it here, so no user-typed URL ever reaches a page.
 */
export const SOCIAL_KINDS = ["instagram", "facebook", "tiktok", "whatsapp", "telegram"] as const;
export type SocialKind = (typeof SOCIAL_KINDS)[number];
export type SocialLinks = Record<SocialKind, string | null>;

/** Prisma select for the stored links on User */
export const socialSelect = { instagram: true, facebook: true, tiktok: true, whatsapp: true, telegram: true } as const;

const MAX_INPUT = 200;

const HOSTS: Record<SocialKind, string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com"],
  tiktok: ["tiktok.com"],
  whatsapp: ["wa.me", "whatsapp.com"],
  telegram: ["t.me", "telegram.me"],
};

const USERNAME: Record<Exclude<SocialKind, "whatsapp" | "facebook">, RegExp> = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
  telegram: /^[A-Za-z][A-Za-z0-9_]{4,31}$/,
};
const FACEBOOK_NAME = /^[A-Za-z0-9.]{5,50}$/;
const FACEBOOK_ID = /^profile\.php\?id=\d{5,20}$/;

/** A link of this network, with or without "https://" and "www."/"m.", parsed; null if it is not one */
function asUrl(kind: SocialKind, input: string): URL | null {
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|api|web)\./, "");
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return HOSTS[kind].includes(host) ? url : null;
}

/** Digits of an international number: local Azerbaijani numbers get +994, others must carry their country code */
function whatsappDigits(input: string): string | null {
  const local = normalizePhone(input);
  if (local) return local.slice(1);
  const compact = input.replace(/[\s\-().]/g, "");
  const match = /^(?:\+|00)(\d{8,15})$/.exec(compact);
  return match ? match[1] : null;
}

/** The stored value for what was typed: "" → null (not given), undefined → not valid */
export function normalizeSocial(kind: SocialKind, raw: string): string | null | undefined {
  const input = raw.trim();
  if (!input) return null;
  if (input.length > MAX_INPUT) return undefined;
  const looksLikeLink = /^https?:\/\//i.test(input) || HOSTS[kind].some((h) => input.toLowerCase().replace(/^(www|m|api|web)\./, "").startsWith(`${h}/`));
  const url = looksLikeLink ? asUrl(kind, input) : null;
  if (looksLikeLink && !url) return undefined;
  const firstSegment = url ? decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] ?? "") : "";

  switch (kind) {
    case "whatsapp": {
      if (!url) return whatsappDigits(input) ?? undefined;
      // wa.me/994501234567 or api.whatsapp.com/send?phone=994501234567
      const digits = url.hostname.endsWith("wa.me") ? firstSegment : (url.searchParams.get("phone") ?? "");
      return /^\d{8,15}$/.test(digits) ? digits : undefined;
    }
    case "facebook": {
      if (!url) return FACEBOOK_NAME.test(input.replace(/^@/, "")) ? input.replace(/^@/, "") : undefined;
      if (firstSegment === "profile.php") {
        const id = url.searchParams.get("id") ?? "";
        return FACEBOOK_ID.test(`profile.php?id=${id}`) ? `profile.php?id=${id}` : undefined;
      }
      return FACEBOOK_NAME.test(firstSegment) ? firstSegment : undefined;
    }
    default: {
      // TikTok links put "@" before the name: tiktok.com/@name
      const name = (url ? firstSegment : input).replace(/^@/, "");
      return USERNAME[kind].test(name) ? name : undefined;
    }
  }
}

/** Reads the five optional fields; any that cannot be understood is reported as "socialInvalid" */
export function parseSocialLinks(input: Partial<Record<string, string>>):
  | { success: true; data: SocialLinks }
  | { success: false; errors: Partial<Record<SocialKind, "socialInvalid">> } {
  const data = {} as SocialLinks;
  const errors: Partial<Record<SocialKind, "socialInvalid">> = {};
  for (const kind of SOCIAL_KINDS) {
    const value = normalizeSocial(kind, input[kind] ?? "");
    if (value === undefined) errors[kind] = "socialInvalid";
    else data[kind] = value;
  }
  return Object.keys(errors).length ? { success: false, errors } : { success: true, data };
}

/** The public link for a stored value (always https, always the network's own domain) */
export function socialUrl(kind: SocialKind, value: string): string {
  switch (kind) {
    case "instagram":
      return `https://www.instagram.com/${encodeURIComponent(value)}/`;
    case "facebook":
      return value.startsWith("profile.php?id=") ? `https://www.facebook.com/${value}` : `https://www.facebook.com/${encodeURIComponent(value)}`;
    case "tiktok":
      return `https://www.tiktok.com/@${encodeURIComponent(value)}`;
    case "whatsapp":
      return `https://wa.me/${value}`;
    case "telegram":
      return `https://t.me/${encodeURIComponent(value)}`;
  }
}

/** How a stored value is shown on a profile and put back into the form */
export function socialLabel(kind: SocialKind, value: string): string {
  if (kind === "whatsapp") return `+${value}`;
  if (kind === "facebook") return value.startsWith("profile.php?id=") ? "Facebook" : value;
  return `@${value}`;
}

/** Form value for a stored link: what the person would type */
export function socialInputValue(kind: SocialKind, value: string | null): string {
  if (!value) return "";
  return kind === "facebook" ? `facebook.com/${value}` : socialLabel(kind, value);
}

/** Only the links that are set, in display order */
export function presentLinks(links: Partial<SocialLinks>): { kind: SocialKind; url: string; label: string }[] {
  return SOCIAL_KINDS.flatMap((kind) => {
    const value = links[kind];
    return value ? [{ kind, url: socialUrl(kind, value), label: socialLabel(kind, value) }] : [];
  });
}
