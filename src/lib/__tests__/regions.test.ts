import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { regions } from "@/config/regions";
import { DISTRICT_SLUGS, isDistrict, site } from "@/config/site";

type Place = { code: string; name: string; kind: string };
type District = { slug: string; code: string; name: string; kind: string; locations: Place[] };
const data: { districts: District[] } = JSON.parse(readFileSync(join(process.cwd(), "prisma/data/az-regions.json"), "utf8"));

describe("official territorial data", () => {
  it("has every city of republican subordination and district, once", () => {
    expect(data.districts).toHaveLength(75);
    expect(data.districts.filter((d) => d.kind === "city")).toHaveLength(11);
    expect(new Set(data.districts.map((d) => d.slug)).size).toBe(75);
    expect(new Set(data.districts.map((d) => d.code)).size).toBe(75);
  });

  it("keeps the districts the site started with, under the same slugs", () => {
    for (const slug of ["zaqatala", "balaken", "qax", "sheki"]) expect(isDistrict(slug)).toBe(true);
    expect(site.homeDistricts.every(isDistrict)).toBe(true);
  });

  it("has unique place codes and no repeated name within a city or district", () => {
    const places = data.districts.flatMap((d) => d.locations);
    expect(places).toHaveLength(4598);
    expect(new Set(places.map((p) => p.code)).size).toBe(places.length);
    for (const d of data.districts) expect(new Set(d.locations.map((l) => l.name)).size, d.name).toBe(d.locations.length);
  });

  it("places each settlement in the district its official code belongs to", () => {
    for (const d of data.districts) {
      for (const l of d.locations) {
        if (l.kind === "city" || l.kind === "baku_rayon") continue;
        // First 3 digits: the city or district (Baku's own districts are 001..012)
        if (d.slug === "baki") expect(Number(l.code.slice(0, 3)), l.name).toBeLessThanOrEqual(12);
        else expect(l.code.slice(0, 3), l.name).toBe(d.code.slice(0, 3));
      }
    }
  });

  it("reads letter-spaced and multi-word names correctly", () => {
    const names = (slug: string) => data.districts.find((d) => d.slug === slug)!.locations.map((l) => l.name);
    expect(names("baki")).toEqual(expect.arrayContaining(["Bakı şəhəri", "Binəqədi rayonu", "Biləcəri qəsəbəsi", "28 May qəsəbəsi", "M.Ə.Rəsulzadə qəsəbəsi"]));
    expect(names("sheki")).toEqual(expect.arrayContaining(["Şəki şəhəri", "Aşağı Göynük", "Baş Küngüt"]));
    expect(names("zaqatala")[0]).toBe("Zaqatala şəhəri");
  });

  it("matches the generated config", () => {
    expect(regions.map((r) => r.slug)).toEqual(data.districts.map((d) => d.slug));
    expect(DISTRICT_SLUGS).toEqual(regions.map((r) => r.slug));
  });
});
