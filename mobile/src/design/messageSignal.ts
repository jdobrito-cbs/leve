type Listener = () => void;

export interface AppMessage {
  title: string;
  detail?: string;
}

let current: AppMessage | null = null;
const listeners = new Set<Listener>();

export function showMessage(title: string, detail?: string): void {
  current = { title, detail };
  listeners.forEach((l) => l());
}

export function dismissMessage(): void {
  current = null;
  listeners.forEach((l) => l());
}

export function getMessage(): AppMessage | null {
  return current;
}

export function subscribeMessage(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
