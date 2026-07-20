import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import { setSetting } from '@/db/settingsRepo';
import { updateProfile } from '@/db/profileRepo';
import { addWeight } from '@/db/weightRepo';
import { getEffectiveWaterGoal, waterGoalFromWeightKg } from '../waterGoal';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('regra 35 ml/kg com arredondamento e piso', () => {
  expect(waterGoalFromWeightKg(93.2)).toBe(3250);
  expect(waterGoalFromWeightKg(80)).toBe(2800);
  expect(waterGoalFromWeightKg(20)).toBe(1000);
});

test('meta efetiva: automática pelo último peso; manual quando desligada; fallback sem peso', async () => {
  const db = makeDb() as never;
  expect(await getEffectiveWaterGoal(db)).toEqual({ goalMl: 2000, auto: true });

  await addWeight(db, 80, new Date());
  expect(await getEffectiveWaterGoal(db)).toEqual({ goalMl: 2800, auto: true });

  await setSetting(db, 'waterGoalAuto', false);
  await updateProfile(db, { waterGoalMl: 2500 });
  expect(await getEffectiveWaterGoal(db)).toEqual({ goalMl: 2500, auto: false });
});
