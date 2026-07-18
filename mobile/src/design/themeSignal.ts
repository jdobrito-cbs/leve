/**
 * Preferência de tema escolhida no Perfil, em memória, para o app inteiro
 * reagir na hora ao toggle. null = seguir o tema do sistema.
 */
export type ThemeMode = 'light' | 'dark';

type Listener = () => void;

let current: ThemeMode | null = null;
const listeners = new Set<Listener>();

export function setThemeSignal(mode: ThemeMode | null): void {
  current = mode;
  listeners.forEach((l) => l());
}

export function getThemeSignal(): ThemeMode | null {
  return current;
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
