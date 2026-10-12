import { describe, expect, it } from "vitest";
import { checkResume, cleanFileName, contentDisposition, MAX_RESUME_BYTES, sniffDocument } from "../resumes";

const enc = (s: string) => new TextEncoder().encode(s);
const pdf = enc("%PDF-1.7\n...");
const doc = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
const zip = (inside: string) => new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...enc(`....${inside}....`)]);

describe("sniffDocument", () => {
  it("recognises PDF, DOC and DOCX by their bytes", () => {
    expect(sniffDocument(pdf)).toBe("pdf");
    expect(sniffDocument(doc)).toBe("doc");
    expect(sniffDocument(zip("[Content_Types].xml word/document.xml"))).toBe("docx");
  });

  it("refuses other ZIP files and anything else", () => {
    expect(sniffDocument(zip("xl/workbook.xml"))).toBeNull();
    expect(sniffDocument(enc("MZ\x90\x00 executable"))).toBeNull();
    expect(sniffDocument(enc("<html><script>"))).toBeNull();
  });
});

describe("checkResume", () => {
  it("accepts a matching extension and type, case-insensitively", () => {
    expect(checkResume(pdf, "Əli Məmmədov CV.PDF")).toEqual({ type: "application/pdf", fileName: "Əli Məmmədov CV.PDF" });
    expect(checkResume(doc, "cv.doc")).toMatchObject({ type: "application/msword" });
  });

  it("refuses a renamed file, a wrong extension and an oversized file", () => {
    expect(checkResume(enc("MZ executable"), "cv.pdf")).toEqual({ error: "resumeType" });
    expect(checkResume(doc, "cv.pdf")).toEqual({ error: "resumeType" });
    expect(checkResume(pdf, "cv.txt")).toEqual({ error: "resumeType" });
    const big = new Uint8Array(MAX_RESUME_BYTES + 1);
    big.set(pdf);
    expect(checkResume(big, "cv.pdf")).toEqual({ error: "resumeTooLarge" });
  });
});

describe("file names", () => {
  it("drops paths and unsafe characters", () => {
    expect(cleanFileName("C:\\Users\\a\\..\\cv<1>.pdf")).toBe("cv1.pdf");
    expect(cleanFileName("../../etc/passwd")).toBe("passwd");
  });

  it("builds a header that keeps non-ASCII names", () => {
    expect(contentDisposition("Əli CV.pdf", false)).toBe(`attachment; filename="_li CV.pdf"; filename*=UTF-8''%C6%8Fli%20CV.pdf`);
    expect(contentDisposition("cv.pdf", true)).toMatch(/^inline;/);
  });
});
