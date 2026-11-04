"use client";

import { useEffect, useRef, useState } from "react";

type District = { slug: string; label: string };
type Place = { id: number; name: string };

// Throws when the list could not be loaded, so a failure is not mistaken for a district without places
async function fetchPlaces(district: string): Promise<Place[]> {
  const res = await fetch(`/api/districts/${encodeURIComponent(district)}/locations`);
  if (!res.ok) throw new Error(`Places request failed: ${res.status}`);
  return res.json();
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
  /** loadFailed: shown in the village select when its list could not be loaded */
  labels: { allDistricts: string; allVillages: string; loadFailed: string };
  className: string;
  /** Form field name of the village select */
  villageName?: string;
}) {
  const [district, setDistrict] = useState(initialDistrict ?? "");
  const [village, setVillage] = useState(location ? String(location) : "");
  const [places, setPlaces] = useState<Place[]>(initialPlaces ?? []);
  const [loading, setLoading] = useState(false);
  // The district whose places failed to load; opening the village select tries again
  const [failed, setFailed] = useState("");
  // Loaded lists, so switching back to a district does not fetch again; the latest choice wins a race
  const cache = useRef(new Map<string, Place[]>(initialDistrict && initialPlaces ? [[initialDistrict, initialPlaces]] : []));
  const latest = useRef(initialDistrict ?? "");

  function load(slug: string) {
    latest.current = slug;
    setFailed("");
    const cached = cache.current.get(slug);
    if (!slug || cached) {
      setPlaces(cached ?? []);
      return;
    }
    setLoading(true);
    fetchPlaces(slug).then(
      (list) => {
        cache.current.set(slug, list);
        if (latest.current !== slug) return;
        setPlaces(list);
        setLoading(false);
      },
      // Not cached, so the next attempt asks the server again
      () => {
        if (latest.current !== slug) return;
        setPlaces([]);
        setFailed(slug);
        setLoading(false);
      },
    );
  }

  // A district chosen before (e.g. kept after a form error) whose places the server did not send
  useEffect(() => {
    if (initialDistrict && !initialPlaces) {
      fetchPlaces(initialDistrict).then(
        (list) => {
          cache.current.set(initialDistrict, list);
          if (latest.current === initialDistrict) setPlaces(list);
        },
        () => {
          if (latest.current === initialDistrict) setFailed(initialDistrict);
        },
      );
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
        onFocus={() => failed && load(failed)}
        aria-label={labels.allVillages}
        aria-invalid={!!failed || undefined}
        aria-busy={loading}
        disabled={loading}
        className={className}
      >
        <option value="">{failed ? labels.loadFailed : labels.allVillages}</option>
        {places.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </>
  );
}
