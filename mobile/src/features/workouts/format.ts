import { getUnitSystem } from '@/core/units';
import { numberLocale } from '@/i18n/engine';
import { strings } from '@/i18n/pt-BR';

const KM_PER_MI = 1.609344;

export function distanceLabel(m: number | null): string {
  if (m == null) return '—';
  const km = m / 1000;
  const imperial = getUnitSystem() === 'imperial';
  const v = imperial ? km / KM_PER_MI : km;
  const unit = imperial ? 'mi' : 'km';
  return `${v.toLocaleString(numberLocale(), { maximumFractionDigits: 2 })} ${unit}`;
}

export function durationLabel(sec: number | null): string {
  if (sec == null || sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function paceLabel(distanceM: number | null, durationSec: number | null): string {
  if (!distanceM || distanceM <= 0 || !durationSec || durationSec <= 0) return '—';
  const km = distanceM / 1000;
  const imperial = getUnitSystem() === 'imperial';
  const units = imperial ? km / KM_PER_MI : km;
  const secPerUnit = durationSec / units;
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  const unit = imperial ? 'mi' : 'km';
  return `${m}:${String(s).padStart(2, '0')} /${unit}`;
}

export function workoutTypeLabel(type: string): string {
  return type === 'run'
    ? strings.workouts.run
    : type === 'walk'
      ? strings.workouts.walk
      : strings.workouts.other;
}
