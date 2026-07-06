import { useMemo, useState } from 'react';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { AppText, Card, ListRow, Screen, SegmentedChips } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import type { InjectionSite } from '@/features/dose/rotation';
import { useProgressData } from '@/features/progress/useProgressData';
import { strings } from '@/i18n/pt-BR';

type RangeKey = '30' | '90';

const RANGE_OPTIONS = [
  { value: '30' as RangeKey, label: strings.progress.range30 },
  { value: '90' as RangeKey, label: strings.progress.range90 },
];

function weekdayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
}

export function ProgressScreen() {
  const { colors } = useTheme();
  const { weights, water7, kcal7, doses } = useProgressData();
  const [range, setRange] = useState<RangeKey>('30');

  const weightData = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - Number(range));
    return weights
      .filter((w) => new Date(w.loggedAt) >= since)
      .map((w) => ({ value: w.weightKg }));
  }, [weights, range]);

  const waterData = water7.map((d) => ({ value: d.totalMl, label: weekdayLabel(d.dayKey) }));
  const kcalData = kcal7.map((d) => ({ value: d.kcal, label: weekdayLabel(d.dayKey) }));
  const hasWater = water7.some((d) => d.totalMl > 0);
  const hasKcal = kcal7.some((d) => d.kcal > 0);

  return (
    <Screen>
      <AppText variant="display">{strings.tabs.progress}</AppText>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.weightSection}</AppText>
        <SegmentedChips options={RANGE_OPTIONS} value={range} onChange={setRange} />
        {weightData.length > 1 ? (
          <LineChart
            data={weightData}
            color={colors.primary}
            thickness={3}
            hideDataPoints={weightData.length > 20}
            dataPointsColor={colors.primary}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border}
            adjustToWidth
            curved
          />
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.waterSection}</AppText>
        {hasWater ? (
          <BarChart
            data={waterData}
            frontColor={colors.primary}
            barBorderRadius={6}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border}
            adjustToWidth
          />
        ) : (
          <AppText muted>{strings.progress.empty}</AppText>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.progress.kcalSection}</AppText>
        {hasKcal ? (
          <BarChart
            data={kcalData}
            frontColor={colors.primary}
            barBorderRadius={6}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            rulesColor={colors.border}
            adjustToWidth
          />
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
