import { useSyncExternalStore } from 'react';

/**
 * Mascote do topo do Hoje. O padrão é SEMPRE o panda feliz; eventos do app
 * (aviso de beber água, gole registrado…) trocam o mascote por um período
 * curto e ele volta ao feliz sozinho.
 */
export type MascotKind = 'happy' | 'thirsty' | 'hydrated';

export const MASCOT_EVENT_MS = 60_000;

let current: MascotKind = 'happy';
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Mostra o mascote do evento por `durationMs` e volta ao panda feliz. */
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
