import { describe, expect, it } from "vitest";
import { registerSchema } from "../auth/validation";
import { cleanText, EMAIL, isCompanyName, isJobTitle, isPersonName, parseAmount, passwordProblem } from "../validation-rules";

const form = { role: "SEEKER", name: "Əli Məmmədov", phone: "", password: "secret123", companyName: "", acceptTerms: "on" };

describe("isPersonName", () => {
  it.each(["Əli Məmmədov", "Şəhla Qasımova", "Anna-Mariya", "O'Neil", "Иван Петров", "山田 太郎", "ヤマダ・タロウ", "  Leyla   Quliyeva "])(
    "accepts %s",
    (name) => expect(isPersonName(name)).toBe(true),
  );
  it.each(["Əli123", "12345", "Əli!", "a", "Əli  -Vəli", "-Əli", "Əli_Vəli", "x".repeat(81), "Əli @gmail"])("refuses %s", (name) =>
    expect(isPersonName(name)).toBe(false),
  );
});

describe("isCompanyName", () => {
  it.each(["Bərəkət Market — Qax", "«Aqro» MMC", "A&B Co.", "№1 Aptek", "Dağ Restoranı", "24/7 Market"])("accepts %s", (name) =>
    expect(isCompanyName(name)).toBe(true),
  );
  it.each(["--", "Market <script>", "Shop 😀", "A", "x".repeat(101)])("refuses %s", (name) => expect(isCompanyName(name)).toBe(false));
});

describe("isJobTitle", () => {
  it("needs a letter", () => {
    expect(isJobTitle("Kassir")).toBe(true);
    expect(isJobTitle("12345")).toBe(false);
    expect(isJobTitle("ab")).toBe(false);
  });
});

describe("cleanText", () => {
  it("drops control and direction characters, keeps line breaks, tabs and emoji", () => {
    expect(cleanText(" Salam\r\nDünya\u0000‮\t👍🏽 \n")).toBe("Salam\nDünya\t👍🏽");
    expect(cleanText("👨‍👩‍👧")).toBe("👨‍👩‍👧"); // joined emoji stay joined
  });
});

describe("passwordProblem", () => {
  it("wants 8+ characters with a letter and a digit", () => {
    expect(passwordProblem("abc12")).toBe("passwordShort");
    expect(passwordProblem("abcdefgh")).toBe("passwordWeak");
    expect(passwordProblem("12345678")).toBe("passwordWeak");
    expect(passwordProblem("şifrə2026")).toBe(null);
  });
  it("refuses what bcrypt would cut off", () => {
    expect(passwordProblem(`a1${"x".repeat(70)}`)).toBe(null); // 72 bytes
    expect(passwordProblem(`a1${"ə".repeat(40)}`)).toBe("passwordLong"); // ə is 2 bytes: 82
  });
});

describe("parseAmount", () => {
  it.each([
    ["3", 3],
    ["3.5", 3.5],
    ["3,50", 3.5],
    ["1 500", 1500],
    ["100000", 100000],
    ["", null],
    ["  ", null],
  ])("reads %j", (raw, amount) => expect(parseAmount(raw)).toBe(amount));
  it.each(["0", "-5", "3.555", "abc", "3,5,0", "100000.01", "1e3"])("refuses %j", (raw) => expect(parseAmount(raw)).toBeUndefined());
});

describe("EMAIL (same rule in the browser and on the server)", () => {
  it.each(["ali@mail.az", "a.b+c@sub.mail.com", "o'neil@x.io"])("accepts %s on both sides", (email) => {
    expect(EMAIL.test(email)).toBe(true);
    expect(registerSchema.safeParse({ ...form, email }).success).toBe(true);
  });
  it.each(["ali@mail", "ali@", "@mail.az", "ali mail@x.az", "ali@@x.az", "ali@x.a"])("refuses %s on both sides", (email) => {
    expect(EMAIL.test(email)).toBe(false);
    expect(registerSchema.safeParse({ ...form, email }).success).toBe(false);
  });
});
