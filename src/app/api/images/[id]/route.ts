import { readImage } from "@/lib/storage";

/**
 * Serves an uploaded image. Ids are random and an image is never changed in place
 * (replacing creates a new id), so browsers may cache it forever.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/images/[id]">) {
  const { id } = await params;
  const image = await readImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      // Never let a browser guess another type from the bytes
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
