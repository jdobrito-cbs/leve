type Listener = () => void;

let current: string | null = null;
const listeners = new Set<Listener>();

export function setSexSignal(sex: string | null): void {
  current = sex;
  listeners.forEach((l) => l());
}

export function getSexSignal(): string | null {
  return current;
}

export function subscribeSex(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
