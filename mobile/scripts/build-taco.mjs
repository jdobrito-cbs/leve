import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/raulfdm/taco-api/main/references/csv/';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const [header, ...data] = rows;
  return data
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const fetchCsv = async (name) => parseCsv(await (await fetch(BASE + name)).text());
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const [foods, nutrients, categories] = await Promise.all([
  fetchCsv('food.csv'),
  fetchCsv('nutrients.csv'),
  fetchCsv('categories.csv'),
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
    fiberG: num(n.dietaryFiber),
  };
});

if (out.length < 500) throw new Error(`TACO incompleta: ${out.length} itens`);
mkdirSync(new URL('../src/db/seed/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/db/seed/taco.json', import.meta.url), JSON.stringify(out));
console.log(`taco.json gerado com ${out.length} alimentos`);
