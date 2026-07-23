import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { deleteWorkout, listWorkouts, paceSecPerKm, upsertWorkout } from '../workoutRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db as never;
}

const RUN = {
  source: 'healthkit' as const,
  externalId: 'A',
  type: 'run' as const,
  startAt: '2026-07-22T08:00:00.000Z',
  endAt: '2026-07-22T08:30:00.000Z',
  durationSec: 1800,
  distanceM: 5000,
  calories: 300,
  avgHr: null,
  route: [{ lat: 1, lng: 2 }],
};

test('upsert deduplica pelo idExterno e atualiza; guarda/lê a rota', async () => {
  const db = makeDb();
  await upsertWorkout(db, RUN);
  await upsertWorkout(db, { ...RUN, distanceM: 5200, calories: 310, route: null });
  await upsertWorkout(db, {
    source: 'gps',
    externalId: null,
    type: 'walk',
    startAt: '2026-07-21T18:00:00.000Z',
    endAt: null,
    durationSec: 600,
    distanceM: 800,
    calories: 50,
    avgHr: null,
    route: null,
  });
  const list = await listWorkouts(db);
  expect(list.length).toBe(2); // healthkit/A atualizado (não duplicado) + gps
  expect(list[0].externalId).toBe('A'); // ordem por início desc
  expect(list[0].distanceM).toBe(5200); // valor atualizado
  expect(list[0].route).toBeNull(); // rota atualizada para null
});

test('dois GPS sem idExterno são distintos; delete remove', async () => {
  const db = makeDb();
  const base = {
    source: 'gps' as const,
    externalId: null,
    type: 'run' as const,
    startAt: '2026-07-22T07:00:00.000Z',
    endAt: null,
    durationSec: 1200,
    distanceM: 3000,
    calories: 200,
    avgHr: null,
    route: null,
  };
  await upsertWorkout(db, base);
  await upsertWorkout(db, { ...base, startAt: '2026-07-22T09:00:00.000Z' });
  let list = await listWorkouts(db);
  expect(list.length).toBe(2);
  await deleteWorkout(db, list[0].id);
  list = await listWorkouts(db);
  expect(list.length).toBe(1);
});

test('paceSecPerKm', () => {
  expect(paceSecPerKm(5000, 1500)).toBeCloseTo(300); // 5 km em 25 min = 300 s/km
  expect(paceSecPerKm(0, 1500)).toBeNull();
  expect(paceSecPerKm(5000, null)).toBeNull();
});
