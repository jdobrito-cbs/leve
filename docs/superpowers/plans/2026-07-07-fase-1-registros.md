# FASE 1 — Núcleo de registro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registros funcionais (água, peso, dose com rodízio, sintoma, refeição com TACO offline), dashboard Hoje vivo, gráficos de progresso e lembretes locais de dose/água — 100% offline.

**Architecture:** Migration 0001 amplia o schema (metas no perfil, busca normalizada + categoria em food_items, tabela settings). Seed TACO (597 alimentos, JSON committado gerado por script) roda uma vez na inicialização. Um repositório por domínio segue o padrão do `profileRepo` (funções recebendo `AppDb`, testes com better-sqlite3 em memória). Telas de registro são rotas modais em `app/log/*`; Hoje e Progresso leem via hooks com `useFocusEffect`. Lembretes usam expo-notifications com identificadores fixos.

**Tech Stack:** Já instalado: Expo SDK 57, TS, Expo Router, drizzle/expo-sqlite, Lucide, Manrope, LinearGradient, react-native-svg. Novo: expo-notifications, react-native-gifted-charts.

## Global Constraints

- Todo texto de UI em `mobile/src/i18n/pt-BR.ts` — nenhuma string hardcoded em tela.
- Nada de conselho clínico: rodízio = "sugestão (apoio de memória)"; metas calóricas definidas pelo usuário sem cálculo/sugestão do app; lembretes com texto neutro.
- Timestamps ISO UTC (`new Date().toISOString()`); consultas de dia via `dayRangeUtc`.
- Alias TS: `@/*` → `mobile/src/*`. Comandos rodam em `mobile/` salvo indicação.
- Testing Library v14: `await render(...)`, `await fireEvent...`.
- jest.mock com variáveis: prefixo `mock`.
- Commit + push (`git push`) ao fim de cada task, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Repos com melhor-sqlite3 nos testes usam `makeDb()` idêntico ao de `profileRepo.test.ts` e cast `as never`.

---

### Task 1: Migration 0001 + helpers de data/normalização + settingsRepo + updateProfile

**Files:**
- Modify: `mobile/src/db/schema.ts`, `mobile/src/core/types.ts`, `mobile/src/db/profileRepo.ts`
- Create: `mobile/src/core/datetime.ts`, `mobile/src/core/text.ts`, `mobile/src/db/settingsRepo.ts`
- Generated: `mobile/src/db/migrations/0001_*.sql` (+ migrations.js atualizado)
- Test: `mobile/src/core/__tests__/helpers.test.ts`, `mobile/src/db/__tests__/settingsRepo.test.ts` (+ ampliar `profileRepo.test.ts`)

**Interfaces:**
- Produces: `dayRangeUtc(date: Date): {startIso, endIso}`; `lastNDays(n: number, today: Date): Date[]` (mais antigo → hoje); `localDayKey(date: Date): string` ('YYYY-MM-DD'); `normalizeText(s: string): string`; `parseDecimalBR(s: string): number | null`; `getSetting<T>(db, key): Promise<T|null>`, `setSetting(db, key, value: unknown)`; `updateProfile(db, patch: Partial<Omit<Profile,'id'>>)`; colunas novas: `profile.waterGoalMl` (default 2000), `profile.calorieGoalKcal` (nullable), `foodItems.nameNormalized`, `foodItems.category`, tabela `settings`.

- [ ] **Step 1: Testes que falham** — `helpers.test.ts`:

```ts
import { dayRangeUtc, lastNDays, localDayKey } from '../datetime';
import { normalizeText, parseDecimalBR } from '../text';

test('dayRangeUtc cobre o dia local inteiro', () => {
  const d = new Date(2026, 6, 7, 15, 30);
  const { startIso, endIso } = dayRangeUtc(d);
  expect(new Date(startIso).getTime()).toBeLessThanOrEqual(d.getTime());
  expect(new Date(endIso).getTime()).toBeGreaterThan(d.getTime());
  expect(new Date(endIso).getTime() - new Date(startIso).getTime()).toBe(24 * 3600 * 1000);
});

test('lastNDays retorna N dias terminando hoje', () => {
  const today = new Date(2026, 6, 7);
  const days = lastNDays(3, today);
  expect(days).toHaveLength(3);
  expect(localDayKey(days[2])).toBe('2026-07-07');
  expect(localDayKey(days[0])).toBe('2026-07-05');
});

test('normalizeText remove acentos e caixa', () => {
  expect(normalizeText('Feijão CARIOCA cozido')).toBe('feijao carioca cozido');
});

test('parseDecimalBR aceita vírgula e rejeita inválido', () => {
  expect(parseDecimalBR('92,5')).toBe(92.5);
  expect(parseDecimalBR('92.5')).toBe(92.5);
  expect(parseDecimalBR('abc')).toBeNull();
  expect(parseDecimalBR('')).toBeNull();
  expect(parseDecimalBR('0')).toBe(0);
});
```

`settingsRepo.test.ts` (makeDb igual ao de profileRepo.test.ts):

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { getSetting, setSetting } from '../settingsRepo';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('get inexistente → null; set/get round-trip; overwrite', async () => {
  const db = makeDb() as never;
  expect(await getSetting(db, 'reminders')).toBeNull();
  await setSetting(db, 'reminders', { doseEnabled: true });
  expect(await getSetting(db, 'reminders')).toEqual({ doseEnabled: true });
  await setSetting(db, 'reminders', { doseEnabled: false });
  expect(await getSetting(db, 'reminders')).toEqual({ doseEnabled: false });
});
```

Adicionar em `profileRepo.test.ts`:

```ts
import { acceptDisclaimer, getProfile, updateProfile } from '../profileRepo';

test('updateProfile cria perfil se não existe e atualiza campos', async () => {
  const db = makeDb() as never;
  await updateProfile(db, { name: 'Jorge', waterGoalMl: 2500 });
  let p = await getProfile(db);
  expect(p?.name).toBe('Jorge');
  expect(p?.waterGoalMl).toBe(2500);
  await updateProfile(db, { heightCm: 178 });
  p = await getProfile(db);
  expect(p?.heightCm).toBe(178);
  expect(p?.name).toBe('Jorge');
});
```

- [ ] **Step 2: Rodar** `npm test -- helpers` e `npm test -- settingsRepo` — Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar.** `core/datetime.ts`:

```ts
export function dayRangeUtc(date: Date): { startIso: string; endIso: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function lastNDays(n: number, today: Date): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

`core/text.ts`:

```ts
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function parseDecimalBR(s: string): number | null {
  const t = s.replace(',', '.').trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
```

`schema.ts` — alterar `profile` e `foodItems`, adicionar `settings`:

```ts
export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  heightCm: real('height_cm'),
  goalWeightKg: real('goal_weight_kg'),
  medication: text('medication'),
  disclaimerAcceptedAt: text('disclaimer_accepted_at'),
  waterGoalMl: real('water_goal_ml').notNull().default(2000),
  calorieGoalKcal: real('calorie_goal_kcal'),
});
// foodItems: adicionar
  nameNormalized: text('name_normalized'),
  category: text('category'),
// nova tabela
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
```

`core/types.ts`: Profile ganha `waterGoalMl: number; calorieGoalKcal: number | null;` FoodItem ganha `category: string | null;` (nameNormalized é detalhe interno do banco, não entra no tipo de domínio).

`db/settingsRepo.ts`:

```ts
import { eq } from 'drizzle-orm';
import type { AppDb } from './client';
import { settings } from './schema';

export async function getSetting<T>(db: AppDb, key: string): Promise<T | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0] ? (JSON.parse(rows[0].value) as T) : null;
}

export async function setSetting(db: AppDb, key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: serialized })
    .onConflictDoUpdate({ target: settings.key, set: { value: serialized } });
}
```

`profileRepo.ts` — adicionar:

```ts
export async function updateProfile(
  db: AppDb,
  patch: Partial<Omit<Profile, 'id'>>,
): Promise<void> {
  const existing = await getProfile(db);
  if (existing) {
    await db.update(profile).set(patch).where(eq(profile.id, existing.id));
  } else {
    await db.insert(profile).values(patch);
  }
}
```

- [ ] **Step 4: Gerar migration** — `npx drizzle-kit generate` → cria `0001_*.sql`; conferir que `migrations.js` importa m0000 e m0001.

- [ ] **Step 5: Rodar** `npm test` + `npx tsc --noEmit` — Expected: tudo PASS.

- [ ] **Step 6: Commit + push.**

---

### Task 2: TACO — script de build, seed e busca

**Files:**
- Create: `mobile/scripts/build-taco.mjs`, `mobile/src/db/seed/taco.json` (gerado, committado), `mobile/src/db/seed/tacoSeed.ts`, `mobile/src/db/foodItemsRepo.ts`
- Modify: `mobile/src/app/_layout.tsx` (seed após migrations), `mobile/tsconfig.json` (garantir `resolveJsonModule`)
- Test: `mobile/src/db/__tests__/foodItems.test.ts`

**Interfaces:**
- Produces: `seedFoodItemsIfEmpty(db): Promise<void>`; `searchFoods(db, query: string): Promise<FoodItem[]>` (máx 25, vazio se query < 2 chars); `taco.json`: array de `{ name, category, kcal, proteinG, carbsG, fatG }` por 100 g.

- [ ] **Step 1: `build-taco.mjs`** (parser CSV com aspas; campos vazios → null):

```js
// Gera src/db/seed/taco.json a partir dos CSVs públicos do repo raulfdm/taco-api (dados TACO/NEPA-Unicamp).
import { writeFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/raulfdm/taco-api/main/references/csv/';

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const [header, ...data] = rows;
  return data
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const fetchCsv = async (name) => parseCsv(await (await fetch(BASE + name)).text());
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

const [foods, nutrients, categories] = await Promise.all([
  fetchCsv('food.csv'), fetchCsv('nutrients.csv'), fetchCsv('categories.csv'),
]);
const nutrientsById = new Map(nutrients.map((n) => [n.foodId, n]));
const categoryById = new Map(categories.map((c) => [c.id, c.name]));

const out = foods.map((f) => {
  const n = nutrientsById.get(f.id) ?? {};
  return {
    name: f.name,
    category: categoryById.get(f.categoryId) ?? null,
    kcal: num(n.kcal),
    proteinG: num(n.protein),
    carbsG: num(n.carbohydrates),
    fatG: num(n.lipids),
  };
});

if (out.length < 500) throw new Error(`TACO incompleta: ${out.length} itens`);
writeFileSync(new URL('../src/db/seed/taco.json', import.meta.url), JSON.stringify(out));
console.log(`taco.json gerado com ${out.length} alimentos`);
```

- [ ] **Step 2: Rodar** `node scripts/build-taco.mjs` — Expected: "taco.json gerado com 597 alimentos".

- [ ] **Step 3: Teste que falha** (`foodItems.test.ts`):

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema';
import { searchFoods } from '../foodItemsRepo';
import { seedFoodItemsIfEmpty } from '../seed/tacoSeed';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/db/migrations' });
  return db;
}

test('seed popula uma vez e busca ignora acentos', async () => {
  const db = makeDb() as never;
  await seedFoodItemsIfEmpty(db);
  await seedFoodItemsIfEmpty(db); // idempotente
  const results = await searchFoods(db, 'feijao');
  expect(results.length).toBeGreaterThan(0);
  expect(results.length).toBeLessThanOrEqual(25);
  expect(results[0].calories).not.toBeNull();
  expect(await searchFoods(db, 'f')).toEqual([]); // query curta
});
```

- [ ] **Step 4: Implementar.** `seed/tacoSeed.ts`:

```ts
import { normalizeText } from '@/core/text';
import type { AppDb } from '../client';
import { foodItems } from '../schema';
import taco from './taco.json';

interface TacoFood {
  name: string; category: string | null;
  kcal: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null;
}

export async function seedFoodItemsIfEmpty(db: AppDb): Promise<void> {
  const existing = await db.select({ id: foodItems.id }).from(foodItems).limit(1);
  if (existing.length > 0) return;
  const rows = (taco as TacoFood[]).map((f) => ({
    name: f.name,
    nameNormalized: normalizeText(f.name),
    category: f.category,
    referencePortion: '100 g',
    calories: f.kcal,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    source: 'taco',
  }));
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(foodItems).values(rows.slice(i, i + 100));
  }
}
```

`foodItemsRepo.ts`:

```ts
import { asc, like } from 'drizzle-orm';
import type { FoodItem } from '@/core/types';
import { normalizeText } from '@/core/text';
import type { AppDb } from './client';
import { foodItems } from './schema';

export async function searchFoods(db: AppDb, query: string): Promise<FoodItem[]> {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const rows = await db
    .select()
    .from(foodItems)
    .where(like(foodItems.nameNormalized, `%${q}%`))
    .orderBy(asc(foodItems.name))
    .limit(25);
  return rows.map(({ nameNormalized: _ignored, ...item }) => item as FoodItem);
}
```

`_layout.tsx`: após `success` das migrations, rodar seed em `useEffect` com estado `seeded`; renderizar `<View />` até `seeded`; falha de seed → `console.warn` e `seeded=true` (não bloqueia o app). tsconfig: adicionar `"resolveJsonModule": true` se o typecheck reclamar do import de taco.json.

- [ ] **Step 5: Rodar** `npm test -- foodItems` + `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 6: Commit + push.**

---

### Task 3: Repos de água e peso

**Files:**
- Create: `mobile/src/db/waterRepo.ts`, `mobile/src/db/weightRepo.ts`
- Test: `mobile/src/db/__tests__/waterWeight.test.ts`

**Interfaces:**
- Produces: `addWater(db, amountMl: number, at: Date)`; `waterTotalForDay(db, day: Date): Promise<number>`; `waterDailyTotals(db, days: number, today: Date): Promise<{ dayKey: string; totalMl: number }[]>`; `addWeight(db, weightKg: number, at: Date)`; `latestWeight(db): Promise<WeightLog | null>`; `weightsSince(db, since: Date): Promise<WeightLog[]>` (asc).

- [ ] **Step 1: Teste que falha** (mesmo `makeDb`):

```ts
import { addWater, waterDailyTotals, waterTotalForDay } from '../waterRepo';
import { addWeight, latestWeight, weightsSince } from '../weightRepo';

test('água: total do dia e série diária', async () => {
  const db = makeDb() as never;
  const today = new Date(2026, 6, 7, 10, 0);
  const yesterday = new Date(2026, 6, 6, 10, 0);
  await addWater(db, 200, today);
  await addWater(db, 300, today);
  await addWater(db, 500, yesterday);
  expect(await waterTotalForDay(db, today)).toBe(500);
  const series = await waterDailyTotals(db, 2, today);
  expect(series).toEqual([
    { dayKey: '2026-07-06', totalMl: 500 },
    { dayKey: '2026-07-07', totalMl: 500 },
  ]);
});

test('peso: latest e série', async () => {
  const db = makeDb() as never;
  await addWeight(db, 95.5, new Date(2026, 5, 1));
  await addWeight(db, 93.2, new Date(2026, 6, 1));
  expect((await latestWeight(db))?.weightKg).toBe(93.2);
  const series = await weightsSince(db, new Date(2026, 4, 1));
  expect(series.map((w) => w.weightKg)).toEqual([95.5, 93.2]);
});
```

- [ ] **Step 2: FAIL.** — [ ] **Step 3: Implementar.** `waterRepo.ts`:

```ts
import { and, gte, lt, sum } from 'drizzle-orm';
import { dayRangeUtc, lastNDays, localDayKey } from '@/core/datetime';
import type { AppDb } from './client';
import { waterLogs } from './schema';

export async function addWater(db: AppDb, amountMl: number, at: Date): Promise<void> {
  await db.insert(waterLogs).values({ amountMl, loggedAt: at.toISOString() });
}

export async function waterTotalForDay(db: AppDb, day: Date): Promise<number> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ total: sum(waterLogs.amountMl) })
    .from(waterLogs)
    .where(and(gte(waterLogs.loggedAt, startIso), lt(waterLogs.loggedAt, endIso)));
  return Number(rows[0]?.total ?? 0);
}

export async function waterDailyTotals(
  db: AppDb,
  days: number,
  today: Date,
): Promise<{ dayKey: string; totalMl: number }[]> {
  const result = [];
  for (const day of lastNDays(days, today)) {
    result.push({ dayKey: localDayKey(day), totalMl: await waterTotalForDay(db, day) });
  }
  return result;
}
```

`weightRepo.ts`:

```ts
import { asc, desc, gte } from 'drizzle-orm';
import type { WeightLog } from '@/core/types';
import type { AppDb } from './client';
import { weightLogs } from './schema';

export async function addWeight(db: AppDb, weightKg: number, at: Date): Promise<void> {
  await db.insert(weightLogs).values({ weightKg, origin: 'manual', loggedAt: at.toISOString() });
}

export async function latestWeight(db: AppDb): Promise<WeightLog | null> {
  const rows = await db.select().from(weightLogs).orderBy(desc(weightLogs.loggedAt)).limit(1);
  return (rows[0] as WeightLog | undefined) ?? null;
}

export async function weightsSince(db: AppDb, since: Date): Promise<WeightLog[]> {
  return (await db
    .select()
    .from(weightLogs)
    .where(gte(weightLogs.loggedAt, since.toISOString()))
    .orderBy(asc(weightLogs.loggedAt))) as WeightLog[];
}
```

- [ ] **Step 4: PASS + typecheck.** — [ ] **Step 5: Commit + push.**

---

### Task 4: Repos de dose (com rodízio), sintoma e refeição

**Files:**
- Create: `mobile/src/db/doseRepo.ts`, `mobile/src/db/symptomRepo.ts`, `mobile/src/db/foodLogRepo.ts`, `mobile/src/features/dose/rotation.ts`
- Test: `mobile/src/db/__tests__/doseSymptomFood.test.ts`, `mobile/src/features/dose/__tests__/rotation.test.ts`

**Interfaces:**
- Produces: `INJECTION_SITES: readonly InjectionSite[]` (`'abdomen_e'|'abdomen_d'|'coxa_e'|'coxa_d'|'braco_e'|'braco_d'`); `suggestNextSite(last: InjectionSite | null): InjectionSite`; `addDose(db, input: { medication: string; doseMg: number; route: DoseRoute; injectionSite?: InjectionSite | null; at: Date; nextDoseAt?: Date | null })`; `latestDose(db): Promise<DoseLog | null>`; `listDoses(db, limit?): Promise<DoseLog[]>` (desc); `lastInjectionSite(db): Promise<InjectionSite | null>`; `addSymptom(db, kind: string, intensity: number, at: Date)`; `symptomsForDay(db, day): Promise<SymptomLog[]>`; `addFoodLog(db, input: { name; portionGrams?: number|null; calories?: number|null; proteinG?; carbsG?; fatG?; at: Date })`; `foodForDay(db, day): Promise<FoodLog[]>`; `kcalForDay(db, day): Promise<number>`; `kcalDailyTotals(db, days, today): Promise<{ dayKey; kcal }[]>`.

- [ ] **Step 1: `rotation.test.ts`:**

```ts
import { INJECTION_SITES, suggestNextSite } from '../rotation';

test('rodízio cicla os 6 locais e começa no primeiro', () => {
  expect(suggestNextSite(null)).toBe('abdomen_e');
  expect(suggestNextSite('abdomen_e')).toBe('abdomen_d');
  expect(suggestNextSite('braco_d')).toBe('abdomen_e');
  expect(INJECTION_SITES).toHaveLength(6);
});
```

`doseSymptomFood.test.ts` (mesmo makeDb):

```ts
test('dose: latest, lista desc e último local de injeção', async () => {
  const db = makeDb() as never;
  await addDose(db, { medication: 'semaglutida', doseMg: 0.5, route: 'injecao', injectionSite: 'abdomen_e', at: new Date(2026, 6, 1) });
  await addDose(db, { medication: 'semaglutida', doseMg: 0.5, route: 'pilula', at: new Date(2026, 6, 5) });
  expect((await latestDose(db))?.route).toBe('pilula');
  expect(await lastInjectionSite(db)).toBe('abdomen_e');
  expect((await listDoses(db)).map((d) => d.route)).toEqual(['pilula', 'injecao']);
});

test('sintomas do dia', async () => {
  const db = makeDb() as never;
  await addSymptom(db, 'nausea', 3, new Date(2026, 6, 7, 9));
  await addSymptom(db, 'fadiga', 2, new Date(2026, 6, 6, 9));
  expect((await symptomsForDay(db, new Date(2026, 6, 7))).map((s) => s.kind)).toEqual(['nausea']);
});

test('refeições: kcal do dia e série', async () => {
  const db = makeDb() as never;
  await addFoodLog(db, { name: 'Arroz', portionGrams: 150, calories: 190, at: new Date(2026, 6, 7, 12) });
  await addFoodLog(db, { name: 'Café', calories: 60, at: new Date(2026, 6, 7, 8) });
  await addFoodLog(db, { name: 'Ontem', calories: 500, at: new Date(2026, 6, 6, 12) });
  expect(await kcalForDay(db, new Date(2026, 6, 7))).toBe(250);
  expect((await foodForDay(db, new Date(2026, 6, 7))).map((f) => f.name)).toEqual(['Café', 'Arroz']);
  const series = await kcalDailyTotals(db, 2, new Date(2026, 6, 7));
  expect(series.map((s) => s.kcal)).toEqual([500, 250]);
});
```

- [ ] **Step 2: FAIL.** — [ ] **Step 3: Implementar.** `rotation.ts`:

```ts
export const INJECTION_SITES = [
  'abdomen_e', 'abdomen_d', 'coxa_e', 'coxa_d', 'braco_e', 'braco_d',
] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

/** Sugestão de rodízio — apoio de memória; a escolha final é do usuário/médico. */
export function suggestNextSite(last: InjectionSite | null): InjectionSite {
  if (!last) return INJECTION_SITES[0];
  const i = INJECTION_SITES.indexOf(last);
  return INJECTION_SITES[(i + 1) % INJECTION_SITES.length];
}
```

`doseRepo.ts`:

```ts
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DoseLog, DoseRoute } from '@/core/types';
import type { InjectionSite } from '@/features/dose/rotation';
import type { AppDb } from './client';
import { doseLogs } from './schema';

export interface AddDoseInput {
  medication: string;
  doseMg: number;
  route: DoseRoute;
  injectionSite?: InjectionSite | null;
  at: Date;
  nextDoseAt?: Date | null;
}

export async function addDose(db: AppDb, input: AddDoseInput): Promise<void> {
  await db.insert(doseLogs).values({
    medication: input.medication,
    doseMg: input.doseMg,
    route: input.route,
    injectionSite: input.injectionSite ?? null,
    loggedAt: input.at.toISOString(),
    nextDoseAt: input.nextDoseAt ? input.nextDoseAt.toISOString() : null,
  });
}

export async function latestDose(db: AppDb): Promise<DoseLog | null> {
  const rows = await db.select().from(doseLogs).orderBy(desc(doseLogs.loggedAt)).limit(1);
  return (rows[0] as DoseLog | undefined) ?? null;
}

export async function listDoses(db: AppDb, limit = 50): Promise<DoseLog[]> {
  return (await db.select().from(doseLogs).orderBy(desc(doseLogs.loggedAt)).limit(limit)) as DoseLog[];
}

export async function lastInjectionSite(db: AppDb): Promise<InjectionSite | null> {
  const rows = await db
    .select({ site: doseLogs.injectionSite })
    .from(doseLogs)
    .where(and(eq(doseLogs.route, 'injecao'), isNotNull(doseLogs.injectionSite)))
    .orderBy(desc(doseLogs.loggedAt))
    .limit(1);
  return (rows[0]?.site as InjectionSite | undefined) ?? null;
}
```

`symptomRepo.ts`:

```ts
import { and, asc, gte, lt } from 'drizzle-orm';
import { dayRangeUtc } from '@/core/datetime';
import type { SymptomLog } from '@/core/types';
import type { AppDb } from './client';
import { symptomLogs } from './schema';

export async function addSymptom(db: AppDb, kind: string, intensity: number, at: Date): Promise<void> {
  await db.insert(symptomLogs).values({ kind, intensity, loggedAt: at.toISOString() });
}

export async function symptomsForDay(db: AppDb, day: Date): Promise<SymptomLog[]> {
  const { startIso, endIso } = dayRangeUtc(day);
  return (await db
    .select()
    .from(symptomLogs)
    .where(and(gte(symptomLogs.loggedAt, startIso), lt(symptomLogs.loggedAt, endIso)))
    .orderBy(asc(symptomLogs.loggedAt))) as SymptomLog[];
}
```

`foodLogRepo.ts`:

```ts
import { and, asc, gte, lt, sum } from 'drizzle-orm';
import { dayRangeUtc, lastNDays, localDayKey } from '@/core/datetime';
import type { FoodLog } from '@/core/types';
import type { AppDb } from './client';
import { foodLogs } from './schema';

export interface AddFoodLogInput {
  name: string;
  portionGrams?: number | null;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  at: Date;
}

export async function addFoodLog(db: AppDb, input: AddFoodLogInput): Promise<void> {
  await db.insert(foodLogs).values({
    name: input.name,
    portionGrams: input.portionGrams ?? null,
    calories: input.calories ?? null,
    proteinG: input.proteinG ?? null,
    carbsG: input.carbsG ?? null,
    fatG: input.fatG ?? null,
    origin: 'manual',
    photoUri: null,
    loggedAt: input.at.toISOString(),
  });
}

export async function foodForDay(db: AppDb, day: Date): Promise<FoodLog[]> {
  const { startIso, endIso } = dayRangeUtc(day);
  return (await db
    .select()
    .from(foodLogs)
    .where(and(gte(foodLogs.loggedAt, startIso), lt(foodLogs.loggedAt, endIso)))
    .orderBy(asc(foodLogs.loggedAt))) as FoodLog[];
}

export async function kcalForDay(db: AppDb, day: Date): Promise<number> {
  const { startIso, endIso } = dayRangeUtc(day);
  const rows = await db
    .select({ total: sum(foodLogs.calories) })
    .from(foodLogs)
    .where(and(gte(foodLogs.loggedAt, startIso), lt(foodLogs.loggedAt, endIso)));
  return Number(rows[0]?.total ?? 0);
}

export async function kcalDailyTotals(
  db: AppDb,
  days: number,
  today: Date,
): Promise<{ dayKey: string; kcal: number }[]> {
  const result = [];
  for (const day of lastNDays(days, today)) {
    result.push({ dayKey: localDayKey(day), kcal: await kcalForDay(db, day) });
  }
  return result;
}
```

- [ ] **Step 4: PASS + typecheck.** — [ ] **Step 5: Commit + push.**

---

### Task 5: Strings pt-BR da FASE 1

**Files:**
- Modify: `mobile/src/i18n/pt-BR.ts` (o teste existente de "sem promessas" continua valendo)

**Interfaces:**
- Produces (chaves novas, usadas nas Tasks 6–14): `common.save/cancel/close/add/today`; `log.*` mantém; `water.{title,quick200,quick300,quick500,customLabel,addCustom,todayTotal,goalReached}`; `weight.{title,inputLabel,lastLabel,diffLabel,save}`; `dose.{title,medicationLabel,medications:{semaglutida,tirzepatida,liraglutida,outra},customMedicationLabel,doseLabel,routeLabel,routes:{injecao,pilula},siteLabel,siteHint,lastSiteLabel,suggestedLabel,sites:{abdomen_e,...braco_d},nextDoseLabel,nextDose:{in7days,tomorrow,none},save}`; `symptom.{title,kindLabel,kinds:{nausea,vomito,constipacao,diarreia,fadiga,tontura,azia,outro},intensityLabel,save}`; `meal.{title,searchTab,manualTab,searchPlaceholder,noResults,manualFallback,portionLabel,nameLabel,kcalLabel,proteinLabel,carbsLabel,fatLabel,per100g,todayList,todayTotal,add}`; `today.{waterRing,ofGoal,cards:{kcal,nextDose,lastWeight,symptoms},noDose,noWeight,none}`; `progress.{weightSection,range30,range90,waterSection,kcalSection,dosesSection,empty}`; `profile.{editSection,nameLabel,heightLabel,medicationLabel,goalWeightLabel,waterGoalLabel,calorieGoalLabel,calorieGoalHint('Defina com seu médico...'),save,saved,remindersSection,doseReminder,doseReminderHint,waterReminder,waterTimesLabel,permissionDenied}`; `reminders.{doseTitle,doseBody,waterTitle,waterBody}` (texto neutro de apoio à memória).

- [ ] **Step 1:** Adicionar todas as chaves com textos pt-BR neutros (sem promessa/conselho). Exemplos exatos dos textos sensíveis:
  - `dose.siteHint`: "Sugestão de rodízio — apoio de memória. Siga a orientação do seu médico."
  - `profile.calorieGoalHint`: "Opcional. Defina com seu médico ou nutricionista — o Leve não calcula nem recomenda metas."
  - `reminders.doseTitle`: "Lembrete de dose" / `doseBody`: "Você anotou uma dose para hoje. Confirme detalhes com a orientação do seu médico."
  - `reminders.waterTitle`: "Hidratação" / `waterBody`: "Que tal um copo de água? Registre no Leve."
- [ ] **Step 2:** `npm test -- pt-BR` PASS (guarda de linguagem) + typecheck. Commit + push.

---

### Task 6: Componentes novos do design system

**Files:**
- Create: `mobile/src/design/components/SegmentedChips.tsx`, `NumberField.tsx`, `ListRow.tsx`
- Modify: `mobile/src/design/components/index.ts`
- Test: `mobile/src/design/components/__tests__/inputs.test.tsx`

**Interfaces:**
- Produces: `<SegmentedChips options={{value,label,sublabel?}[]} value onChange multiline?>` (chips pill; selecionado = fundo primary); `<NumberField label value onChangeText suffix? placeholder?>` (teclado numérico); `<ListRow title subtitle? right? onPress?>`.

- [ ] **Step 1: Teste que falha:**

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { ListRow, NumberField, SegmentedChips } from '../index';

test('SegmentedChips seleciona opção', async () => {
  const onChange = jest.fn();
  const { getByText } = await render(
    <SegmentedChips
      options={[{ value: 'a', label: 'Opção A' }, { value: 'b', label: 'Opção B' }]}
      value="a"
      onChange={onChange}
    />,
  );
  await fireEvent.press(getByText('Opção B'));
  expect(onChange).toHaveBeenCalledWith('b');
});

test('NumberField repassa texto e mostra sufixo', async () => {
  const onChangeText = jest.fn();
  const { getByPlaceholderText, getByText } = await render(
    <NumberField label="Peso" value="" onChangeText={onChangeText} suffix="kg" placeholder="0,0" />,
  );
  await fireEvent.changeText(getByPlaceholderText('0,0'), '92,5');
  expect(onChangeText).toHaveBeenCalledWith('92,5');
  getByText('kg');
});

test('ListRow renderiza título/subtítulo/right', async () => {
  const { getByText } = await render(<ListRow title="Arroz" subtitle="150 g" right="190 kcal" />);
  getByText('Arroz'); getByText('150 g'); getByText('190 kcal');
});
```

- [ ] **Step 2: FAIL.** — [ ] **Step 3: Implementar** (padrões da F0: useTheme, tokens, AppText; SegmentedChips = flexWrap de Pressables pill com borda primary; selecionado bg primary/texto onPrimary, sublabel caption; NumberField = AppText caption + row com TextInput keyboardType="decimal-pad" + sufixo muted; ListRow = row com título/subtítulo à esquerda, right à direita, Pressable se onPress). Exportar no index.
- [ ] **Step 4: PASS + typecheck.** — [ ] **Step 5: Commit + push.**

---

### Task 7: Rotas modais /log + tela Água

**Files:**
- Create: `mobile/src/app/log/_layout.tsx`, `mobile/src/app/log/agua.tsx`, `mobile/src/features/log/WaterScreen.tsx`
- Modify: `mobile/src/features/screens/LogHubScreen.tsx` (cards navegam; remove "em breve" dos prontos)
- Test: `mobile/src/features/log/__tests__/WaterScreen.test.tsx`

**Interfaces:**
- Consumes: `addWater`, `waterTotalForDay`, `getProfile` (meta), `parseDecimalBR`, componentes.
- Produces: rota `/log/agua`; padrão de tela de registro (header título + conteúdo + salvar) que as Tasks 8–11 repetem; `LogHubScreen` com `router.push` por item.

- [ ] **Step 1: Teste que falha** (mocks padrão F0):

```tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/db/client', () => ({ db: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const mockAddWater = jest.fn();
const mockTotal = jest.fn();
jest.mock('@/db/waterRepo', () => ({
  addWater: (...a: unknown[]) => mockAddWater(...a),
  waterTotalForDay: (...a: unknown[]) => mockTotal(...a),
}));
jest.mock('@/db/profileRepo', () => ({
  getProfile: jest.fn().mockResolvedValue({ waterGoalMl: 2000 }),
}));

import { strings } from '@/i18n/pt-BR';
import { WaterScreen } from '../WaterScreen';

test('botão rápido registra 200 ml', async () => {
  mockTotal.mockResolvedValue(500);
  mockAddWater.mockResolvedValue(undefined);
  const { getByText } = await render(<WaterScreen />);
  await waitFor(() => getByText(strings.water.quick200));
  await fireEvent.press(getByText(strings.water.quick200));
  await waitFor(() => expect(mockAddWater).toHaveBeenCalledWith({}, 200, expect.any(Date)));
});
```

- [ ] **Step 2: FAIL.** — [ ] **Step 3: Implementar.** `log/_layout.tsx`: Stack com `screenOptions={{ presentation: 'modal', headerShown: false }}`. `agua.tsx`: `export { WaterScreen as default } from '@/features/log/WaterScreen'`— (usar wrapper `import`/`export default` como nas abas). `WaterScreen`: total do dia + meta (barra/AppText), 3 botões rápidos (Card row de Buttons 200/300/500 chamando addWater e recarregando total), NumberField para valor livre + Button adicionar (desabilitado se `parseDecimalBR` null/<=0), Button fechar (`router.back()`). LogHub: itens ganham `route` (`/log/agua` etc.) e `enabled`; card vira Pressable navegando; refeição/dose/peso/sintoma habilitam nas próximas tasks (manter "em breve" até a task da tela existir — na PRÁTICA: como as Tasks 7–11 são sequenciais, habilitar cada rota na task correspondente).
- [ ] **Step 4: PASS + typecheck + suíte inteira.** — [ ] **Step 5: Commit + push.**

---

### Task 8: Tela Peso

**Files:** Create `mobile/src/app/log/peso.tsx`, `mobile/src/features/log/WeightScreen.tsx`; Modify LogHub (habilita); Test `mobile/src/features/log/__tests__/WeightScreen.test.tsx`.

**Interfaces:** Consumes `addWeight`, `latestWeight`, `parseDecimalBR`.

- [ ] Teste: mock weightRepo; renderiza; digita '92,5' no NumberField (placeholder de strings.weight.inputLabel); pressiona salvar → `addWeight({}, 92.5, Date)`; mostra último peso (mock latest 93.2 → texto contém '93,2' via `toLocaleString('pt-BR')` — usar `getByText(/93,2/)`).
- [ ] Implementar: NumberField kg; card "último registro" com diferença numérica neutra (ex.: "−0,7 kg desde o último"); salvar desabilitado se inválido; `router.back()` após salvar.
- [ ] PASS + commit + push.

---

### Task 9: Tela Dose (rodízio)

**Files:** Create `mobile/src/app/log/dose.tsx`, `mobile/src/features/log/DoseScreen.tsx`; Modify LogHub; Test `mobile/src/features/log/__tests__/DoseScreen.test.tsx`.

**Interfaces:** Consumes `addDose`, `lastInjectionSite`, `suggestNextSite`, `INJECTION_SITES`, strings.dose.*; produce padrão de nextDose por chips ('in7days' → +7 dias, 'tomorrow' → +1, 'none' → null).

- [ ] Teste: mock doseRepo (`lastInjectionSite` → 'abdomen_e'); renderiza → chip do local sugerido ('abdomen_d') mostra sublabel strings.dose.suggestedLabel; seleciona medicação semaglutida, digita dose '0,5', via injeção default, pressiona salvar → addDose com `{ medication:'semaglutida', doseMg:0.5, route:'injecao', injectionSite:'abdomen_d', nextDoseAt: null }` (chip 'none' default) — verificar com expect.objectContaining.
- [ ] Implementar: SegmentedChips medicação (4 opções; 'outra' abre Input nome); NumberField mg; SegmentedChips via; se injeção → SegmentedChips dos 6 locais com sublabels (último usado = strings.dose.lastSiteLabel; sugerido = strings.dose.suggestedLabel; default selecionado = sugerido); DisclaimerBanner + caption strings.dose.siteHint; SegmentedChips próxima dose (7 dias/amanhã/não definir); salvar valida medicação+dose>0. Se lembretes de dose ativos (settingsRepo 'reminders'.doseEnabled) e nextDoseAt → chamar `scheduleDoseReminder(nextDoseAt)` (import dinâmico do serviço da Task 14; nesta task criar stub `services/reminders/reminders.ts` com `scheduleDoseReminder = async () => {}` para não bloquear — a Task 14 completa).
- [ ] PASS + commit + push.

---

### Task 10: Tela Sintoma

**Files:** Create `mobile/src/app/log/sintoma.tsx`, `mobile/src/features/log/SymptomScreen.tsx`; Modify LogHub; Test `.../SymptomScreen.test.tsx`.

- [ ] Teste: mock symptomRepo; seleciona chip strings.symptom.kinds.nausea + intensidade '3' → salvar → `addSymptom({}, 'nausea', 3, Date)`.
- [ ] Implementar: SegmentedChips kinds (8), SegmentedChips intensidade 1–5, salvar desabilitado sem seleção; lista sintomas de hoje embaixo (symptomsForDay) com ListRow.
- [ ] PASS + commit + push.

---

### Task 11: Tela Refeição (busca TACO + manual)

**Files:** Create `mobile/src/app/log/refeicao.tsx`, `mobile/src/features/log/MealScreen.tsx`; Modify LogHub; Test `.../MealScreen.test.tsx`.

**Interfaces:** Consumes `searchFoods`, `addFoodLog`, `foodForDay`, `kcalForDay`, `parseDecimalBR`.

- [ ] Teste (o mais rico): mock foodItemsRepo.searchFoods → [{name:'Feijão, carioca, cozido', calories:76, proteinG:4.8, carbsG:13.6, fatG:0.5, ...}]; digitar 'feijao' no Input de busca → resultado aparece; press no resultado → NumberField porção default '100'; mudar para '200' → texto de kcal calculada mostra 152; press adicionar → `addFoodLog({}, expect.objectContaining({ name:'Feijão, carioca, cozido', portionGrams:200, calories:152 }))`. Segundo teste: modo manual — press aba manual, nome+kcal → addFoodLog com calories digitadas.
- [ ] Implementar: SegmentedChips [Buscar TACO, Manual]; busca: Input → useEffect chama searchFoods (query ≥2), FlatList? usar map de ListRow (máx 25); seleção mostra card do alimento (macros por 100 g) + porção g + valores proporcionais (`(v*portion)/100`, arredondar 1 casa) + adicionar; sem resultado → EmptyState com strings.meal.noResults + botão que troca para manual. Manual: nome + kcal + macros opcionais. Embaixo: lista de hoje (ListRow: nome / porção / kcal) + total do dia.
- [ ] PASS + commit + push.

---

### Task 12: Hoje vivo

**Files:** Create `mobile/src/features/today/useTodaySummary.ts`; Modify `mobile/src/features/screens/TodayScreen.tsx`; Test `mobile/src/features/today/__tests__/useTodaySummary.test.tsx` + atualizar `screens.test.tsx`.

**Interfaces:**
- Produces: `useTodaySummary(): { loading; waterMl; waterGoalMl; kcal; lastWeightKg: number|null; nextDoseAt: string|null; lastDoseLabel: string|null; symptomsCount; refresh(): Promise<void> }` — usa `useFocusEffect` (de expo-router) para recarregar ao focar.

- [ ] Teste do hook: mocks dos 5 repos + profile; renderHook (envolver useFocusEffect: mock `expo-router` exportando `useFocusEffect: (cb) => { const React = require('react'); React.useEffect(() => { cb(); }, []); }`); afirma agregação (waterMl=500, goal=2000, kcal=250, symptomsCount=1...).
- [ ] TodayScreen: anel = waterMl/waterGoalMl (progress real), centro mostra `waterMl` ml + strings.today.waterRing; abaixo grade 2×2 de Cards com IconChip (GlassWater→/log/agua não precisa, o anel já cobre água): Calorias (Utensils, kcal + '/meta' se calorieGoalKcal), Próxima dose (Syringe, data formatada `toLocaleDateString('pt-BR')` ou strings.today.noDose), Último peso (Weight, kg ou noWeight), Sintomas hoje (ClipboardList, contagem) — cada Card é Pressable → router.push da tela correspondente. `screens.test.tsx`: TodayScreen agora precisa de mocks (db/client, repos via mock do hook: `jest.mock('@/features/today/useTodaySummary')` retornando valores fixos) — atualizar o teste para afirmar que o anel e os 4 cards renderizam (getByText strings.today.cards.kcal etc.).
- [ ] PASS + commit + push.

---

### Task 13: Progresso com gráficos

**Files:** Create `mobile/src/features/progress/useProgressData.ts`; Modify `mobile/src/features/screens/ProgressScreen.tsx`, `mobile/jest.config.js` (transformIgnorePatterns + `react-native-gifted-charts|gifted-charts-core`); Test `mobile/src/features/progress/__tests__/progress.test.tsx`.

**Interfaces:**
- Produces: `useProgressData(): { loading; weights: WeightLog[]; water7: {dayKey,totalMl}[]; kcal7: {dayKey,kcal}[]; doses: DoseLog[]; refresh }`.

- [ ] **Step 1:** `npm i react-native-gifted-charts` (se conflitar com RN 0.86/peer deps → fallback: componentes SVG próprios `SimpleLineChart`/`SimpleBarChart` em `src/design/charts.tsx` com a mesma interface de dados; decidir na hora e registrar no commit).
- [ ] Teste: mock do hook com dados; ProgressScreen com `jest.mock('react-native-gifted-charts', () => ({ LineChart: () => null, BarChart: () => null }))`; afirma seções (strings.progress.weightSection, waterSection, kcalSection, dosesSection) e ListRow de dose ('semaglutida · 0,5 mg'); com dados vazios → strings.progress.empty em cada seção.
- [ ] Implementar: seletor 30/90 dias (SegmentedChips) para peso (LineChart, cor primary, sem área? usar areaChart suave com primarySoft); barras água 7d (BarChart, frontColor primary, referência = meta com linha? manter simples: label da meta no título); barras kcal 7d; doses = ListRows (medicação · mg · via/local · data). Labels dos dias: dayKey → 'seg/ter...' curto (`new Date(dayKey).toLocaleDateString('pt-BR',{weekday:'short'})` — cuidado timezone: construir Date com `new Date(y, m-1, d)` a partir do dayKey).
- [ ] PASS + commit + push.

---

### Task 14: Lembretes + Perfil completo

**Files:**
- Create: `mobile/src/services/reminders/reminders.ts` (substitui stub), `mobile/src/features/profile/useProfileForm.ts`
- Modify: `mobile/src/features/screens/ProfileScreen.tsx`, `mobile/src/app/_layout.tsx` (Notifications handler)
- Test: `mobile/src/services/reminders/__tests__/reminders.test.ts`, atualizar `screens.test.tsx` (Perfil)

**Interfaces:**
- Produces: `ReminderSettings = { doseEnabled: boolean; waterEnabled: boolean; waterTimes: string[] }` (chave 'reminders' via settingsRepo, default `{false,false,['09:00','13:00','17:00']}`); `requestNotificationPermission(): Promise<boolean>`; `scheduleDoseReminder(at: Date)`; `cancelDoseReminder()`; `applyWaterReminders(enabled: boolean, times: string[])` (cancela 'water-*' e agenda DAILY por horário).

- [ ] **Step 1:** `npx expo install expo-notifications`.
- [ ] Teste (mock completo de expo-notifications):

```ts
const mockSchedule = jest.fn();
const mockCancel = jest.fn();
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...a: unknown[]) => mockSchedule(...a),
  cancelScheduledNotificationAsync: (...a: unknown[]) => mockCancel(...a),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));
import { applyWaterReminders, scheduleDoseReminder } from '../reminders';

test('dose futura agenda com identifier fixo; passada não agenda', async () => {
  await scheduleDoseReminder(new Date(Date.now() + 86400000));
  expect(mockCancel).toHaveBeenCalledWith('dose-reminder');
  expect(mockSchedule).toHaveBeenCalledWith(
    expect.objectContaining({ identifier: 'dose-reminder' }),
  );
  mockSchedule.mockClear();
  await scheduleDoseReminder(new Date(Date.now() - 1000));
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('água agenda um DAILY por horário e cancela os antigos', async () => {
  await applyWaterReminders(true, ['09:00', '13:00']);
  expect(mockCancel).toHaveBeenCalledWith('water-0');
  expect(mockSchedule).toHaveBeenCalledTimes(2);
  mockSchedule.mockClear();
  await applyWaterReminders(false, []);
  expect(mockSchedule).not.toHaveBeenCalled();
});
```

- [ ] Implementar `reminders.ts` (usa strings.reminders.*; MAX_WATER=6; cancela water-0..5 sempre; agenda DAILY {hour,minute} parseando 'HH:mm'); handler no _layout: `Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) })`.
- [ ] Perfil: `useProfileForm` (carrega profile+settings ao focar; save → updateProfile + setSetting + aplica lembretes; permissão negada → doseEnabled/waterEnabled false + mensagem strings.profile.permissionDenied). UI: seção editSection (Inputs nome/altura/metas + SegmentedChips medicação), seção lembretes (Switch RN para dose e água + Inputs de horários simples 'HH:mm' validados por regex `/^\d{2}:\d{2}$/`), Button salvar → mostra strings.profile.saved; mantém DisclaimerBanner e Privacidade. Teste do Perfil em screens.test.tsx: mock do useProfileForm; afirma labels e que salvar chama save().
- [ ] PASS + commit + push.

---

### Task 15: Verificação final + prévia + memória

- [ ] `npx tsc --noEmit` limpo; `npm test` todos PASS; `npx expo-doctor`; `npx expo export --platform android` compila; remover `dist/`.
- [ ] Habilitar todos os cards do LogHub (conferir que nenhum ficou "em breve").
- [ ] Atualizar prévia (Artifact, mesma URL): telas Hoje vivo (anel com progresso real ex. 1200/2000 ml), Registrar ativo, Água, Dose com rodízio, Refeição com busca, Progresso com gráficos, Perfil com lembretes — claro + escuro.
- [ ] Atualizar memória `leve-estado-atual.md` (F1 concluída, próximo F2).
- [ ] Commit final + push.

---

## Self-Review (executada)

- **Cobertura da spec:** registros dos 5 tipos ✅ (T7–T11), TACO ✅ (T2), rodízio ✅ (T4/T9), dashboard ✅ (T12), gráficos ✅ (T13), lembretes ✅ (T14), metas/perfil ✅ (T1/T14), erros/casos-limite ✅ (validações nas telas; seed não-bloqueante T2; permissão negada T14; busca vazia T11).
- **Placeholders:** T9 usa stub de reminders substituído na T14 — explícito, não é TODO cego. Telas T8/T10 têm specs compactas mas com payloads e strings exatos.
- **Tipos:** `InjectionSite` definido em rotation.ts e importado pelo doseRepo (evita ciclo: rotation não importa db). `dayKey` padronizado 'YYYY-MM-DD'. Assinaturas de repos idênticas entre Interfaces e testes.
- **Risco:** compat de react-native-gifted-charts com RN 0.86 — fallback SVG próprio declarado na T13.
