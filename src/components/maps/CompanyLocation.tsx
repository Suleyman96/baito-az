import { ExternalLink, MapPin } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { mapsLink } from "@/lib/google-maps";
import { t } from "@/lib/format";
import { MapView } from "./MapView";

type Place = { name: string; address: string | null; latitude: number | null; longitude: number | null };

/** Address, map pin and a Google Maps link. Renders nothing when the company has no location. */
export function CompanyLocation({ place, dict }: { place: Place; dict: Dictionary }) {
  const hasPoint = place.latitude !== null && place.longitude !== null;
  if (!place.address && !hasPoint) return null;

  return (
    <div className="space-y-2">
      {place.address && (
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <span>{place.address}</span>
        </p>
      )}
      {hasPoint && <MapView latitude={place.latitude!} longitude={place.longitude!} label={t(dict.companies.mapOf, { name: place.name })} />}
      <a href={mapsLink(place)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        {dict.companies.openInMaps}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
