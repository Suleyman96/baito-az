import { isDistrict } from "@/config/site";
import { getDistrictPlaces } from "@/lib/jobs";

/** The places of one city or district, for the village picker (loaded when a district is chosen). */
export async function GET(_request: Request, { params }: RouteContext<"/api/districts/[slug]/locations">) {
  const { slug } = await params;
  if (!isDistrict(slug)) return Response.json([], { status: 404 });
  const places = await getDistrictPlaces(slug);
  // Official place lists change rarely
  return Response.json(places, { headers: { "Cache-Control": "public, max-age=3600" } });
}
