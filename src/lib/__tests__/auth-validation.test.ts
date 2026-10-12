import { describe, expect, it } from "vitest";
import { accountSchema, companySchema, normalizePhone, parseIdentifier, passwordChangeSchema, registerSchema, safeNext } from "../auth/validation";

describe("normalizePhone", () => {
  it.each(["050 123 45 67", "+994 50 123-45-67", "994501234567", "501234567", "(055) 123 45 67"])("accepts %s", (input) => {
    expect(normalizePhone(input)).toMatch(/^\+994(50|55)1234567$/);
  });

  it.each(["12345", "012 123 45 67", "050 123 45 6", "abc", "+7 900 123 45 67"])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("registerSchema", () => {
  const base = { role: "SEEKER", name: "Əli Məmmədov", email: "", phone: "", password: "secret123", companyName: "" };
  const errors = (input: object) => {
    const result = registerSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => `${String(i.path[0])}:${i.message}`);
  };

  it("accepts phone only and normalizes it", () => {
    const result = registerSchema.parse({ ...base, phone: "050 123 45 67" });
    expect(result).toMatchObject({ phone: "+994501234567", email: undefined });
  });

  it("accepts email only and lowercases it", () => {
    expect(registerSchema.parse({ ...base, email: " Ali@Mail.AZ " }).email).toBe("ali@mail.az");
  });

  it("requires an email or a phone", () => {
    expect(errors(base)).toEqual(["email:contactRequired"]);
  });

  it("lets employers leave the company name empty (private persons)", () => {
    expect(registerSchema.parse({ ...base, phone: "0501234567", role: "EMPLOYER" }).companyName).toBeUndefined();
    expect(registerSchema.parse({ ...base, phone: "0501234567", role: "EMPLOYER", companyName: " Bərəkət " }).companyName).toBe("Bərəkət");
  });

  it("reports invalid fields with dictionary keys", () => {
    expect(errors({ ...base, name: "A", email: "nope", phone: "123", password: "short" })).toEqual(
      expect.arrayContaining(["name:nameRequired", "email:emailInvalid", "phone:phoneInvalid", "password:passwordShort"]),
    );
  });

  it("treats an unknown role as job seeker, so nobody can sign up as admin", () => {
    expect(registerSchema.parse({ ...base, phone: "0501234567", role: "ADMIN" }).role).toBe("SEEKER");
  });
});

describe("parseIdentifier", () => {
  it("detects email and phone", () => {
    expect(parseIdentifier("Ali@Mail.az")).toEqual({ email: "ali@mail.az" });
    expect(parseIdentifier("050 123 45 67")).toEqual({ phone: "+994501234567" });
    expect(parseIdentifier("hello")).toBeNull();
  });
});

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/az/jobs/1", "/az")).toBe("/az/jobs/1");
    expect(safeNext("https://evil.example", "/az")).toBe("/az");
    expect(safeNext("//evil.example", "/az")).toBe("/az");
    expect(safeNext("/\\evil.example", "/az")).toBe("/az");
    expect(safeNext(undefined, "/az")).toBe("/az");
  });
});

describe("profile schemas", () => {
  it("keeps at least one contact and normalizes the phone", () => {
    expect(accountSchema.parse({ name: "Əli", email: "", phone: "055 222 33 44" })).toEqual({ name: "Əli", email: undefined, phone: "+994552223344" });
    const empty = accountSchema.safeParse({ name: "Əli", email: "", phone: "" });
    expect(empty.success ? [] : empty.error.issues.map((i) => i.message)).toEqual(["contactRequired"]);
  });

  it("allows an empty company name and limits the description", () => {
    expect(companySchema.parse({ companyName: "", description: "", phone: "" })).toEqual({ companyName: undefined, description: undefined, phone: undefined });
    const long = companySchema.safeParse({ companyName: "", description: "x".repeat(1001), phone: "" });
    expect(long.success ? [] : long.error.issues.map((i) => i.message)).toEqual(["descriptionLong"]);
  });

  it("accepts an optional address and a complete, in-range map point", () => {
    const empty = { companyName: "", description: "", phone: "" };
    expect(companySchema.parse({ ...empty, address: "", latitude: "", longitude: "" })).toMatchObject({ address: undefined, latitude: undefined, longitude: undefined });
    expect(companySchema.parse({ ...empty, address: " Zaqatala, Car ", latitude: "41.6314", longitude: "46.6433" })).toMatchObject({
      address: "Zaqatala, Car",
      latitude: 41.6314,
      longitude: 46.6433,
    });
    const messages = (input: object) => {
      const r = companySchema.safeParse({ ...empty, ...input });
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };
    expect(messages({ latitude: "41.6" })).toEqual(["locationInvalid"]);
    expect(messages({ latitude: "123", longitude: "46" })).toEqual(["locationInvalid"]);
    expect(messages({ latitude: "abc", longitude: "46" })).toEqual(["locationInvalid"]);
    expect(messages({ address: "x".repeat(201) })).toEqual(["addressLong"]);
  });

  it("requires a new password of at least 8 characters", () => {
    const short = passwordChangeSchema.safeParse({ currentPassword: "old", newPassword: "short" });
    expect(short.success ? [] : short.error.issues.map((i) => i.message)).toEqual(["passwordShort"]);
  });
});
