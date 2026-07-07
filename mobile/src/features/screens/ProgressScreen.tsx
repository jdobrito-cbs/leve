import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { METRIC_DEFS, MetricType } from '@/core/metrics';
import { AppText, Card, DisclaimerBanner, FitChart, ListRow, Screen, SegmentedChips } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { metricSeries, type MetricRow } from '@/db/metricsRepo';
import type { InjectionSite } from '@/features/dose/rotation';
import { estimateRelativeCurve } from '@/features/pk/pharmacokinetics';
import { useProgressData } from '@/features/progress/useProgressData';
import { strings } from '@/i18n/pt-BR';

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

function BodyHealthSection({ metrics }: { metrics: MetricRow[] }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<MetricType | null>(null);
  const [series, setSeries] = useState<MetricRow[]>([]);

  useEffect(() => {
    if (!selected) return;
    const since = new Date();
    since.setDate(since.getDate() - 90);
    metricSeries(db, selected, since).then(setSeries);
  }, [selected]);

  if (metrics.length === 0) {
    return (
      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.bodySection}</AppText>
        <AppText muted>{strings.progress.empty}</AppText>
      </Card>
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="title">{strings.progress.bodySection}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {metrics.map((m) => (
          <View key={m.type} style={{ flexBasis: '45%', flexGrow: 1 }}>
            <AppText variant="caption" muted>
              {strings.metrics[m.type]}
            </AppText>
            <AppText style={{ fontFamily: fonts.semibold }}>
              {m.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
              {METRIC_DEFS[m.type].unit}
            </AppText>
          </View>
        ))}
      </View>
      <SegmentedChips
        options={metrics.map((m) => ({ value: m.type, label: strings.metrics[m.type] }))}
        value={selected}
        onChange={setSelected}
      />
      {selected && series.length > 1 ? (
        <FitChart>{(fitWidth) => (<LineChart width={fitWidth}
          data={series.map((s) => ({ value: s.value }))}
          color={colors.primary}
          thickness={3}
          height={100}
          hideDataPoints
          hideAxesAndRules
          hideYAxisText
          adjustToWidth
curved
disableScroll
/>)}</FitChart>
      ) : selected ? (
        <AppText variant="caption" muted>
          {strings.progress.empty}
        </AppText>
      ) : null}
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
    return filtered.map((w) => ({ value: w.weightKg }));
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

      <BodyHealthSection metrics={metrics} />

      <Card style={{ gap: spacing.md }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <AppText variant="title">{strings.progress.weightSection}</AppText>
          {weights.length > 0 ? (
            <AppText style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 36 }}>
              {weights[weights.length - 1].weightKg.toLocaleString('pt-BR', {
                maximumFractionDigits: 1,
              })}{' '}
              kg
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
