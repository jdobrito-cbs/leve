import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';
import {
  deletePeriod,
  endPeriod,
  listPeriods,
  openPeriod,
  predictNextPeriod,
  setFlow,
  startPeriod,
} from '../periodRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('início/fim/fluxo do período e não duplica período aberto', async () => {
  const db = makeDb() as never;
  await startPeriod(db, new Date(2026, 5, 1));
  await startPeriod(db, new Date(2026, 5, 2));
  expect((await listPeriods(db)).length).toBe(1);
  await setFlow(db, 'moderado');
  expect((await openPeriod(db))?.flow).toBe('moderado');
  await endPeriod(db, new Date(2026, 5, 6));
  expect(await openPeriod(db)).toBeNull();
});

test('apaga ciclo registrado por engano (encerrado ou em aberto)', async () => {
  const db = makeDb() as never;
  await startPeriod(db, new Date(2026, 4, 1));
  await endPeriod(db, new Date(2026, 4, 5));
  await startPeriod(db, new Date(2026, 5, 1));
  let list = await listPeriods(db);
  expect(list).toHaveLength(2);

  await deletePeriod(db, list[0].id);
  expect(await openPeriod(db)).toBeNull();

  list = await listPeriods(db);
  await deletePeriod(db, list[0].id);
  expect(await listPeriods(db)).toHaveLength(0);
});

test('previsão usa média dos ciclos e rejeita dados implausíveis', () => {
  const mk = (iso: string) => ({ id: 1, startedAt: iso, endedAt: null, flow: null });
  expect(predictNextPeriod([mk('2026-06-01T00:00:00.000Z')])).toBeNull();
  const p = predictNextPeriod([
    mk('2026-05-04T00:00:00.000Z'),
    mk('2026-06-01T00:00:00.000Z'),
    mk('2026-06-29T00:00:00.000Z'),
  ]);
  expect(p?.avgCycleDays).toBe(28);
  expect(p?.expectedAt.toISOString().slice(0, 10)).toBe('2026-07-27');
  expect(
    predictNextPeriod([mk('2026-01-01T00:00:00.000Z'), mk('2026-06-01T00:00:00.000Z')]),
  ).toBeNull();
});
