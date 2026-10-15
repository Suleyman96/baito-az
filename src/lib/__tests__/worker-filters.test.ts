import { describe, expect, it } from "vitest";
import { parseWorkerFilters, workerFiltersHref } from "../worker-filters";

describe("parseWorkerFilters", () => {
  it("reads valid filters and ignores invalid ones", () => {
    expect(parseWorkerFilters({ q: " elektrik ", group: "construction", profession: "electrician", district: "qax", type: "ONE_DAY", exp: "3", avail: "now", sort: "rating", page: "2" })).toMatchObject({
      q: "elektrik",
      group: "construction",
      profession: "electrician",
      district: "qax",
      type: "ONE_DAY",
      exp: 3,
      avail: "now",
      sort: "rating",
      page: 2,
    });
    expect(parseWorkerFilters({ group: "pirates", profession: "astronaut", district: "paris", exp: "7", sort: "random", page: "-1" })).toMatchObject({
      group: undefined,
      profession: undefined,
      district: undefined,
      exp: undefined,
      sort: "relevance",
      page: 1,
    });
  });

  it("reads a pay limit without a period as monthly", () => {
    expect(parseWorkerFilters({ payMax: "400" })).toMatchObject({ pay: "MONTH", payMax: 400 });
  });
});

describe("workerFiltersHref", () => {
  it("keeps filters, drops defaults and resets the page", () => {
    const filters = parseWorkerFilters({ q: "aşpaz", district: "sheki", page: "3" });
    expect(workerFiltersHref("az", filters, { sort: "rating" })).toBe("/az/workers?q=a%C5%9Fpaz&district=sheki&sort=rating");
    expect(workerFiltersHref("az", filters, { page: 2 })).toBe("/az/workers?q=a%C5%9Fpaz&district=sheki&page=2");
    expect(workerFiltersHref("en", {})).toBe("/en/workers");
  });
});
