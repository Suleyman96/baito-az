import { describe, expect, it } from "vitest";
import { normalizeSocial, parseSocialLinks, presentLinks, socialInputValue, socialUrl } from "../social-links";

describe("normalizeSocial", () => {
  it("accepts a username, @username or a link and keeps only the username", () => {
    for (const v of ["baito", "@baito", "instagram.com/baito", "https://www.instagram.com/baito/?hl=az"]) {
      expect(normalizeSocial("instagram", v)).toBe("baito");
    }
    for (const v of ["@zaqa.work", "tiktok.com/@zaqa.work", "https://www.tiktok.com/@zaqa.work?lang=az"]) {
      expect(normalizeSocial("tiktok", v)).toBe("zaqa.work");
    }
    for (const v of ["baito_bot", "@baito_bot", "t.me/baito_bot", "https://telegram.me/baito_bot"]) {
      expect(normalizeSocial("telegram", v)).toBe("baito_bot");
    }
    expect(normalizeSocial("facebook", "https://m.facebook.com/zaqa.work")).toBe("zaqa.work");
    expect(normalizeSocial("facebook", "facebook.com/profile.php?id=100012345678")).toBe("profile.php?id=100012345678");
  });

  it("accepts WhatsApp numbers and wa.me links", () => {
    expect(normalizeSocial("whatsapp", "050 123 45 67")).toBe("994501234567");
    expect(normalizeSocial("whatsapp", "+90 532 123 45 67")).toBe("905321234567");
    expect(normalizeSocial("whatsapp", "https://wa.me/994501234567")).toBe("994501234567");
    expect(normalizeSocial("whatsapp", "api.whatsapp.com/send?phone=994501234567")).toBe("994501234567");
  });

  it("treats empty as not given and rejects anything else", () => {
    expect(normalizeSocial("instagram", "  ")).toBeNull();
    for (const [kind, v] of [
      ["instagram", "javascript:alert(1)"],
      ["instagram", "https://evil.com/baito"],
      ["instagram", "instagram.com.evil.com/x"],
      ["instagram", "has space"],
      ["facebook", "<script>"],
      ["tiktok", "https://www.tiktok.com/"],
      ["telegram", "ab"],
      ["telegram", "ftp://t.me/baito"],
      ["whatsapp", "12345"],
      ["whatsapp", "https://wa.me/abc"],
    ] as const) {
      expect(normalizeSocial(kind, v), `${kind}: ${v}`).toBeUndefined();
    }
  });
});

describe("parseSocialLinks", () => {
  it("reports each field that is not valid", () => {
    expect(parseSocialLinks({ instagram: "@ok_name", telegram: "x" })).toEqual({ success: false, errors: { telegram: "socialInvalid" } });
    expect(parseSocialLinks({})).toEqual({ success: true, data: { instagram: null, facebook: null, tiktok: null, whatsapp: null, telegram: null } });
  });
});

describe("links shown on profiles", () => {
  it("are rebuilt on the network's own https domain and skip empty ones", () => {
    expect(presentLinks({ instagram: "baito", facebook: null, whatsapp: "994501234567", telegram: "baito_bot" })).toEqual([
      { kind: "instagram", url: "https://www.instagram.com/baito/", label: "@baito" },
      { kind: "whatsapp", url: "https://wa.me/994501234567", label: "+994501234567" },
      { kind: "telegram", url: "https://t.me/baito_bot", label: "@baito_bot" },
    ]);
    expect(socialUrl("tiktok", "zaqa.work")).toBe("https://www.tiktok.com/@zaqa.work");
    expect(socialInputValue("facebook", "zaqa.work")).toBe("facebook.com/zaqa.work");
  });
});
