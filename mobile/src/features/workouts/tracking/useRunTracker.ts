import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoutePoint } from '@/db/workoutRepo';
import { getRunState, resetRun, subscribeRun } from './runStore';
import { RUN_TASK } from './runTrackingTask';

export type RunStatus = 'idle' | 'recording' | 'paused';
export type RunError = 'permission' | 'start' | null;

export interface RunResult {
  startAt: string;
  endAt: string;
  durationSec: number;
  distanceM: number;
  route: RoutePoint[];
}

const START_TIMEOUT_MS = 15000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

export function useRunTracker() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [snap, setSnap] = useState(() => getRunState());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<RunError>(null);
  const [starting, setStarting] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);
  const segStartRef = useRef(0);

  useEffect(() => subscribeRun(() => setSnap(getRunState())), []);

  const stopTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timer.current = setInterval(() => {
      setElapsedSec(baseElapsedRef.current + Math.round((Date.now() - segStartRef.current) / 1000));
    }, 1000);
  }, [stopTimer]);

  const startUpdates = useCallback(async () => {
    await withTimeout(
      Location.startLocationUpdatesAsync(RUN_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 0,
        timeInterval: 1000,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Leve',
          notificationBody: 'Gravando corrida…',
        },
      }),
      START_TIMEOUT_MS,
    );
  }, []);

  const stopUpdates = useCallback(async () => {
    try {
      if (await Location.hasStartedLocationUpdatesAsync(RUN_TASK)) {
        await Location.stopLocationUpdatesAsync(RUN_TASK);
      }
    } catch {
      setError(null);
    }
  }, []);

  const start = useCallback(async () => {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        setError('permission');
        return;
      }
      await Location.requestBackgroundPermissionsAsync().catch(() => undefined);
      const now = Date.now();
      startedAtRef.current = now;
      baseElapsedRef.current = 0;
      segStartRef.current = now;
      setElapsedSec(0);
      resetRun(now);
      await startUpdates();
      setStatus('recording');
      startTimer();
    } catch {
      stopTimer();
      await stopUpdates();
      setStatus('idle');
      setError('start');
    } finally {
      setStarting(false);
    }
  }, [starting, startTimer, startUpdates, stopTimer, stopUpdates]);

  const pause = useCallback(async () => {
    baseElapsedRef.current += Math.round((Date.now() - segStartRef.current) / 1000);
    stopTimer();
    setStatus('paused');
    await stopUpdates();
  }, [stopTimer, stopUpdates]);

  const resume = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      await startUpdates();
      segStartRef.current = Date.now();
      setStatus('recording');
      startTimer();
    } catch {
      setError('start');
    } finally {
      setStarting(false);
    }
  }, [starting, startTimer, startUpdates]);

  const stop = useCallback(async (): Promise<RunResult> => {
    if (status === 'recording') {
      baseElapsedRef.current += Math.round((Date.now() - segStartRef.current) / 1000);
    }
    stopTimer();
    setStatus('idle');
    await stopUpdates();
    const s = getRunState();
    return {
      startAt: new Date(startedAtRef.current ?? Date.now()).toISOString(),
      endAt: new Date().toISOString(),
      durationSec: baseElapsedRef.current,
      distanceM: Math.round(s.distanceM),
      route: s.points,
    };
  }, [status, stopTimer, stopUpdates]);

  useEffect(
    () => () => {
      stopTimer();
      stopUpdates();
    },
    [stopTimer, stopUpdates],
  );

  return {
    status,
    starting,
    points: snap.points,
    distanceM: snap.distanceM,
    heading: snap.heading,
    elapsedSec,
    error,
    start,
    pause,
    resume,
    stop,
  };
}
