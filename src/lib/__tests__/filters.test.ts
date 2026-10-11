import { describe, expect, it } from "vitest";
import { parseJobFilters } from "../filters";

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
});
