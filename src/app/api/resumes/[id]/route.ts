import { canViewResume } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth/session";
import { contentDisposition } from "@/lib/resumes";
import { readResume } from "@/lib/storage";

/**
 * Serves a CV to its owner, admins and the employers it was sent to; everyone else gets 404
 * (not 403, so the existence of a CV is not revealed). PDFs open in the browser's viewer;
 * Word files, and any file with ?download=1, are downloaded.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/resumes/[id]">) {
  const { id } = await params;
  const [viewer, resume] = await Promise.all([getCurrentUser(), readResume(id)]);
  const sentTo = resume?.applications.map((a) => a.job.company.ownerId) ?? [];
  if (!resume || !canViewResume(viewer, { ownerId: resume.ownerId, sentTo })) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const download = new URL(request.url).searchParams.has("download");
  const inline = !download && resume.mimeType === "application/pdf";
  return new Response(resume.data, {
    headers: {
      "Content-Type": resume.mimeType,
      "Content-Disposition": contentDisposition(resume.fileName, inline),
      // Private: never stored by shared caches or kept by the browser after logout
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
