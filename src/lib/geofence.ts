export const GEOFENCE_RADIUS_M = 30_000;

export type HomePoint = { lat: number; lon: number };

const KEY = "caregiver.home";
const DEFAULT_HOME: HomePoint = { lat: 6.5244, lon: 3.3792 };

export function getHome(): HomePoint {
  if (typeof window === "undefined") return DEFAULT_HOME;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HomePoint;
      if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_HOME;
}

export function setHome(p: HomePoint) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export function haversineMeters(a: HomePoint, b: HomePoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function isOutsideGeofence(
  home: HomePoint,
  point: HomePoint,
  radiusM = GEOFENCE_RADIUS_M
): boolean {
  return haversineMeters(home, point) > radiusM;
}
