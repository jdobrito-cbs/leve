import type { AppDb } from '@/db/client';
import {
  doseLogs,
  foodLogs,
  profile,
  settings,
  symptomLogs,
  waterLogs,
  weightLogs,
} from '@/db/schema';

type Row = Record<string, unknown>;

export interface LeveExport {
  version: 1;
  exportedAt: string;
  profile: Row | null;
  waterLogs: Row[];
  foodLogs: Row[];
  doseLogs: Row[];
  symptomLogs: Row[];
  weightLogs: Row[];
  settings: Row[];
}

export async function exportAllData(db: AppDb): Promise<LeveExport> {
  const [p, water, food, doses, symptoms, weights, sett] = await Promise.all([
    db.select().from(profile),
    db.select().from(waterLogs),
    db.select().from(foodLogs),
    db.select().from(doseLogs),
    db.select().from(symptomLogs),
    db.select().from(weightLogs),
    db.select().from(settings),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: (p[0] as Row | undefined) ?? null,
    waterLogs: water as Row[],
    foodLogs: food as Row[],
    doseLogs: doses as Row[],
    symptomLogs: symptoms as Row[],
    weightLogs: weights as Row[],
    settings: sett as Row[],
  };
}

export async function wipeAllData(db: AppDb): Promise<void> {
  await db.delete(waterLogs);
  await db.delete(foodLogs);
  await db.delete(doseLogs);
  await db.delete(symptomLogs);
  await db.delete(weightLogs);
  await db.delete(settings);
  await db.delete(profile);
}

function stripId(row: Row): Row {
  const { id: _id, ...rest } = row;
  return rest;
}

export async function importAllData(db: AppDb, data: LeveExport): Promise<void> {
  if (data.version !== 1) throw new Error('versão de backup desconhecida');
  await wipeAllData(db);
  if (data.profile) await db.insert(profile).values(stripId(data.profile) as never);
  const tables = [
    [waterLogs, data.waterLogs],
    [foodLogs, data.foodLogs],
    [doseLogs, data.doseLogs],
    [symptomLogs, data.symptomLogs],
    [weightLogs, data.weightLogs],
  ] as const;
  for (const [table, rows] of tables) {
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100).map(stripId);
      if (chunk.length) await db.insert(table).values(chunk as never);
    }
  }
  for (const row of data.settings) {
    if (row.key != null && row.value != null) {
      await db.insert(settings).values({ key: String(row.key), value: String(row.value) });
    }
  }
}
