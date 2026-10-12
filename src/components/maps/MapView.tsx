"use client";

import { useEffect, useRef, useState } from "react";
import { createMap, MAPS_API_KEY } from "@/lib/google-maps";

/** Read-only map with the company's pin. Renders nothing without a key or if the map cannot load. */
export function MapView({ latitude, longitude, label }: { latitude: number; longitude: number; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!MAPS_API_KEY || !box.current) return;
    let cancelled = false;
    createMap(box.current, { lat: latitude, lng: longitude }, { interactive: false }).catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (!MAPS_API_KEY || failed) return null;
  return <div ref={box} role="img" aria-label={label} className="h-56 w-full overflow-hidden rounded-xl border border-line bg-surface-2" />;
}
