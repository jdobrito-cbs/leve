/**
 * Sistema de medidas do Leve.
 *
 * O BANCO guarda sempre métrico (kg, cm, ml) — trocar de sistema nunca
 * converte dados, só a exibição e a entrada. 'auto' segue a região do
 * aparelho (EUA → imperial; resto do mundo → métrico).
 */
import { numberLocale } from '@/i18n/engine';
import { parseDecimalBR } from './text';

export type UnitSystem = 'metric' | 'imperial';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;
const ML_PER_FLOZ = 29.5735295625;

let active: UnitSystem = 'metric';

// Assinantes da troca de sistema: o layout raiz re-renderiza o app na hora
// (sem isto, telas já montadas manteriam kg/lb antigos até reabrir o app).
const unitListeners = new Set<() => void>();

export function subscribeUnits(listener: () => void): () => void {
  unitListeners.add(listener);
  return () => {
    unitListeners.delete(listener);
  };
}

export function setUnitSystem(system: UnitSystem): void {
  active = system;
  unitListeners.forEach((l) => l());
}

export function getUnitSystem(): UnitSystem {
  return active;
}

/** Campos de formulário digitam na unidade de exibição e o app guarda métrico:
 *  converte a string digitada aplicando f (ida ou volta) com casas fixas. */
export function convertDisplayInput(
  s: string,
  f: (n: number) => number,
  digits: number,
): string {
  const n = parseDecimalBR(s);
  if (n === null) return s;
  const p = 10 ** digits;
  return String(Math.round(f(n) * p) / p);
}

const fmt = (v: number, digits: number) =>
  v.toLocaleString(numberLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });

// ——— Peso (kg ↔ lb) ———

export function weightUnit(): 'kg' | 'lb' {
  return active === 'imperial' ? 'lb' : 'kg';
}

export function kgToDisplay(kg: number): number {
  return active === 'imperial' ? kg / KG_PER_LB : kg;
}

export function displayToKg(value: number): number {
  return active === 'imperial' ? value * KG_PER_LB : value;
}

export function formatWeight(kg: number, digits = 1): string {
  return `${fmt(kgToDisplay(kg), digits)} ${weightUnit()}`;
}

// ——— Comprimento (cm ↔ in / ft'in") ———

export function lengthUnit(): 'cm' | 'in' {
  return active === 'imperial' ? 'in' : 'cm';
}

export function cmToDisplay(cm: number): number {
  return active === 'imperial' ? cm / CM_PER_IN : cm;
}

export function displayToCm(value: number): number {
  return active === 'imperial' ? value * CM_PER_IN : value;
}

/** Altura: métrico "175 cm"; imperial "5'9"" (pés e polegadas). */
export function formatHeight(cm: number): string {
  if (active !== 'imperial') return `${fmt(cm, 0)} cm`;
  const totalIn = Math.round(cm / CM_PER_IN);
  const ft = Math.floor(totalIn / 12);
  const inches = totalIn % 12;
  return `${ft}'${inches}"`;
}

export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(totalIn / 12), inches: totalIn % 12 };
}

// ——— Volume (ml ↔ fl oz) ———

export function volumeUnit(): 'ml' | 'fl oz' {
  return active === 'imperial' ? 'fl oz' : 'ml';
}

export function mlToDisplay(ml: number): number {
  return active === 'imperial' ? ml / ML_PER_FLOZ : ml;
}

export function displayToMl(value: number): number {
  return active === 'imperial' ? value * ML_PER_FLOZ : value;
}

export function formatVolume(ml: number, digits = 0): string {
  const v = mlToDisplay(ml);
  return active === 'imperial' ? `${fmt(v, Math.max(digits, 1))} fl oz` : `${fmt(v, digits)} ml`;
}
