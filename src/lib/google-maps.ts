// Google Maps JavaScript API, loaded on demand in the browser.
// Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; without it the site shows addresses and links instead of maps.

export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// Advanced markers need a Map ID; "DEMO_MAP_ID" is Google's documented id for development
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

/** Middle of the four districts (Zaqatala, Balakən, Qax, Şəki), for an empty map. */
export const REGION_CENTER = { lat: 41.45, lng: 46.85 };

let loading: Promise<void> | null = null;

/** Adds the Google Maps script once. Rejects when no key is set or the script fails (offline, blocked, bad key). */
export function loadGoogleMaps(): Promise<void> {
  if (!MAPS_API_KEY) return Promise.reject(new Error("Google Maps API key is not set"));
  const loaded = (window as { google?: { maps?: unknown } }).google?.maps;
  if (loaded) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const callback = "__baitoMapsReady";
    (window as unknown as Record<string, () => void>)[callback] = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_API_KEY)}&v=weekly&loading=async&callback=${callback}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

/** A map with one marker in `element`. */
export async function createMap(element: HTMLElement, position: google.maps.LatLngLiteral | null, options: { interactive: boolean }) {
  await loadGoogleMaps();
  const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
    google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
    google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
  ]);
  const map = new Map(element, {
    center: position ?? REGION_CENTER,
    zoom: position ? 15 : 9,
    mapId: MAP_ID,
    disableDefaultUI: !options.interactive,
    gestureHandling: options.interactive ? "greedy" : "cooperative",
    clickableIcons: false,
  });
  const marker = new AdvancedMarkerElement({ map: position ? map : null, position, gmpDraggable: options.interactive });
  return { map, marker };
}

/** Coordinates for a written address (Google Geocoding), or null when nothing is found. */
export async function geocode(address: string): Promise<google.maps.LatLngLiteral | null> {
  await loadGoogleMaps();
  const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
  try {
    // Results biased to Azerbaijan, where the site's districts are
    const { results } = await new Geocoder().geocode({ address, region: "az" });
    const location = results[0]?.geometry.location;
    return location ? { lat: location.lat(), lng: location.lng() } : null;
  } catch {
    return null;
  }
}

/** Link that opens the place in Google Maps (works without an API key). */
export function mapsLink(place: { address?: string | null; latitude?: number | null; longitude?: number | null }) {
  const query =
    place.latitude != null && place.longitude != null ? `${place.latitude},${place.longitude}` : (place.address ?? "");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
