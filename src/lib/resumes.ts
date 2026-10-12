// CV upload rules, shared by the browser (early feedback) and the server (the real check)

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const RESUME_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
export type ResumeExtension = keyof typeof RESUME_TYPES;
export type ResumeErrorKey = "resumeType" | "resumeTooLarge" | "resumeRequired";

/** For the file picker */
export const RESUME_ACCEPT = Object.entries(RESUME_TYPES)
  .flatMap(([ext, type]) => [`.${ext}`, type])
  .join(",");

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const startsWith = (bytes: Uint8Array, sig: number[]) => sig.every((b, i) => bytes[i] === b);

function contains(bytes: Uint8Array, text: string) {
  const needle = ascii(text);
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

/** The real document type from the file's bytes; the name and browser-sent type can be faked. */
export function sniffDocument(bytes: Uint8Array): ResumeExtension | null {
  if (startsWith(bytes, ascii("%PDF-"))) return "pdf";
  // Word 97–2003: an OLE2 compound file
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "doc";
  // .docx is a ZIP; a Word document contains word/document.xml (a renamed .xlsx or .zip does not)
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) && contains(bytes, "word/document.xml")) return "docx";
  return null;
}

/** File name without any path, safe characters only, at most 120 characters. */
export function cleanFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f"<>|*?:]/g, "").replace(/\s+/g, " ").trim();
  return (cleaned || "cv").slice(-120);
}

/**
 * Checks an uploaded CV: the extension must be .pdf/.doc/.docx AND match the actual bytes
 * (a renamed .exe or a .pdf that is really a .doc are refused).
 */
export function checkResume(bytes: Uint8Array, fileName: string): { type: string; fileName: string } | { error: ResumeErrorKey } {
  if (bytes.byteLength > MAX_RESUME_BYTES) return { error: "resumeTooLarge" };
  const name = cleanFileName(fileName);
  const extension = name.split(".").pop()?.toLowerCase();
  const actual = sniffDocument(bytes);
  if (!actual || extension !== actual) return { error: "resumeType" };
  return { type: RESUME_TYPES[actual], fileName: name };
}

/** Content-Disposition with the original (possibly non-ASCII, e.g. "Əli_CV.pdf") file name. */
export function contentDisposition(fileName: string, inline: boolean) {
  const fallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${inline ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export const resumeUrl = (id: string, download = false) => `/api/resumes/${id}${download ? "?download=1" : ""}`;
