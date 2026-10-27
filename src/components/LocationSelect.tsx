"use client";

import { useEffect, useRef, useState } from "react";

type District = { slug: string; label: string };
type Place = { id: number; name: string };

async function fetchPlaces(district: string): Promise<Place[]> {
  const res = await fetch(`/api/districts/${encodeURIComponent(district)}/locations`);
  return res.ok ? res.json() : [];
}

/**
 * City/district + village pair. Picking a district loads only that district's places (a city or district
 * can have hundreds), so the page does not carry all of Azerbaijan's ~4,600 places. The server renders the
 * initially chosen district's places (`places`), so that choice also works without JavaScript.
 */
export function LocationSelect({
  districts,
  district: initialDistrict,
  location,
  places: initialPlaces,
  labels,
  className,
  villageName = "location",
}: {
  districts: District[];
  district?: string;
  location?: number;
  /** Places of the initial district, when the server already has them */
  places?: Place[];
  labels: { allDistricts: string; allVillages: string };
  className: string;
  /** Form field name of the village select */
  villageName?: string;
}) {
  const [district, setDistrict] = useState(initialDistrict ?? "");
  const [village, setVillage] = useState(location ? String(location) : "");
  const [places, setPlaces] = useState<Place[]>(initialPlaces ?? []);
  const [loading, setLoading] = useState(false);
  // Loaded lists, so switching back to a district does not fetch again; the latest choice wins a race
  const cache = useRef(new Map<string, Place[]>(initialDistrict && initialPlaces ? [[initialDistrict, initialPlaces]] : []));
  const latest = useRef(initialDistrict ?? "");

  function load(slug: string) {
    latest.current = slug;
    const cached = cache.current.get(slug);
    if (!slug || cached) {
      setPlaces(cached ?? []);
      return;
    }
    setLoading(true);
    fetchPlaces(slug)
      .catch(() => [])
      .then((list) => {
        cache.current.set(slug, list);
        if (latest.current !== slug) return;
        setPlaces(list);
        setLoading(false);
      });
  }

  // A district chosen before (e.g. kept after a form error) whose places the server did not send
  useEffect(() => {
    if (initialDistrict && !initialPlaces) {
      fetchPlaces(initialDistrict)
        .catch(() => [])
        .then((list) => {
          cache.current.set(initialDistrict, list);
          if (latest.current === initialDistrict) setPlaces(list);
        });
    }
  }, [initialDistrict, initialPlaces]);

  return (
    <>
      <select
        name="district"
        value={district}
        onChange={(e) => {
          setDistrict(e.target.value);
          setVillage("");
          load(e.target.value);
        }}
        aria-label={labels.allDistricts}
        className={className}
      >
        <option value="">{labels.allDistricts}</option>
        {districts.map((d) => (
          <option key={d.slug} value={d.slug}>
            {d.label}
          </option>
        ))}
      </select>
      <select
        name={villageName}
        value={village}
        onChange={(e) => setVillage(e.target.value)}
        aria-label={labels.allVillages}
        aria-busy={loading}
        disabled={loading}
        className={className}
      >
        <option value="">{labels.allVillages}</option>
        {places.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </>
  );
}
