import { describe, expect, it, vi } from "vitest";
import { createResendMailer, RESEND_TEST_FROM } from "../resend";

const email = { to: "employer@example.az", subject: "Yeni müraciət: Ofisiant", text: "Salam" };
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("createResendMailer", () => {
  it("is off without an API key", () => {
    expect(createResendMailer({}).configured).toBe(false);
    expect(createResendMailer({ apiKey: "  " }).configured).toBe(false);
  });

  it("posts the email to Resend with the key and the sender", async () => {
    const fetch = reply(200, { id: "abc" });
    const mailer = createResendMailer({ apiKey: "re_test", from: "Baito.az <no-reply@baito.az>", fetch });
    expect(mailer.configured).toBe(true);
    await mailer.send(email);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(String(init.body))).toEqual({ from: "Baito.az <no-reply@baito.az>", to: ["employer@example.az"], subject: email.subject, text: "Salam" });
  });

  it("uses Resend's test sender when no sender is set", async () => {
    const fetch = reply(200, { id: "abc" });
    await createResendMailer({ apiKey: "re_test", from: "", fetch }).send(email);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).from).toBe(RESEND_TEST_FROM);
  });

  it("throws Resend's explanation when the email is refused, without the key", async () => {
    const fetch = reply(403, { statusCode: 403, name: "validation_error", message: "You can only send testing emails to your own email address" });
    const error = await createResendMailer({ apiKey: "re_secret", fetch }).send(email).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Resend 403: You can only send testing emails to your own email address");
    expect((error as Error).message).not.toContain("re_secret");
  });
});
