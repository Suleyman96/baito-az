import { describe, expect, it } from "vitest";
import { mapsLink } from "../google-maps";

describe("mapsLink", () => {
  it("prefers the map point and falls back to the address", () => {
    expect(mapsLink({ address: "Car, Zaqatala", latitude: 41.63, longitude: 46.64 })).toBe("https://www.google.com/maps/search/?api=1&query=41.63%2C46.64");
    expect(mapsLink({ address: "Car, Zaqatala", latitude: null, longitude: null })).toBe("https://www.google.com/maps/search/?api=1&query=Car%2C%20Zaqatala");
  });
});
