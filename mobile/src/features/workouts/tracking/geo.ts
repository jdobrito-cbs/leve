import type { RoutePoint } from '@/db/workoutRepo';

const EARTH_M = 6371000;

export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const MAX_ACCURACY_M = 25;
export const MIN_STEP_M = 2;
export const MAX_SPEED_MPS = 12;

export function isUsableAccuracy(accuracyM?: number | null): boolean {
  if (accuracyM == null || !Number.isFinite(accuracyM)) return true;
  return accuracyM > 0 && accuracyM <= MAX_ACCURACY_M;
}

export function stepDistanceM(prev: RoutePoint, next: RoutePoint): number {
  const d = haversineM(prev, next);
  const dt = prev.t != null && next.t != null ? (next.t - prev.t) / 1000 : 1;
  if (d < MIN_STEP_M) return 0;
  if (dt > 0 && d / dt > MAX_SPEED_MPS) return 0;
  return d;
}

export function routeDistanceM(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineM(points[i - 1], points[i]);
  return total;
}
