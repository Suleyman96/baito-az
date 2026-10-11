import { describe, expect, it } from "vitest";
import { normalizePhone, parseIdentifier, registerSchema, safeNext } from "../auth/validation";

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

  it("requires a company name for employers only", () => {
    expect(errors({ ...base, phone: "0501234567", role: "EMPLOYER" })).toEqual(["companyName:companyRequired"]);
    expect(errors({ ...base, phone: "0501234567", role: "EMPLOYER", companyName: "Bərəkət" })).toEqual([]);
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
