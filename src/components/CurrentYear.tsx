import { cacheLife } from "next/cache";

/**
 * The current year, for the footer's copyright line. The footer is part of prerendered pages, where the
 * time can only be read inside a cache scope: the year is captured into the page and refreshed daily.
 */
export async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
