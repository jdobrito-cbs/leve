import type { RoutePoint } from '@/db/workoutRepo';
import { isUsableAccuracy, stepDistanceM } from './geo';

type Listener = () => void;

const STALE_BEFORE_START_MS = 3000;

let points: RoutePoint[] = [];
let distanceM = 0;
let startedAt = 0;
let heading = 0;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function resetRun(startTs: number): void {
  points = [];
  distanceM = 0;
  startedAt = startTs;
  heading = 0;
  emit();
}

export function addRunPoint(
  lat: number,
  lng: number,
  atMs: number,
  accuracyM?: number | null,
  headingDeg?: number | null,
): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (!isUsableAccuracy(accuracyM)) return;
  if (startedAt > 0 && atMs < startedAt - STALE_BEFORE_START_MS) return;
  if (headingDeg != null && Number.isFinite(headingDeg) && headingDeg >= 0) {
    heading = headingDeg;
  }
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

export function getRunState(): { points: RoutePoint[]; distanceM: number; heading: number } {
  return { points, distanceM, heading };
}

export function subscribeRun(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
