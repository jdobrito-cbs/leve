import { and, desc, eq, gte } from 'drizzle-orm';
import { localDayKey } from '@/core/datetime';
import type { AppDb } from '@/db/client';
import { medIntakes, medications } from '@/db/schema';

export interface Medication {
  id: number;
  name: string;
  doseText: string | null;
  times: string;
  active: number;
}

export interface TodayIntake {
  intakeId: number;
  medicationId: number;
  name: string;
  doseText: string | null;
  time: string;
  takenAt: string | null;
}

export const DAILY_DOSE_COUNTS = [1, 2, 3, 4, 6, 8, 12] as const;

export function timesForDailyCount(count: number): string[] {
  const stepMin = Math.round((24 * 60) / count);
  const times = Array.from({ length: count }, (_, i) => {
    const totalMin = (8 * 60 + i * stepMin) % (24 * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });
  return times.sort();
}

export function parseTimes(times: string): string[] {
  return times
    .split(',')
    .map((t) => t.trim())
    .filter((t) => /^\d{2}:\d{2}$/.test(t));
}

export async function addMedication(
  db: AppDb,
  input: { name: string; doseText?: string | null; times: string[] },
): Promise<void> {
  await db.insert(medications).values({
    name: input.name,
    doseText: input.doseText ?? null,
    times: input.times.join(','),
    active: 1,
  });
}

export async function listMedications(db: AppDb, onlyActive = true): Promise<Medication[]> {
  const rows = (await db.select().from(medications)) as Medication[];
  return onlyActive ? rows.filter((m) => m.active === 1) : rows;
}

export async function deactivateMedication(db: AppDb, id: number): Promise<void> {
  await db.update(medications).set({ active: 0 }).where(eq(medications.id, id));
}

export async function todayIntakes(db: AppDb, day: Date): Promise<TodayIntake[]> {
  const meds = await listMedications(db);
  const dayKey = localDayKey(day);
  const existing = (await db
    .select()
    .from(medIntakes)
    .where(gte(medIntakes.scheduledFor, `${dayKey} 00:00`))) as {
    id: number;
    medicationId: number;
    scheduledFor: string;
    takenAt: string | null;
  }[];
  const have = new Set(existing.map((i) => `${i.medicationId}|${i.scheduledFor}`));

  for (const med of meds) {
    for (const time of parseTimes(med.times)) {
      const scheduledFor = `${dayKey} ${time}`;
      if (!have.has(`${med.id}|${scheduledFor}`)) {
        await db.insert(medIntakes).values({ medicationId: med.id, scheduledFor });
      }
    }
  }

  const rows = (await db
    .select()
    .from(medIntakes)
    .where(and(gte(medIntakes.scheduledFor, `${dayKey} 00:00`)))) as {
    id: number;
    medicationId: number;
    scheduledFor: string;
    takenAt: string | null;
  }[];
  const byId = new Map(meds.map((m) => [m.id, m]));
  return rows
    .filter((r) => r.scheduledFor.startsWith(dayKey) && byId.has(r.medicationId))
    .map((r) => ({
      intakeId: r.id,
      medicationId: r.medicationId,
      name: byId.get(r.medicationId)!.name,
      doseText: byId.get(r.medicationId)!.doseText,
      time: r.scheduledFor.slice(11),
      takenAt: r.takenAt,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export async function markTaken(db: AppDb, intakeId: number, at: Date): Promise<void> {
  await db.update(medIntakes).set({ takenAt: at.toISOString() }).where(eq(medIntakes.id, intakeId));
}

export async function adherence(db: AppDb, days: number, today: Date): Promise<{ taken: number; total: number }> {
  const since = new Date(today);
  since.setDate(since.getDate() - (days - 1));
  const sinceKey = `${localDayKey(since)} 00:00`;
  const rows = (await db
    .select({ takenAt: medIntakes.takenAt })
    .from(medIntakes)
    .where(gte(medIntakes.scheduledFor, sinceKey))
    .orderBy(desc(medIntakes.scheduledFor))) as { takenAt: string | null }[];
  return { taken: rows.filter((r) => r.takenAt).length, total: rows.length };
}
