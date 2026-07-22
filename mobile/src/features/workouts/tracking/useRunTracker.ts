import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoutePoint } from '@/db/workoutRepo';
import { stepDistanceM } from './geo';

export type RunStatus = 'idle' | 'recording' | 'paused';

export interface RunResult {
  startAt: string;
  endAt: string;
  durationSec: number;
  distanceM: number;
  route: RoutePoint[];
}

export function useRunTracker() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sub = useRef<Location.LocationSubscription | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);
  const segStartRef = useRef(0);
  const lastPointRef = useRef<RoutePoint | null>(null);

  const stopWatch = useCallback(() => {
    sub.current?.remove();
    sub.current = null;
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    timer.current = setInterval(() => {
      setElapsedSec(baseElapsedRef.current + Math.round((Date.now() - segStartRef.current) / 1000));
    }, 1000);
  }, []);

  const startWatch = useCallback(async () => {
    sub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 1000 },
      (loc) => {
        const t = startedAtRef.current != null ? Date.now() - startedAtRef.current : 0;
        const p: RoutePoint = { lat: loc.coords.latitude, lng: loc.coords.longitude, t };
        const last = lastPointRef.current;
        if (last) {
          const add = stepDistanceM(last, p);
          if (add <= 0) return;
          lastPointRef.current = p;
          setPoints((prev) => [...prev, p]);
          setDistanceM((d) => d + add);
          return;
        }
        lastPointRef.current = p;
        setPoints((prev) => [...prev, p]);
      },
    );
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      setError('permission');
      return;
    }
    startedAtRef.current = Date.now();
    baseElapsedRef.current = 0;
    segStartRef.current = Date.now();
    lastPointRef.current = null;
    setPoints([]);
    setDistanceM(0);
    setElapsedSec(0);
    setStatus('recording');
    startTimer();
    await startWatch();
  }, [startTimer, startWatch]);

  const pause = useCallback(() => {
    baseElapsedRef.current += Math.round((Date.now() - segStartRef.current) / 1000);
    stopWatch();
    setStatus('paused');
  }, [stopWatch]);

  const resume = useCallback(async () => {
    segStartRef.current = Date.now();
    setStatus('recording');
    startTimer();
    await startWatch();
  }, [startTimer, startWatch]);

  const stop = useCallback((): RunResult => {
    if (status === 'recording') {
      baseElapsedRef.current += Math.round((Date.now() - segStartRef.current) / 1000);
    }
    stopWatch();
    const result: RunResult = {
      startAt: new Date(startedAtRef.current ?? Date.now()).toISOString(),
      endAt: new Date().toISOString(),
      durationSec: baseElapsedRef.current,
      distanceM: Math.round(distanceM),
      route: points,
    };
    setStatus('idle');
    return result;
  }, [status, stopWatch, distanceM, points]);

  useEffect(() => () => stopWatch(), [stopWatch]);

  return { status, points, distanceM, elapsedSec, error, start, pause, resume, stop };
}
