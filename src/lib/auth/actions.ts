"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "./session";
import { fieldErrors, loginSchema, parseIdentifier, registerSchema, safeNext, type AuthErrorKey } from "./validation";

export type AuthFormState = {
  errors: Partial<Record<string, AuthErrorKey>>;
  // Echoed back so the form keeps what the user typed (never the password)
  values: Record<string, string>;
} | undefined;

// Compared against when no user matches, so a wrong login takes as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

function homeFor(formData: FormData) {
  const lang = String(formData.get("lang") ?? "");
  return `/${hasLocale(lang) ? lang : defaultLocale}`;
}

function textValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = textValues(formData, ["role", "name", "email", "phone", "companyName"]);
  const parsed = registerSchema.safeParse({ ...values, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { role, name, email, phone, password, companyName } = parsed.data;
  try {
    const user = await db.user.create({
      data: {
        role,
        name,
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 10),
        company: role === "EMPLOYER" ? { create: { name: companyName!, phone } } : undefined,
      },
    });
    await createSession(user.id);
  } catch (e) {
    // Unique constraint: this email or phone already has an account
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = JSON.stringify(e.meta ?? {});
      return {
        errors: target.includes("phone") ? { phone: "phoneTaken" } : { email: "emailTaken" },
        values,
      };
    }
    throw e;
  }

  redirect(safeNext(formData.get("next"), homeFor(formData)));
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = textValues(formData, ["identifier"]);
  const failed: AuthFormState = { errors: { form: "invalidCredentials" }, values };

  const parsed = loginSchema.safeParse({ ...values, password: String(formData.get("password") ?? "") });
  if (!parsed.success) return failed;

  const where = parseIdentifier(parsed.data.identifier);
  const user = where ? await db.user.findUnique({ where }) : null;
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  // Same message for unknown account and wrong password, so accounts cannot be probed
  if (!user || !ok) return failed;

  await createSession(user.id);
  redirect(safeNext(formData.get("next"), homeFor(formData)));
}

export async function logout(formData: FormData) {
  await deleteSession();
  redirect(homeFor(formData));
}
