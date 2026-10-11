"use client";

import { useState } from "react";

type District = { id: number; slug: string; label: string; locations: { id: number; name: string }[] };

// District + village pair. Picking a district narrows the village list to that district.
// Without JavaScript all villages stay listed, grouped by district.
export function LocationSelect({
  districts,
  district: initialDistrict,
  location,
  labels,
  className,
}: {
  districts: District[];
  district?: string;
  location?: number;
  labels: { allDistricts: string; allVillages: string };
  className: string;
}) {
  const [district, setDistrict] = useState(initialDistrict ?? "");
  const [village, setVillage] = useState(location ? String(location) : "");
  const shown = district ? districts.filter((d) => d.slug === district) : districts;

  return (
    <>
      <select
        name="district"
        value={district}
        onChange={(e) => {
          setDistrict(e.target.value);
          setVillage("");
        }}
        aria-label={labels.allDistricts}
        className={className}
      >
        <option value="">{labels.allDistricts}</option>
        {districts.map((d) => (
          <option key={d.id} value={d.slug}>
            {d.label}
          </option>
        ))}
      </select>
      <select
        name="location"
        value={village}
        onChange={(e) => setVillage(e.target.value)}
        aria-label={labels.allVillages}
        className={className}
      >
        <option value="">{labels.allVillages}</option>
        {shown.map((d) => (
          <optgroup key={d.id} label={d.label}>
            {d.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </>
  );
}
