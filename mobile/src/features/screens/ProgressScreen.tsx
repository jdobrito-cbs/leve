import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { METRIC_DEFS, MetricType } from '@/core/metrics';
import {
  AppText,
  Card,
  DisclaimerBanner,
  FitChart,
  ListRow,
  RangeGauge,
  Screen,
  SegmentedChips,
} from '@/design/components';
import {
  breathingZones,
  respiratoryZones,
  restingHrZones,
  sleepEfficiencyZones,
  sleepZones,
  spo2Zones,
  waistZones,
  zoneOf,
  type GaugeSpec,
  type GaugeZone,
  type Sex,
} from '@/features/body/bodyBands';
import { buildBodyFacts, buildBodyGauges } from '@/features/body/bodyGauges';
import { buildBodyReport } from '@/features/report/bodyReport';
import { MANUAL_BODY_METRICS } from '@/core/metrics';
import { getProfile } from '@/db/profileRepo';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { type MetricRow } from '@/db/metricsRepo';
import type { InjectionSite } from '@/features/dose/rotation';
import { estimateRelativeCurve } from '@/features/pk/pharmacokinetics';
import { useProgressData } from '@/features/progress/useProgressData';
import { strings } from '@/i18n/pt-BR';
import { cmToDisplay, formatWeight, getUnitSystem, kgToDisplay } from '@/core/units';

type RangeKey = '30' | '90' | '120' | 'all';

const RANGE_OPTIONS = [
  { value: '30' as RangeKey, label: strings.progress.range30 },
  { value: '90' as RangeKey, label: strings.progress.range90 },
  { value: '120' as RangeKey, label: strings.progress.range120 },
  { value: 'all' as RangeKey, label: strings.progress.rangeAll },
];

function weekdayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
}

const fmtMg = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Converte medidor de kg/cm para lb/in quando o sistema é imperial (só exibição). */
function toDisplayGauge<T extends { unit: string; value: number | null; zones: GaugeZone[] }>(
  g: T,
): T {
  if (getUnitSystem() !== 'imperial' || (g.unit !== 'kg' && g.unit !== 'cm')) return g;
  const f = g.unit === 'kg' ? kgToDisplay : cmToDisplay;
  const r1 = (n: number) => Math.round(f(n) * 10) / 10;
  return {
    ...g,
    unit: g.unit === 'kg' ? 'lb' : 'in',
    value: g.value === null ? null : r1(g.value),
    zones: g.zones.map((z) => ({ ...z, to: z.to === null ? null : r1(z.to) })),
  };
}

/** Dados corporais no estilo da balança: valor + medidor de faixas por item. */
function BodyDataSection() {
  const [gauges, setGauges] = useState<GaugeSpec[] | null>(null);
  const [facts, setFacts] = useState<Array<{ label: string; value: string }>>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      buildBodyReport(db)
        .then((report) => {
          if (!alive) return;
          setGauges(report ? buildBodyGauges(report) : []);
          setFacts(report ? buildBodyFacts(report) : []);
        })
        .catch(() => {
          if (alive) setGauges([]);
        });
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!gauges || gauges.length === 0) {
    return (
      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.bodyData.section}</AppText>
        <AppText muted>{strings.progress.empty}</AppText>
      </Card>
    );
  }

  return (
    <Card style={{ gap: spacing.lg }}>
      <AppText variant="title">{strings.bodyData.section}</AppText>
      {gauges.map((g0) => {
        const g = toDisplayGauge(g0);
        const zone = zoneOf(g.value as number, g.zones);
        return (
          <View key={g.key} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
              <AppText style={{ flex: 1 }}>{g.label}</AppText>
              <AppText variant="caption" style={{ color: zone.color, fontFamily: fonts.semibold }}>
                {zone.label}
              </AppText>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 18 }}>
                {(g.value as number).toLocaleString('pt-BR', { maximumFractionDigits: g.digits })}
                {g.unit ? ` ${g.unit}` : ''}
              </AppText>
            </View>
            <RangeGauge value={g.value as number} zones={g.zones} digits={g.digits} />
          </View>
        );
      })}
      {facts.map((f) => (
        <View
          key={f.label}
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}
        >
          <AppText style={{ flex: 1 }}>{f.label}</AppText>
          <AppText style={{ fontFamily: fonts.bold, fontSize: 16 }}>{f.value}</AppText>
        </View>
      ))}
      <DisclaimerBanner />
    </Card>
  );
}

/** Faixas-padrão por métrica de saúde (as corporais já vivem em Dados corporais). */
function vitalZonesFor(type: MetricType, sex: Sex): GaugeZone[] | null {
  switch (type) {
    case 'sleep_hours':
      return sleepZones();
    case 'sleep_efficiency_pct':
      return sleepEfficiencyZones();
    case 'heart_rate_resting':
    case 'heart_rate_avg':
      return restingHrZones();
    case 'spo2':
      return spo2Zones();
    case 'respiratory_rate':
      return respiratoryZones();
    case 'breathing_disturbances':
      return breathingZones();
    case 'waist_cm':
      return waistZones(sex);
    default:
      return null;
  }
}

function BodyHealthSection({ metrics }: { metrics: MetricRow[] }) {
  const [sex, setSex] = useState<Sex>('masculino');

  useEffect(() => {
    getProfile(db)
      .then((p) => setSex(p?.sex === 'feminino' ? 'feminino' : 'masculino'))
      .catch(() => undefined);
  }, []);

  // Corporais ficam no box Dados corporais; aqui, os sinais de saúde.
  const rows = metrics
    .map((m) => ({ metric: m, zones: vitalZonesFor(m.type, sex) }))
    .filter((r) => r.zones !== null || !MANUAL_BODY_METRICS.includes(r.metric.type));

  if (rows.length === 0) {
    return (
      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.bodySection}</AppText>
        <AppText muted>{strings.progress.empty}</AppText>
      </Card>
    );
  }

  return (
    <Card style={{ gap: spacing.lg }}>
      <AppText variant="title">{strings.progress.bodySection}</AppText>
      {rows.map(({ metric, zones: zones0 }) => {
        const digits = metric.type === 'breathing_disturbances' ? 1 : 0;
        // Cintura/quadril em cm viram polegadas no sistema imperial.
        const disp = toDisplayGauge({
          unit: METRIC_DEFS[metric.type].unit,
          value: metric.value,
          zones: zones0 ?? [],
        });
        const zones = zones0 ? disp.zones : null;
        const shownValue = disp.value ?? metric.value;
        const valueLabel = `${shownValue.toLocaleString('pt-BR', {
          maximumFractionDigits: 1,
        })} ${disp.unit}`.trim();
        if (!zones) {
          return (
            <View
              key={metric.type}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}
            >
              <AppText style={{ flex: 1 }}>{strings.metrics[metric.type]}</AppText>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 16 }}>{valueLabel}</AppText>
            </View>
          );
        }
        const zone = zoneOf(shownValue, zones);
        return (
          <View key={metric.type} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
              <AppText style={{ flex: 1 }}>{strings.metrics[metric.type]}</AppText>
              <AppText variant="caption" style={{ color: zone.color, fontFamily: fonts.semibold }}>
                {zone.label}
              </AppText>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 18 }}>{valueLabel}</AppText>
            </View>
            <RangeGauge value={shownValue} zones={zones} digits={digits} />
          </View>
        );
      })}
    </Card>
  );
}

export function ProgressScreen() {
  const { colors } = useTheme();
  const { weights, water7, kcal7, doses, metrics } = useProgressData();
  const [range, setRange] = useState<RangeKey>('30');

  const weightData = useMemo(() => {
    let filtered = weights;
    if (range !== 'all') {
      const since = new Date();
      since.setDate(since.getDate() - Number(range));
      filtered = weights.filter((w) => new Date(w.loggedAt) >= since);
    }
    // Importações de saúde podem trazer milhares de pesos; o gráfico trava.
    if (filtered.length > 120) {
      const step = Math.ceil(filtered.length / 120);
      const last = filtered.length - 1;
      filtered = filtered.filter((_, i) => i % step === 0 || i === last);
    }
    // Gráfico na unidade de exibição (kg ou lb).
    return filtered.map((w) => ({ value: Math.round(kgToDisplay(w.weightKg) * 10) / 10 }));
  }, [weights, range]);

  // Escala na faixa real dos pesos (eixo a partir de 0 achata a linha).
  const weightBounds = useMemo(() => {
    if (weightData.length === 0) return null;
    const values = weightData.map((d) => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const pad = Math.max(2, Math.round((maxV - minV) * 0.3));
    const offset = Math.max(0, Math.floor(minV) - pad);
    return { offset, max: Math.ceil(maxV) + pad - offset };
  }, [weightData]);

  const waterData = water7.map((d) => ({ value: d.totalMl, label: weekdayLabel(d.dayKey) }));
  const kcalData = kcal7.map((d) => ({ value: d.kcal, label: weekdayLabel(d.dayKey) }));
  const hasWater = water7.some((d) => d.totalMl > 0);
  const hasKcal = kcal7.some((d) => d.kcal > 0);

  const pk = useMemo(() => estimateRelativeCurve(doses), [doses]);

  return (
    <Screen>
      <AppText variant="display">{strings.tabs.progress}</AppText>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.pkSection}</AppText>
        {pk ? (
          <>
            <FitChart>{(fitWidth) => (<LineChart width={fitWidth - 64}
              data={pk.points.map((p, i, arr) => ({
                value: Math.round(p.level * 100),
                // Igual ao painel: só o pico da última dose e o fim da projeção têm rótulo.
                hideDataPoint: i !== pk.peakIndex && i !== arr.length - 1,
                dataPointText:
                  i === pk.peakIndex
                    ? `${fmtMg(pk.latestDoseMg)} mg`
                    : i === arr.length - 1
                      ? `≈ ${fmtMg(pk.endMgEstimate)} mg`
                      : undefined,
                textShiftY: -6,
                textShiftX: i === arr.length - 1 ? -30 : -16,
              }))}
              color={colors.primary}
              thickness={3}
              height={110}
              maxValue={118}
              initialSpacing={4}
              endSpacing={48}
              dataPointsColor={colors.primary}
              dataPointsRadius={3.5}
              textColor={colors.text}
              textFontSize={11}
              hideAxesAndRules
              hideYAxisText
              adjustToWidth
curved
disableScroll
/>)}</FitChart>
            <AppText variant="caption" muted>
              {strings.progress.pkLastDose}: {fmtMg(pk.latestDoseMg)} mg ·{' '}
              {strings.progress.pkIn7Days}: ≈ {fmtMg(pk.endMgEstimate)} mg
            </AppText>
            <AppText variant="caption" muted>
              {pk.medKey} · {strings.progress.pkRelative} · {strings.progress.pkProjection}
            </AppText>
          </>
        ) : doses.length > 0 ? (
          <AppText variant="caption" muted>
            {strings.progress.pkUnknownMed}
          </AppText>
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
        <DisclaimerBanner />
        <AppText variant="caption" muted>
          {strings.progress.pkDisclaimer}
        </AppText>
      </Card>

      <BodyDataSection />

      <BodyHealthSection metrics={metrics} />

      <Card style={{ gap: spacing.md }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <AppText variant="title">{strings.progress.weightSection}</AppText>
          {weights.length > 0 ? (
            <AppText style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 36 }}>
              {formatWeight(weights[weights.length - 1].weightKg)}
            </AppText>
          ) : null}
        </View>
        <SegmentedChips options={RANGE_OPTIONS} value={range} onChange={setRange} />
        {weightData.length > 1 && weightBounds ? (
          <FitChart>{(fitWidth) => (<LineChart width={fitWidth - 72}
            data={weightData}
            color={colors.primary}
            thickness={3}
            yAxisOffset={weightBounds.offset}
            maxValue={weightBounds.max}
            initialSpacing={10}
            endSpacing={16}
            hideDataPoints={weightData.length > 20}
            dataPointsColor={colors.primary}
            dataPointsRadius={3.5}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border}
            adjustToWidth
            curved
          />)}</FitChart>
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.waterSection}</AppText>
        {hasWater ? (
          <FitChart>{(fitWidth) => {
            // Largura das barras calculada à mão: adjustToWidth não desconta o eixo y
            // e empurrava a última barra para fora do box.
            const slot = (fitWidth - 64) / waterData.length;
            return (<BarChart width={fitWidth - 64}
            data={waterData}
            frontColor={colors.primary}
            barBorderRadius={6}
            barWidth={Math.max(10, slot * 0.5)}
            spacing={slot * 0.5}
            initialSpacing={slot * 0.25}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border}
/>);
          }}</FitChart>
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.kcalSection}</AppText>
        {hasKcal ? (
          <FitChart>{(fitWidth) => {
            const slot = (fitWidth - 64) / kcalData.length;
            return (<BarChart width={fitWidth - 64}
            data={kcalData}
            frontColor={colors.primary}
            barBorderRadius={6}
            barWidth={Math.max(10, slot * 0.5)}
            spacing={slot * 0.5}
            initialSpacing={slot * 0.25}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border}
/>);
          }}</FitChart>
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
      </Card>

      <Card>
        <AppText variant="title">{strings.progress.dosesSection}</AppText>
        {doses.length > 0 ? (
          doses.map((d) => (
            <ListRow
              key={d.id}
              title={`${d.medication} · ${d.doseMg.toLocaleString('pt-BR')} mg`}
              subtitle={
                d.route === 'injecao' && d.injectionSite
                  ? `${strings.dose.routes.injecao} · ${strings.dose.sites[d.injectionSite as InjectionSite] ?? d.injectionSite}`
                  : strings.dose.routes[d.route as 'injecao' | 'pilula']
              }
              right={new Date(d.loggedAt).toLocaleDateString('pt-BR')}
            />
          ))
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
      </Card>
    </Screen>
  );
}
