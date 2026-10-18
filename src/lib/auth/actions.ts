"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { companyNameKey } from "@/lib/company-name";
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
  // A real company name is registered once; private persons (no company name) are not compared
  const nameKey = role === "EMPLOYER" && companyName ? companyNameKey(companyName) : null;

  // Every duplicate at once, so the form can show them together (the unique constraints below still
  // decide if two sign-ups race)
  const [emailUser, phoneUser, company] = await Promise.all([
    email ? db.user.findUnique({ where: { email }, select: { id: true } }) : null,
    phone ? db.user.findUnique({ where: { phone }, select: { id: true } }) : null,
    nameKey ? db.company.findUnique({ where: { nameKey }, select: { id: true } }) : null,
  ]);
  const taken: AuthFormState = { errors: {}, values };
  if (emailUser) taken.errors.email = "emailTaken";
  if (phoneUser) taken.errors.phone = "phoneTaken";
  if (company) taken.errors.companyName = "companyNameTaken";
  if (Object.keys(taken.errors).length) return taken;

  try {
    const user = await db.user.create({
      data: {
        role,
        name,
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 10),
        // Private persons post under their own name
        company: role === "EMPLOYER" ? { create: { name: companyName ?? name, nameKey, phone } } : undefined,
      },
    });
    await createSession(user.id);
  } catch (e) {
    // Unique constraint: this email, phone or company name was registered meanwhile
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = JSON.stringify(e.meta ?? {});
      return {
        errors: target.includes("nameKey") ? { companyName: "companyNameTaken" } : target.includes("phone") ? { phone: "phoneTaken" } : { email: "emailTaken" },
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
  // Told only after a correct password, so this does not reveal which accounts exist
  if (user.blockedAt) return { errors: { form: "blocked" }, values };
  if (user.deletedAt) return failed;

  await createSession(user.id);
  redirect(safeNext(formData.get("next"), homeFor(formData)));
}

export async function logout(formData: FormData) {
  await deleteSession();
  redirect(homeFor(formData));
}
