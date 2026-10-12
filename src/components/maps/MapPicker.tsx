"use client";

import { Crosshair, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createMap, geocode, MAPS_API_KEY } from "@/lib/google-maps";
import { buttonClass } from "../ui";

type Texts = { mapLabel: string; mapHint: string; findOnMap: string; clearLocation: string; mapUnavailable: string; addressNotFound: string; locationSet: string };

/**
 * Pick a point on Google Maps: click the map or drag the pin. "Find on map" looks up the address
 * typed in the form's `address` field. The point goes into hidden latitude/longitude inputs.
 * Without an API key, or if the map fails to load, it says so and the address alone is saved.
 */
export function MapPicker({ latitude, longitude, texts }: { latitude: string; longitude: string; texts: Texts }) {
  const box = useRef<HTMLDivElement>(null);
  const picker = useRef<{ map: google.maps.Map; marker: google.maps.marker.AdvancedMarkerElement } | null>(null);
  const [point, setPoint] = useState<google.maps.LatLngLiteral | null>(
    latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : null,
  );
  const [failed, setFailed] = useState(!MAPS_API_KEY);
  const [notFound, setNotFound] = useState(false);
  const initial = useRef(point);

  useEffect(() => {
    if (!MAPS_API_KEY || !box.current) return;
    let cancelled = false;
    createMap(box.current, initial.current, { interactive: true })
      .then(({ map, marker }) => {
        if (cancelled) return;
        picker.current = { map, marker };
        const place = (latLng: google.maps.LatLngLiteral) => {
          marker.position = latLng;
          marker.map = map;
          setPoint(latLng);
          setNotFound(false);
        };
        map.addListener("click", (e: google.maps.MapMouseEvent) => e.latLng && place(e.latLng.toJSON()));
        marker.addListener("dragend", () => {
          const p = marker.position;
          if (p) place(p instanceof google.maps.LatLng ? p.toJSON() : { lat: Number(p.lat), lng: Number(p.lng) });
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  async function findAddress(button: HTMLButtonElement) {
    const address = (button.form?.elements.namedItem("address") as HTMLInputElement | null)?.value.trim();
    if (!address || !picker.current) return;
    const found = await geocode(address);
    if (!found) return setNotFound(true);
    const { map, marker } = picker.current;
    marker.position = found;
    marker.map = map;
    map.setCenter(found);
    map.setZoom(16);
    setPoint(found);
    setNotFound(false);
  }

  function clear() {
    if (picker.current) picker.current.marker.map = null;
    setPoint(null);
  }

  // Rounded to ~1 m; more digits add nothing
  const round = (n: number) => String(Math.round(n * 1e6) / 1e6);

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">{texts.mapLabel}</span>
      <input type="hidden" name="latitude" value={point ? round(point.lat) : ""} />
      <input type="hidden" name="longitude" value={point ? round(point.lng) : ""} />
      {failed ? (
        <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">{texts.mapUnavailable}</p>
      ) : (
        <>
          <div ref={box} className="h-72 w-full overflow-hidden rounded-xl border border-line-strong bg-surface-2" />
          <p className="text-xs text-muted">{texts.mapHint}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={(e) => findAddress(e.currentTarget)} className={buttonClass.secondary}>
              <Crosshair className="size-4" aria-hidden />
              {texts.findOnMap}
            </button>
            {point && (
              <button type="button" onClick={clear} className={`${buttonClass.secondary} hover:border-red-500 hover:text-red-600`}>
                <X className="size-4" aria-hidden />
                {texts.clearLocation}
              </button>
            )}
          </div>
        </>
      )}
      {point && (
        <p className="flex items-center gap-1.5 text-sm text-brand-strong">
          <MapPin className="size-4" aria-hidden />
          {texts.locationSet}: {round(point.lat)}, {round(point.lng)}
        </p>
      )}
      {notFound && <p className="text-sm text-red-600 dark:text-red-400">{texts.addressNotFound}</p>}
    </div>
  );
}
