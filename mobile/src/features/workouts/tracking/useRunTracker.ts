import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoutePoint } from '@/db/workoutRepo';
import { getRunState, resetRun, subscribeRun } from './runStore';
import { RUN_TASK } from './runTrackingTask';

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
  const [snap, setSnap] = useState(() => getRunState());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
    timer.current = setInterval(() => {
      setElapsedSec(baseElapsedRef.current + Math.round((Date.now() - segStartRef.current) / 1000));
    }, 1000);
  }, []);

  const startUpdates = useCallback(async () => {
    await Location.startLocationUpdatesAsync(RUN_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 3,
      timeInterval: 1000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Leve',
        notificationBody: 'Gravando corrida…',
      },
    });
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
    setError(null);
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
    setStatus('recording');
    startTimer();
    await startUpdates();
  }, [startTimer, startUpdates]);

  const pause = useCallback(async () => {
    baseElapsedRef.current += Math.round((Date.now() - segStartRef.current) / 1000);
    stopTimer();
    await stopUpdates();
    setStatus('paused');
  }, [stopTimer, stopUpdates]);

  const resume = useCallback(async () => {
    segStartRef.current = Date.now();
    setStatus('recording');
    startTimer();
    await startUpdates();
  }, [startTimer, startUpdates]);

  const stop = useCallback(async (): Promise<RunResult> => {
    if (status === 'recording') {
      baseElapsedRef.current += Math.round((Date.now() - segStartRef.current) / 1000);
    }
    stopTimer();
    await stopUpdates();
    const s = getRunState();
    setStatus('idle');
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
    points: snap.points,
    distanceM: snap.distanceM,
    elapsedSec,
    error,
    start,
    pause,
    resume,
    stop,
  };
}
