import type { BodyReport, CompositionRow, RangedValue, SeriesPoint } from './bodyReport';

/** Documento A4 do relatório corporal (HTML → PDF via expo-print), fiel ao
 *  padrão dos relatórios de bioimpedância (Fitdays). */

const BLUE = '#2563EB';
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const GRID = '#EEF2F7';
const LOW = '#F59E0B';
const OK = '#16A34A';
const HIGH = '#DC2626';

const fmt = (n: number, d = 1) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Avaliação por cor: baixo (laranja), padrão (verde), alto (vermelho). */
function statusOf(row: CompositionRow): { label: string; color: string } | null {
  if (row.value === null) return null;
  if (row.value < row.min) return { label: 'Baixo', color: LOW };
  if (row.value > row.max) return { label: 'Alto', color: HIGH };
  return { label: 'Padrão', color: OK };
}

function compRow(label: string, color: string, row: CompositionRow, unit = 'kg'): string {
  const st = statusOf(row);
  const value =
    row.value === null
      ? `<span class="cmiss">—</span>`
      : `${fmt(row.value)}<small> ${unit}</small>`;
  const badge = st ? `<span class="cstat" style="color:${st.color}">${st.label}</span>` : '';
  return `<div class="crow">
    <span class="dot" style="background:${color}"></span>
    <span class="clabel">${label}</span>
    ${badge}
    <span class="cval">${value}<br/><em>(${fmt(row.min)}–${fmt(row.max)})</em></span>
  </div>`;
}

/** Posição do fim da barra nas zonas Baixo (0–33%), Padrão (33–66%), Alto (66–100%). */
function barPos(r: RangedValue): number {
  const { value, min, max } = r;
  let pos: number;
  if (value <= min) pos = (value / min) * 33;
  else if (value <= max) pos = 33 + ((value - min) / (max - min)) * 33;
  else pos = 66 + Math.min(1, (value - max) / Math.max(0.001, max - min)) * 32;
  return Math.max(16, Math.min(98, pos));
}

function barHead(extraLabel: string): string {
  return `<tr class="bhead"><td></td>
    <td><div class="zones"><span>Baixo</span><span>Padrão</span><span>Alto</span></div></td>
    <td class="bextra">${extraLabel}</td></tr>`;
}

function bar(label: string, r: RangedValue | null, unit: string, extra: string): string {
  if (!r) return '';
  return `<tr>
    <td class="blabel">${label}</td>
    <td class="btrack"><div class="btrackbg">
      <div class="bfill" style="width:${barPos(r)}%"><b>${fmt(r.value)}${unit}</b></div>
      <i style="left:33.3%"></i><i style="left:66.6%"></i></div></td>
    <td class="bextra">${extra}</td>
  </tr>`;
}

function donut(report: BodyReport): string {
  const w = report.weightKg;
  const c = report.composition;
  let parts = [
    { color: '#60A5FA', kg: c.waterKg.value ?? 0 },
    { color: '#4ADE80', kg: c.proteinKg.value ?? 0 },
    { color: '#FACC15', kg: c.fatKg.value ?? 0 },
    { color: '#2DD4BF', kg: c.boneKg.value ?? 0 },
  ].filter((p) => p.kg > 0);
  // Sem os componentes da balança: mostra gordura + massa magra (músculo).
  if (parts.length <= 1 && c.fatKg.value !== null && c.muscleKg.value !== null) {
    parts = [
      { color: '#FACC15', kg: c.fatKg.value },
      { color: '#A78BFA', kg: c.muscleKg.value },
    ];
  }
  const r = 54;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const segs = parts
    .map((p) => {
      const len = Math.min((p.kg / w) * C, C - offset);
      const s = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${p.color}" stroke-width="16"
        stroke-dasharray="${len.toFixed(1)} ${(C - len).toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" transform="rotate(-90 70 70)"/>`;
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

/** Gráfico de história no padrão Fitdays: grade, máx/mín à direita, datas embaixo. */
function chart(title: string, unit: string, points: SeriesPoint[]): string {
  if (points.length < 2) return '';
  const W = 330;
  const H = 86;
  const R = 40; // faixa direita para os rótulos de máx/mín
  const T = 6;
  const B = 6;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.5, (max - min) * 0.25);
  const yMax = max + pad;
  const yMin = min - pad;
  const plotW = W - R;
  const y = (v: number) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  const x = (i: number) => 4 + (i / (points.length - 1)) * (plotW - 8);
  const grid: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const gy = T + (i / 4) * (H - T - B);
    grid.push(`<line x1="0" y1="${gy.toFixed(1)}" x2="${plotW}" y2="${gy.toFixed(1)}" stroke="${GRID}"/>`);
  }
  for (let i = 1; i <= 6; i++) {
    const gx = (i / 7) * plotW;
    grid.push(`<line x1="${gx.toFixed(1)}" y1="${T}" x2="${gx.toFixed(1)}" y2="${H - B}" stroke="${GRID}"/>`);
  }
  const poly = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return `<div class="chart">
    <div class="ctitle">${title}<small>(${unit})</small></div>
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect x="0" y="${T}" width="${plotW}" height="${H - T - B}" fill="none" stroke="${LINE}"/>
      ${grid.join('')}
      <polyline points="${poly}" fill="none" stroke="${BLUE}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${x(points.length - 1).toFixed(1)}" cy="${y(last.value).toFixed(1)}" r="3.5" fill="${BLUE}"/>
      <text x="${plotW + 6}" y="${T + 8}" font-size="10" fill="${MUTED}">${fmt(yMax)}</text>
      <text x="${plotW + 6}" y="${H - B - 1}" font-size="10" fill="${MUTED}">${fmt(yMin)}</text>
    </svg>
    <div class="cfoot" style="width:${plotW}px"><span>${points[0].dayLabel}</span><span>${last.dayLabel}</span></div>
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
    body { color: ${INK}; padding: 26px 30px; font-size: 12px; }
    h1 { font-size: 21px; margin-bottom: 4px; } h1 b { color: ${BLUE}; }
    .meta { color: ${MUTED}; display: flex; gap: 16px; padding: 8px 0 12px; border-bottom: 2px solid ${INK}; }
    h2 { font-size: 14px; margin: 16px 0 8px; }
    .grid { display: flex; gap: 22px; }
    .col { flex: 1; min-width: 0; }
    .comp { display: flex; gap: 14px; align-items: center; }
    .crow { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid ${LINE}; }
    .dot { width: 9px; height: 9px; border-radius: 5px; display: inline-block; flex-shrink: 0; }
    .clabel { flex: 1; }
    .cstat { font-weight: 700; font-size: 11px; }
    .cval { text-align: right; font-weight: 700; min-width: 74px; }
    .cval em { font-weight: 400; font-style: normal; color: ${MUTED}; font-size: 10px; }
    .cmiss { color: ${MUTED}; font-weight: 400; }
    table.bars { width: 100%; border-collapse: collapse; }
    table.bars td { padding: 5px 4px; border-bottom: 1px solid ${LINE}; vertical-align: middle; }
    tr.bhead td { border-bottom: 1px solid ${MUTED}; padding-bottom: 3px; }
    .zones { display: flex; color: ${MUTED}; font-size: 10px; }
    .zones span { flex: 1; text-align: center; }
    .blabel { width: 86px; color: ${INK}; }
    .btrack { width: auto; }
    .btrackbg { position: relative; background: ${GRID}; border-radius: 5px; }
    .btrackbg > i { position: absolute; top: 2px; bottom: 2px; border-left: 1px dashed ${MUTED}; }
    .bfill { position: relative; z-index: 1; background: ${BLUE}; border-radius: 5px; color: #fff;
      font-size: 10px; text-align: right; padding: 3px 6px; white-space: nowrap; }
    .bextra { width: 82px; text-align: right; color: ${INK}; font-weight: 600; font-size: 11px; }
    tr.bhead .bextra { color: ${MUTED}; font-weight: 400; font-size: 10px; }
    .chart { margin-bottom: 8px; }
    .ctitle { font-weight: 700; margin-bottom: 3px; } .ctitle small { color: ${MUTED}; font-weight: 400; }
    .cfoot { display: flex; justify-content: space-between; color: ${MUTED}; font-size: 10px; }
    table.ind { width: 100%; border-collapse: collapse; }
    table.ind td { padding: 7px 8px; border: 1px solid ${LINE}; }
    .ival { text-align: right; font-weight: 700; }
    .scorebox { display: flex; gap: 18px; align-items: center; margin-top: 6px; }
    .score { font-size: 44px; font-weight: 800; color: ${BLUE}; } .score small { font-size: 12px; color: ${MUTED}; }
    .sug { flex: 1; color: ${INK}; line-height: 1.5; }
    .footer { margin-top: 14px; color: ${MUTED}; font-size: 10px; }
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
          ${compRow('Água corporal', '#60A5FA', c.waterKg)}
          ${compRow('Massa proteica', '#4ADE80', c.proteinKg)}
          ${compRow('Massa gorda', '#FACC15', c.fatKg)}
          ${compRow('Massa óssea', '#2DD4BF', c.boneKg)}
          ${compRow('Massa muscular', '#A78BFA', c.muscleKg)}
          ${compRow('Músculo esquelético', '#A3E635', c.skeletalKg)}
        </div>
      </div>
    </div>
    <div class="col">
      <h2>Análise geral</h2>
      <table class="bars">
        ${barHead('Ajustar sugestão')}
        ${bar('Peso', r.weightRange, 'kg', fmt(r.weightAdjustKg))}
        ${bar('Massa muscular', c.muscleKg.value !== null ? { value: c.muscleKg.value, min: c.muscleKg.min, max: c.muscleKg.max } : null, 'kg', fmt(r.muscleAdjustKg ?? 0))}
        ${bar('Massa gorda', c.fatKg.value !== null ? { value: c.fatKg.value, min: c.fatKg.min, max: c.fatKg.max } : null, 'kg', fmt(r.fatAdjustKg ?? 0))}
      </table>
      <table class="bars" style="margin-top:10px">
        ${barHead('Intervalo padrão')}
        ${bar('IMC', r.bmi, '', `${fmt(r.bmi.min)}–${fmt(r.bmi.max, 0)}`)}
        ${bar('Taxa de gordura corporal', r.fatPct, '%', r.fatPct ? `${fmt(r.fatPct.min, 0)}–${fmt(r.fatPct.max, 0)}%` : '')}
      </table>
    </div>
  </div>

  <div class="grid" style="margin-top:4px">
    <div class="col">
      <h2>História</h2>
      ${chart('Peso', 'kg', r.history.weight)}
      ${chart('Massa muscular', 'kg', r.history.muscle)}
      ${chart('Taxa de gordura corporal', '%', r.history.fatPct)}
    </div>
    <div class="col">
      <h2>Outros indicadores</h2>
      <table class="ind">
        ${indicatorRow('Grau de gordura visceral', ind.visceralFat !== null ? fmt(ind.visceralFat, 0) : null)}
        ${indicatorRow('Taxa metabólica basal', `${fmt(ind.bmrKcal, 0)} kcal`)}
        ${indicatorRow('Peso corporal livre de gordura', ind.fatFreeMassKg !== null ? `${fmt(ind.fatFreeMassKg)} kg` : null)}
        ${indicatorRow('Gordura subcutânea', ind.subcutaneousPct !== null ? `${fmt(ind.subcutaneousPct)}%` : null)}
        ${indicatorRow('SMI', ind.smi !== null ? `${fmt(ind.smi)} kg/m²` : null)}
        ${indicatorRow('Idade do corpo', ind.bodyAge !== null ? fmt(ind.bodyAge, 0) : null)}
      </table>
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
