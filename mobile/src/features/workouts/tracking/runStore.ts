import type { RoutePoint } from '@/db/workoutRepo';
import { isUsableAccuracy, stepDistanceM } from './geo';

type Listener = () => void;

let points: RoutePoint[] = [];
let distanceM = 0;
let startedAt = 0;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function resetRun(startTs: number): void {
  points = [];
  distanceM = 0;
  startedAt = startTs;
  emit();
}

export function addRunPoint(
  lat: number,
  lng: number,
  atMs: number,
  accuracyM?: number | null,
): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (!isUsableAccuracy(accuracyM)) return;
  const t = Math.max(0, atMs - startedAt);
  const p: RoutePoint = { lat, lng, t };
  const last = points[points.length - 1];
  if (last) {
    const add = stepDistanceM(last, p);
    if (add <= 0) return;
    distanceM += add;
  }
  points = [...points, p];
  emit();
}

export function getRunState(): { points: RoutePoint[]; distanceM: number } {
  return { points, distanceM };
}

export function subscribeRun(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
