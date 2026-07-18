import type { BodyReport, RangedValue, SeriesPoint } from './bodyReport';

/** Documento A4 do relatório corporal (HTML → PDF via expo-print). */

const BLUE = '#2563EB';
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';

const fmt = (n: number, d = 1) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

function rangeRow(label: string, color: string, r: RangedValue | null, unit = 'kg'): string {
  if (!r) return '';
  return `<div class="crow">
    <span class="dot" style="background:${color}"></span>
    <span class="clabel">${label}</span>
    <span class="cval">${fmt(r.value)}<small> ${unit}</small><br/><em>(${fmt(r.min)}–${fmt(r.max)})</em></span>
  </div>`;
}

/** Barra Baixo/Padrão/Alto com preenchimento proporcional e valor no fim. */
function bar(label: string, r: RangedValue, unit: string, extra: string): string {
  const { value, min, max } = r;
  let pos: number;
  if (value <= min) pos = (value / min) * 33;
  else if (value <= max) pos = 33 + ((value - min) / (max - min)) * 33;
  else pos = 66 + Math.min(1, (value - max) / (max * 0.3)) * 34;
  pos = Math.max(6, Math.min(100, pos));
  return `<tr>
    <td class="blabel">${label}</td>
    <td class="btrack"><div class="bfill" style="width:${pos}%"><span>${fmt(value)}${unit}</span></div>
      <i style="left:33%"></i><i style="left:66%"></i></td>
    <td class="bextra">${extra}</td>
  </tr>`;
}

function donut(report: BodyReport): string {
  const w = report.weightKg;
  const parts = [
    { color: '#60A5FA', kg: report.composition.waterKg?.value ?? 0 },
    { color: '#4ADE80', kg: report.composition.proteinKg?.value ?? 0 },
    { color: '#FACC15', kg: report.composition.fatKg?.value ?? 0 },
    { color: '#2DD4BF', kg: report.composition.boneKg?.value ?? 0 },
  ].filter((p) => p.kg > 0);
  const r = 54;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const segs = parts
    .map((p) => {
      const len = (p.kg / w) * C;
      const s = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${p.color}" stroke-width="16"
        stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 70 70)"/>`;
      offset += len;
      return s;
    })
    .join('');
  return `<svg width="140" height="140" viewBox="0 0 140 140">
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="${LINE}" stroke-width="16"/>${segs}
    <text x="70" y="66" text-anchor="middle" font-size="24" font-weight="700" fill="${INK}">${fmt(w)}</text>
    <text x="70" y="86" text-anchor="middle" font-size="11" fill="${MUTED}">Peso</text>
  </svg>`;
}

function chart(title: string, unit: string, points: SeriesPoint[]): string {
  if (points.length < 2) return '';
  const W = 470;
  const H = 80;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.5, (max - min) * 0.2);
  const y = (v: number) => H - 8 - ((v - (min - pad)) / (max - min + 2 * pad)) * (H - 16);
  const x = (i: number) => 8 + (i / (points.length - 1)) * (W - 16);
  const poly = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const lastP = points[points.length - 1];
  return `<div class="chart">
    <div class="ctitle">${title}<small>(${unit})</small></div>
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${LINE}"/>
      <polyline points="${poly}" fill="none" stroke="${BLUE}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${x(points.length - 1).toFixed(1)}" cy="${y(lastP.value).toFixed(1)}" r="3.5" fill="${BLUE}"/>
    </svg>
    <div class="cfoot"><span>${points[0].dayLabel}</span><span>${lastP.dayLabel}</span></div>
  </div>`;
}

function indicatorRow(label: string, value: string | null): string {
  return value === null ? '' : `<tr><td>${label}</td><td class="ival">${value}</td></tr>`;
}

export function reportHtml(r: BodyReport): string {
  const c = r.composition;
  const sexLabel = r.sex === 'feminino' ? 'Feminino' : 'Masculino';
  const dt = r.generatedAt;
  const when = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  const ind = r.indicators;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, Roboto, 'Segoe UI', sans-serif; }
    body { color: ${INK}; padding: 28px 32px; font-size: 12px; }
    h1 { font-size: 22px; margin-bottom: 4px; } h1 b { color: ${BLUE}; }
    .meta { color: ${MUTED}; display: flex; gap: 18px; padding: 8px 0 14px; border-bottom: 2px solid ${INK}; }
    h2 { font-size: 14px; margin: 18px 0 10px; }
    .grid { display: flex; gap: 24px; }
    .col { flex: 1; min-width: 0; }
    .comp { display: flex; gap: 16px; align-items: center; }
    .crow { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid ${LINE}; }
    .dot { width: 9px; height: 9px; border-radius: 5px; display: inline-block; }
    .clabel { flex: 1; }
    .cval { text-align: right; font-weight: 700; } .cval em { font-weight: 400; font-style: normal; color: ${MUTED}; font-size: 10px; }
    table.bars { width: 100%; border-collapse: collapse; }
    table.bars td { padding: 6px 4px; border-bottom: 1px solid ${LINE}; }
    .blabel { width: 90px; color: ${MUTED}; }
    .btrack { position: relative; }
    .btrack > i { position: absolute; top: 4px; bottom: 4px; border-left: 1px dashed ${MUTED}; }
    .bfill { background: ${BLUE}; border-radius: 4px; color: #fff; font-size: 10px; text-align: right;
      padding: 3px 6px; white-space: nowrap; min-width: 34px; }
    .bextra { width: 84px; text-align: right; color: ${MUTED}; }
    .chart { margin-bottom: 10px; }
    .ctitle { font-weight: 700; margin-bottom: 4px; } .ctitle small { color: ${MUTED}; font-weight: 400; }
    .cfoot { display: flex; justify-content: space-between; color: ${MUTED}; font-size: 10px; }
    table.ind { width: 100%; border-collapse: collapse; }
    table.ind td { padding: 7px 8px; border: 1px solid ${LINE}; }
    .ival { text-align: right; font-weight: 700; }
    .scorebox { display: flex; gap: 18px; align-items: center; margin-top: 8px; }
    .score { font-size: 46px; font-weight: 800; color: ${BLUE}; } .score small { font-size: 12px; color: ${MUTED}; }
    .sug { flex: 1; color: ${INK}; line-height: 1.5; }
    .footer { margin-top: 16px; color: ${MUTED}; font-size: 10px; }
  </style></head><body>
  <h1><b>Leve</b> · Relatório de análise de composição corporal</h1>
  <div class="meta">
    <span>Nome: <b>${r.name}</b></span><span>Sexo: ${sexLabel}</span>
    <span>Idade: ${r.age ?? '—'}</span><span>Altura: ${Math.round(r.heightCm)} cm</span>
    <span>Gerado em: ${when}</span>
  </div>

  <div class="grid">
    <div class="col">
      <h2>Análise da composição corporal (kg)</h2>
      <div class="comp">
        ${donut(r)}
        <div style="flex:1">
          ${rangeRow('Água corporal', '#60A5FA', c.waterKg)}
          ${rangeRow('Massa proteica', '#4ADE80', c.proteinKg)}
          ${rangeRow('Massa gorda', '#FACC15', c.fatKg)}
          ${rangeRow('Massa óssea', '#2DD4BF', c.boneKg)}
          ${rangeRow('Massa muscular', '#A78BFA', c.muscleKg)}
          ${rangeRow('Músculo esquelético', '#A3E635', c.skeletalKg)}
        </div>
      </div>
    </div>
    <div class="col">
      <h2>Análise geral</h2>
      <table class="bars">
        ${bar('Peso', r.weightRange, 'kg', `${fmt(r.weightAdjustKg)}`)}
        ${c.muscleKg ? bar('Massa muscular', c.muscleKg, 'kg', `${fmt(r.muscleAdjustKg ?? 0)}`) : ''}
        ${c.fatKg ? bar('Massa gorda', c.fatKg, 'kg', `${fmt(r.fatAdjustKg ?? 0)}`) : ''}
        ${bar('IMC', r.bmi, '', `${fmt(r.bmi.min)}–${fmt(r.bmi.max, 0)}`)}
        ${r.fatPct ? bar('Gordura corporal', r.fatPct, '%', `${fmt(r.fatPct.min, 0)}–${fmt(r.fatPct.max, 0)}%`) : ''}
      </table>
      <h2>Outros indicadores</h2>
      <table class="ind">
        ${indicatorRow('Grau de gordura visceral', ind.visceralFat !== null ? fmt(ind.visceralFat, 0) : null)}
        ${indicatorRow('Taxa metabólica basal', `${fmt(ind.bmrKcal, 0)} kcal`)}
        ${indicatorRow('Peso livre de gordura', ind.fatFreeMassKg !== null ? `${fmt(ind.fatFreeMassKg)} kg` : null)}
        ${indicatorRow('Gordura subcutânea', ind.subcutaneousPct !== null ? `${fmt(ind.subcutaneousPct)}%` : null)}
        ${indicatorRow('SMI', ind.smi !== null ? `${fmt(ind.smi)} kg/m²` : null)}
        ${indicatorRow('Idade do corpo', ind.bodyAge !== null ? fmt(ind.bodyAge, 0) : null)}
      </table>
    </div>
  </div>

  <h2>História</h2>
  <div class="grid">
    <div class="col">${chart('Peso', 'kg', r.history.weight)}</div>
    <div class="col">
      ${chart('Massa muscular', 'kg', r.history.muscle)}
      ${chart('Gordura corporal', '%', r.history.fatPct)}
    </div>
  </div>

  <h2>Pontuação e sugestão</h2>
  <div class="scorebox">
    <div class="score">${r.score}<small> pontos</small></div>
    <div class="sug">${r.suggestions.join(' ')}</div>
  </div>
  <div class="footer">Gerado pelo Leve a partir dos seus registros. Faixas de referência padrão de bioimpedância.</div>
  </body></html>`;
}
