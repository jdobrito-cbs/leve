/**
 * Sexo selecionado, em memória, para a tab bar reagir na hora ao clique
 * no Perfil (a aba Ciclo aparece/some sem esperar salvar ou navegar).
 */
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
