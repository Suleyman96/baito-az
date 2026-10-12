import { describe, expect, it } from "vitest";
import { checkImage, MAX_IMAGE_BYTES, sniffImageType } from "../images";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);

describe("sniffImageType", () => {
  it("recognises JPEG, PNG and WebP by their bytes", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp");
  });

  it("refuses everything else, including SVG and renamed files", () => {
    expect(sniffImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe("checkImage", () => {
  it("accepts a valid image and rejects one that is too large", () => {
    expect(checkImage(bytes(0xff, 0xd8, 0xff))).toEqual({ type: "image/jpeg" });
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect(checkImage(big)).toEqual({ error: "imageTooLarge" });
    expect(checkImage(bytes(1, 2, 3))).toEqual({ error: "imageType" });
  });
});
