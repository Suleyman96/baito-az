import { describe, expect, it } from "vitest";
import { companyNameKey } from "../company-name";

describe("companyNameKey", () => {
  it("ignores case, extra spaces and the different i letters", () => {
    expect(companyNameKey("  BƏRƏKƏT   Market ")).toBe(companyNameKey("Bərəkət market"));
    expect(companyNameKey("İSTİ ÇÖRƏK")).toBe(companyNameKey("isti çörək"));
    expect(companyNameKey("Dağ Restoranı")).toBe(companyNameKey("DAĞ RESTORANI"));
    expect(companyNameKey("Dağ Restoranı")).toBe("dağ restorani");
  });

  it("still tells different names apart", () => {
    expect(companyNameKey("Bərəkət Market")).not.toBe(companyNameKey("Bərəkət Market Qax"));
    expect(companyNameKey("Gül")).not.toBe(companyNameKey("Gul"));
  });
});
