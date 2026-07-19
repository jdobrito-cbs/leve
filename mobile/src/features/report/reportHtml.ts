import {
  bandZones,
  componentBandKg,
  fatMassZones,
  gaugeMarkerFraction,
  subcutaneousZones,
  visceralZones,
  whrZones,
  zoneOf,
  ZONE,
  type GaugeZone,
  type Sex,
} from '@/features/body/bodyBands';
import { formatHeight, formatVolume, kgToDisplay, weightUnit } from '@/core/units';
import { getActiveLanguage, numberLocale } from '@/i18n/engine';
import { strings } from '@/i18n/pt-BR';
import type { BodyReport, CompositionRow, RangedValue, SeriesPoint } from './bodyReport';

/** Documento A4 do relatório corporal (HTML → PDF via expo-print), fiel ao
 *  padrão dos relatórios de bioimpedância (Fitdays). Textos seguem o idioma
 *  ativo (strings.reportPdf) e pesos/volumes seguem o sistema de medidas. */

const BLUE = '#2563EB';
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const GRID = '#EEF2F7';
const LOW = '#F59E0B';
const OK = '#16A34A';
const HIGH = '#DC2626';

const fmt = (n: number, d = 1) =>
  n.toLocaleString(numberLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });

// ——— Conversões de exibição (o relatório calcula em kg; imperial mostra lb) ———

const r1 = (n: number) => Math.round(kgToDisplay(n) * 10) / 10;

function convRow(row: CompositionRow): CompositionRow {
  return { ...row, value: row.value === null ? null : r1(row.value), min: r1(row.min), max: r1(row.max) };
}

function convRanged(r: RangedValue | null): RangedValue | null {
  return r === null ? null : { value: r1(r.value), min: r1(r.min), max: r1(r.max) };
}

function convZones(zones: GaugeZone[]): GaugeZone[] {
  return zones.map((z) => ({ ...z, to: z.to === null ? null : r1(z.to) }));
}

function convSeries(points: SeriesPoint[]): SeriesPoint[] {
  return points.map((p) => ({ ...p, value: r1(p.value) }));
}


/** Medidor compacto no estilo da balança: zonas de largura IGUAL e marcador
 *  na posição proporcional dentro da zona (mesma geometria do app). */
function miniGauge(value: number, zones: GaugeZone[]): string {
  if (zones.filter((z) => z.to !== null).length === 0) return '';
  const segs = zones.map((z) => `<i style="flex:1;background:${z.color}"></i>`).join('');
  const pos = gaugeMarkerFraction(value, zones) * 100;
  const zone = zoneOf(value, zones);
  return `<div class="mini"><div class="minibar">${segs}</div><b style="left:${pos.toFixed(1)}%;border-color:${zone.color}"></b></div>`;
}

function compRow(
  label: string,
  color: string,
  row: CompositionRow,
  zones: GaugeZone[] | null,
  unit = 'kg',
): string {
  // Selo com a semântica REAL da métrica (água alta = excelente, não erro).
  const st = row.value !== null && zones ? zoneOf(row.value, zones) : null;
  const value =
    row.value === null
      ? `<span class="cmiss">—</span>`
      : `${fmt(row.value)}<small> ${unit}</small>`;
  const badge = st ? `<span class="cstat" style="color:${st.color}">${st.label}</span>` : '';
  const gauge = row.value !== null && zones ? miniGauge(row.value, zones) : '';
  return `<div class="crow"><div style="flex:1">
    <div class="crowline">
      <span class="dot" style="background:${color}"></span>
      <span class="clabel">${label}</span>
      ${badge}
      <span class="cval">${value}<br/><em>(${fmt(row.min)}–${fmt(row.max)})</em></span>
    </div>
    ${gauge}
  </div></div>`;
}

/** Posição do fim da barra nas zonas Baixo/Padrão/Alto — mesma geometria dos
 *  medidores (proporcional dentro da zona; excesso assintótico, sem colar). */
function barPos(r: RangedValue): number {
  const zones: GaugeZone[] = [
    { to: r.min, label: '', color: '' },
    { to: r.max, label: '', color: '' },
    { to: null, label: '', color: '' },
  ];
  const pos = gaugeMarkerFraction(r.value, zones) * 100;
  // Piso = largura mínima do chip com o número dentro; teto evita colar na borda.
  return Math.max(14, Math.min(97, pos));
}

function barHead(extraLabel: string): string {
  const R = strings.reportPdf;
  return `<tr class="bhead"><td></td>
    <td><div class="zones"><span>${R.zoneLow}</span><span>${R.zoneStandard}</span><span>${R.zoneHigh}</span></div></td>
    <td class="bextra">${extraLabel}</td></tr>`;
}

/** Cores da barra de valor (baixo | padrão | alto), por semântica da métrica.
 *  A cor é aplicada na própria barra conforme a zona do valor; o fundo fica cinza. */
const BAR_FAT_LIKE: [string, string, string] = [ZONE.thin, ZONE.ok, ZONE.bad];
const BAR_MUSCLE_LIKE: [string, string, string] = [ZONE.bad, ZONE.ok, ZONE.thin];

function bar(
  label: string,
  r: RangedValue | null,
  unit: string,
  extra: string,
  colors: [string, string, string] = BAR_FAT_LIKE,
): string {
  if (!r) return '';
  const color = r.value < r.min ? colors[0] : r.value <= r.max ? colors[1] : colors[2];
  return `<tr>
    <td class="blabel">${label}</td>
    <td class="btrack"><div class="btrackbg">
      <div class="bfill" style="background:${color};width:${barPos(r)}%"><b>${fmt(r.value)}${unit}</b></div>
      <i class="bdiv" style="left:33.3%"></i><i class="bdiv" style="left:66.6%"></i></div></td>
    <td class="bextra">${extra}</td>
  </tr>`;
}

function donut(report: BodyReport): string {
  // Proporções em kg (adimensionais); o número central sai na unidade de exibição.
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
    <text x="70" y="66" text-anchor="middle" font-size="24" font-weight="700" fill="${INK}">${fmt(kgToDisplay(w))}</text>
    <text x="70" y="86" text-anchor="middle" font-size="11" fill="${MUTED}">${strings.reportPdf.weight}</text>
  </svg>`;
}

/** Gráfico de história no padrão Fitdays: grade, máx/mín à direita, datas embaixo. */
function chart(title: string, unit: string, points: SeriesPoint[]): string {
  if (points.length < 2) return '';
  const W = 330;
  const H = 78;
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
  const R = strings.reportPdf;
  const wU = weightUnit();
  const c = r.composition;
  const sexLabel = r.sex === 'feminino' ? R.sexFemale : R.sexMale;
  const dt = r.generatedAt;
  const when = `${dt.toLocaleDateString(numberLocale())} ${dt.toLocaleTimeString(numberLocale(), { hour: '2-digit', minute: '2-digit' })}`;
  const ind = r.indicators;
  const v = r.vitals;
  const sexKey: Sex = r.sex;
  // Medidores dos indicadores: mesmas faixas do box "Dados corporais" do app.
  const gaugeRow = (label: string, valueStr: string, gauge: string) =>
    `<tr><td>${label}${gauge}</td><td class="ival">${valueStr}</td></tr>`;
  const visceralGauge =
    ind.visceralFat !== null
      ? gaugeRow(R.visceral, fmt(ind.visceralFat, 0), miniGauge(ind.visceralFat, visceralZones()))
      : indicatorRow(R.visceral, '—');
  const subcutGauge =
    ind.subcutaneousPct !== null
      ? gaugeRow(R.subcutaneous, `${fmt(ind.subcutaneousPct)}%`, miniGauge(ind.subcutaneousPct, subcutaneousZones(sexKey)))
      : indicatorRow(R.subcutaneous, '—');
  const bmrGauge = gaugeRow(
    R.bmr,
    `${fmt(ind.bmrKcal, 0)} kcal`,
    miniGauge(ind.bmrKcal, [
      { to: ind.bmrKcal, label: R.zoneLow, color: ZONE.low },
      { to: null, label: R.zoneStandard, color: ZONE.ok },
    ]),
  );
  const whrGauge =
    ind.whr !== null
      ? gaugeRow(R.whr, fmt(ind.whr, 2), miniGauge(ind.whr, whrZones(sexKey)))
      : indicatorRow(R.whr, '—');
  // Linhas de saúde/hidratação divididas em duas colunas para caber no A4.
  const vitalRows = [
    indicatorRow(R.restingHr, v.restingHr !== null ? `${fmt(v.restingHr, 0)} bpm` : null),
    indicatorRow(R.avgHr, v.avgHr !== null ? `${fmt(v.avgHr, 0)} bpm` : null),
    indicatorRow(R.spo2, v.spo2 !== null ? `${fmt(v.spo2, 0)}%` : null),
    indicatorRow(R.respRate, v.respiratoryRate !== null ? `${fmt(v.respiratoryRate, 0)} rpm` : null),
    indicatorRow(R.sleep, v.sleepHours !== null ? `${fmt(v.sleepHours)} h` : null),
    indicatorRow(R.sleepQuality, v.sleepEfficiencyPct !== null ? `${fmt(v.sleepEfficiencyPct, 0)}%` : null),
    indicatorRow(R.breathing, v.breathingDisturbances !== null ? `${fmt(v.breathingDisturbances)}/h` : null),
    indicatorRow(R.waterToday, formatVolume(v.waterTodayMl)),
    indicatorRow(R.waterAvg, v.waterAvg7dMl !== null ? formatVolume(v.waterAvg7dMl) : null),
  ].filter((row) => row !== '');
  const vitalsA = vitalRows.slice(0, Math.ceil(vitalRows.length / 2));
  const vitalsB = vitalRows.slice(Math.ceil(vitalRows.length / 2));

  return `<!DOCTYPE html><html lang="${getActiveLanguage()}"><head><meta charset="utf-8"/>
  <style>
    /* Sem isto o WebKit apaga fundos coloridos ao imprimir — as barras somem. */
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, Roboto, 'Segoe UI', sans-serif;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact; }
    @page { size: A4 portrait; margin: 0; }
    /* zoom leve garante o relatório inteiro numa única página A4 */
    body { color: ${INK}; padding: 20px 28px; font-size: 12px; zoom: 0.87; }
    .h1row { display: flex; align-items: center; gap: 9px; margin-bottom: 4px; }
    h1 { font-size: 21px; } h1 b { color: ${BLUE}; }
    .meta { color: ${MUTED}; display: flex; gap: 16px; padding: 8px 0 12px; border-bottom: 2px solid ${INK}; }
    h2 { font-size: 14px; margin: 16px 0 8px; }
    .grid { display: flex; gap: 22px; }
    .col { flex: 1; min-width: 0; }
    .comp { display: flex; gap: 14px; align-items: center; }
    .crow { display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid ${LINE}; }
    .crowline { display: flex; align-items: center; gap: 8px; }
    .mini { position: relative; margin: 3px 0 1px 17px; height: 9px; }
    .minibar { display: flex; height: 5px; border-radius: 3px; overflow: hidden; }
    .mini b { position: absolute; top: -2px; width: 9px; height: 9px; border-radius: 5px;
      background: #fff; border: 2px solid ${INK}; transform: translateX(-50%); }
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
    .btrackbg { position: relative; background: ${GRID}; border-radius: 5px; overflow: hidden; }
    .bdiv { position: absolute; top: 2px; bottom: 2px; border-left: 1px dashed ${MUTED}; }
    .bfill { position: relative; z-index: 1; border-radius: 5px; color: #fff;
      font-size: 10px; text-align: right; padding: 3px 6px; white-space: nowrap; }
    .bextra { width: 82px; text-align: right; color: ${INK}; font-weight: 600; font-size: 11px; }
    tr.bhead .bextra { color: ${MUTED}; font-weight: 400; font-size: 10px; }
    .chart { margin-bottom: 8px; }
    .ctitle { font-weight: 700; margin-bottom: 3px; } .ctitle small { color: ${MUTED}; font-weight: 400; }
    .cfoot { display: flex; justify-content: space-between; color: ${MUTED}; font-size: 10px; }
    table.ind { width: 100%; border-collapse: collapse; }
    table.ind td { padding: 5px 8px; border: 1px solid ${LINE}; }
    .ival { text-align: right; font-weight: 700; }
    .scorebox { display: flex; gap: 18px; align-items: center; margin-top: 6px; }
    .score { font-size: 44px; font-weight: 800; color: ${BLUE}; } .score small { font-size: 12px; color: ${MUTED}; }
    .sug { flex: 1; color: ${INK}; line-height: 1.5; }
    .footer { margin-top: 14px; color: ${MUTED}; font-size: 10px; }
  </style></head><body>
  <div class="h1row">
    <svg width="30" height="30" viewBox="0 0 30 30">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#60A5FA"/>
      </linearGradient></defs>
      <rect width="30" height="30" rx="7" fill="url(#lg)"/>
      <g transform="translate(4.2 4.2) scale(0.9)" fill="none" stroke="#FFFFFF" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/>
        <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/>
        <path d="M5 21h14"/>
      </g>
    </svg>
    <h1><b>Leve</b> · ${R.title}</h1>
  </div>
  <div class="meta">
    <span>${R.name}: <b>${r.name}</b></span><span>${R.sex}: ${sexLabel}</span>
    <span>${R.age}: ${r.age ?? '—'}</span><span>${R.height}: ${formatHeight(r.heightCm)}</span>
    <span>${R.generatedAt}: ${when}</span>
  </div>

  <div class="grid">
    <div class="col">
      <h2>${R.compTitle.replace('{unit}', wU)}</h2>
      <div class="comp">
        ${donut(r)}
        <div style="flex:1">
          ${compRow(R.water, '#60A5FA', convRow(c.waterKg), convZones(bandZones(componentBandKg(sexKey, r.heightCm, 'water'), 'excellent')), wU)}
          ${compRow(R.protein, '#4ADE80', convRow(c.proteinKg), convZones(bandZones(componentBandKg(sexKey, r.heightCm, 'protein'), 'excellent')), wU)}
          ${compRow(R.fatMass, '#FACC15', convRow(c.fatKg), convZones(fatMassZones(sexKey, r.heightCm)), wU)}
          ${compRow(R.bone, '#2DD4BF', convRow(c.boneKg), convZones(bandZones(componentBandKg(sexKey, r.heightCm, 'bone'), 'excellent')), wU)}
          ${compRow(R.muscle, '#A78BFA', convRow(c.muscleKg), convZones(bandZones(componentBandKg(sexKey, r.heightCm, 'muscle'), 'excellent')), wU)}
          ${compRow(R.skeletal, '#A3E635', convRow(c.skeletalKg), convZones(bandZones(componentBandKg(sexKey, r.heightCm, 'skeletal'), 'excellent')), wU)}
        </div>
      </div>
    </div>
    <div class="col">
      <h2>${R.generalTitle}</h2>
      <table class="bars">
        ${barHead(R.adjustHint)}
        ${bar(R.weight, convRanged(r.weightRange), wU, fmt(kgToDisplay(r.weightAdjustKg)), BAR_FAT_LIKE)}
        ${bar(R.muscle, convRanged(c.muscleKg.value !== null ? { value: c.muscleKg.value, min: c.muscleKg.min, max: c.muscleKg.max } : null), wU, fmt(kgToDisplay(r.muscleAdjustKg ?? 0)), BAR_MUSCLE_LIKE)}
        ${bar(R.fatMass, convRanged(c.fatKg.value !== null ? { value: c.fatKg.value, min: c.fatKg.min, max: c.fatKg.max } : null), wU, fmt(kgToDisplay(r.fatAdjustKg ?? 0)), BAR_FAT_LIKE)}
      </table>
      <table class="bars" style="margin-top:10px">
        ${barHead(R.standardRange)}
        ${bar(R.bmi, r.bmi, '', `${fmt(r.bmi.min)}–${fmt(r.bmi.max, 0)}`, BAR_FAT_LIKE)}
        ${bar(R.fatRate, r.fatPct, '%', r.fatPct ? `${fmt(r.fatPct.min, 0)}–${fmt(r.fatPct.max, 0)}%` : '', BAR_FAT_LIKE)}
      </table>
    </div>
  </div>

  <div class="grid" style="margin-top:4px">
    <div class="col">
      <h2>${R.historyTitle}</h2>
      ${chart(R.weight, wU, convSeries(r.history.weight))}
      ${chart(R.muscle, wU, convSeries(r.history.muscle))}
      ${chart(R.fatRate, '%', r.history.fatPct)}
    </div>
    <div class="col">
      <h2>${R.othersTitle}</h2>
      <table class="ind">
        ${visceralGauge}
        ${bmrGauge}
        ${indicatorRow(R.ffm, ind.fatFreeMassKg !== null ? `${fmt(kgToDisplay(ind.fatFreeMassKg))} ${wU}` : null)}
        ${subcutGauge}
        ${indicatorRow(R.smi, ind.smi !== null ? `${fmt(ind.smi)} kg/m²` : null)}
        ${whrGauge}
        ${indicatorRow(R.idealWeight, `${fmt(kgToDisplay(r.idealWeightKg))} ${wU}`)}
        ${indicatorRow(R.obesityLevel, r.obesityLevel)}
        ${indicatorRow(R.bodyType, r.bodyType)}
      </table>
    </div>
  </div>

  <h2>${R.healthTitle}</h2>
  <div class="grid">
    <div class="col"><table class="ind">${vitalsA.join('')}</table></div>
    <div class="col">${vitalsB.length > 0 ? `<table class="ind">${vitalsB.join('')}</table>` : ''}</div>
  </div>

  <h2>${R.scoreTitle}</h2>
  <div class="scorebox">
    <div class="score">${r.score}<small> ${R.points}</small></div>
    <div class="sug">${r.suggestions.join(' ')}</div>
  </div>
  <div class="footer">${R.footer}${r.compositionEstimated ? ` ${R.footerEstimated}` : ''}</div>
  </body></html>`;
}
