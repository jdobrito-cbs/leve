import { useSyncExternalStore } from 'react';

export type MascotKind =
  | 'happy'
  | 'thirsty'
  | 'hydrated'
  | 'slimmer'
  | 'meds'
  | 'dose'
  | 'balance';

export const MASCOT_EVENT_MS = 60_000;

let current: MascotKind = 'happy';
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setMascotEvent(
  kind: Exclude<MascotKind, 'happy'>,
  durationMs: number = MASCOT_EVENT_MS,
): void {
  current = kind;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    current = 'happy';
    timer = null;
    emit();
  }, durationMs);
  emit();
}

export function getMascot(): MascotKind {
  return current;
}

export function subscribeMascot(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMascot(): MascotKind {
  return useSyncExternalStore(subscribeMascot, getMascot, getMascot);
}

let lastBalancePositive: boolean | null = null;

export function reportCaloricBalance(positiveOrEven: boolean): void {
  if (positiveOrEven && lastBalancePositive !== true) setMascotEvent('balance');
  lastBalancePositive = positiveOrEven;
}
