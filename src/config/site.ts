import { regions } from "./regions";

// District-specific settings. Change these to adapt the site to another district.
export const site = {
  name: "Baito.az",
  currency: "AZN",
  categories: [
    "sales",
    "service",
    "agriculture",
    "construction",
    "education",
    "healthcare",
    "transport",
    "it",
    "office",
    "other",
  ],
  // Contact details on the About page. Empty values are not shown.
  contact: {
    email: "",
    phone: "",
    whatsapp: "",
  },
  // The districts the site started in, featured on the home page badge and in the footer.
  // Every city and district of Azerbaijan is available (src/config/regions.ts, places in the database).
  homeDistricts: ["zaqatala", "balaken", "qax", "sheki"],
} as const;

export type CategorySlug = (typeof site.categories)[number];
export type DistrictSlug = (typeof regions)[number]["slug"];

/** Every district slug, in Azerbaijani alphabetical order of the names */
export const DISTRICT_SLUGS: readonly string[] = regions.map((r) => r.slug);
export const isDistrict = (slug: string): slug is DistrictSlug => DISTRICT_SLUGS.includes(slug);
