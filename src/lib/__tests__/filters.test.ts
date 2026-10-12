import { describe, expect, it } from "vitest";
import { filtersHref, hasActiveFilters, parseJobFilters } from "../filters";

describe("parseJobFilters", () => {
  it("parses valid query values", () => {
    expect(parseJobFilters({ q: " aşpaz ", type: "PART_TIME", category: "service", district: "qax", location: "3", page: "2" })).toEqual({
      q: "aşpaz",
      type: "PART_TIME",
      category: "service",
      district: "qax",
      location: 3,
      page: 2,
    });
  });

  it("ignores invalid values instead of throwing", () => {
    expect(parseJobFilters({ type: "INTERN", location: "abc", page: "-5" })).toEqual({
      q: undefined,
      type: undefined,
      category: undefined,
      district: undefined,
      location: undefined,
      page: 1,
    });
  });

  it("uses the first value of repeated params and treats empty strings as unset", () => {
    const filters = parseJobFilters({ type: ["FULL_TIME", "PART_TIME"], q: "" });
    expect(filters.type).toBe("FULL_TIME");
    expect(filters.q).toBeUndefined();
  });

  it("reads a pay range, swaps a reversed one and treats amounts without a period as monthly", () => {
    expect(parseJobFilters({ pay: "HOUR", payMin: "5", payMax: "10" })).toMatchObject({ pay: "HOUR", payMin: 5, payMax: 10 });
    expect(parseJobFilters({ pay: "DAY", payMin: "20" })).toMatchObject({ pay: "DAY", payMin: 20 });
    expect(parseJobFilters({ payMin: "800", payMax: "300" })).toMatchObject({ pay: "MONTH", payMin: 300, payMax: 800 });
    expect(parseJobFilters({ pay: "YEAR", payMin: "-5", payMax: "abc" })).toMatchObject({ pay: undefined, payMin: undefined, payMax: undefined });
  });
});

describe("filtersHref", () => {
  const filters = parseJobFilters({ q: "aşpaz", district: "sheki", page: "3" });

  it("keeps other filters, resets the page and drops empty values", () => {
    expect(filtersHref("az", filters, { category: "service" })).toBe("/az/jobs?q=a%C5%9Fpaz&district=sheki&category=service");
    expect(filtersHref("az", filters, { district: undefined, q: "" })).toBe("/az/jobs");
  });

  it("can link to a page", () => {
    expect(filtersHref("en", filters, { page: 2 })).toBe("/en/jobs?q=a%C5%9Fpaz&district=sheki&page=2");
  });

  it("knows whether anything is filtered", () => {
    expect(hasActiveFilters(parseJobFilters({ page: "2" }))).toBe(false);
    expect(hasActiveFilters(filters)).toBe(true);
  });
});

