import type { WorkoutType } from '@/db/workoutRepo';

const MET: Record<WorkoutType, number> = { run: 8.3, walk: 4.3, other: 6 };

export function estimateWorkoutKcal(
  type: WorkoutType,
  weightKg: number | null,
  durationSec: number | null,
): number | null {
  if (!weightKg || weightKg <= 0 || !durationSec || durationSec <= 0) return null;
  return Math.round(MET[type] * weightKg * (durationSec / 3600));
}
