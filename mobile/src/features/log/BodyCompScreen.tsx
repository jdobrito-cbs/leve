import { numberLocale } from '@/i18n/engine';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  formatDateBR,
  formatDateTimeLabel,
  formatTimeHM,
  parseDateTimeBR,
} from '@/core/datetime';
import { MANUAL_BODY_METRICS, METRIC_DEFS, MetricType } from '@/core/metrics';
import { parseDecimalBR } from '@/core/text';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  ListRow,
  NumberField,
  Screen,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import {
  MetricRow,
  addMetric,
  deleteMetric,
  latestMetrics,
  listManualMetrics,
} from '@/db/metricsRepo';
import { strings } from '@/i18n/pt-BR';
import {
  cmToDisplay,
  displayToCm,
  displayToKg,
  kgToDisplay,
  lengthUnit,
  weightUnit,
} from '@/core/units';

function displayUnitOf(unit: string): string {
  if (unit === 'kg') return weightUnit();
  if (unit === 'cm') return lengthUnit();
  return unit;
}

function toCanonical(unit: string, v: number): number {
  if (unit === 'kg') return Math.round(displayToKg(v) * 10) / 10;
  if (unit === 'cm') return Math.round(displayToCm(v) * 10) / 10;
  return v;
}

function toShown(unit: string, v: number): number {
  if (unit === 'kg') return Math.round(kgToDisplay(v) * 10) / 10;
  if (unit === 'cm') return Math.round(cmToDisplay(v) * 10) / 10;
  return v;
}

export function BodyCompScreen() {
  const { colors } = useTheme();
  const [values, setValues] = useState<Partial<Record<MetricType, string>>>({});
  const [placeholders, setPlaceholders] = useState<Partial<Record<MetricType, string>>>({});
  const [saved, setSaved] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const [list, setList] = useState<MetricRow[]>([]);
  const at = parseDateTimeBR(dateStr, timeStr);

  const load = useCallback(async () => {
    const [map, rows] = await Promise.all([
      latestMetrics(db),
      listManualMetrics(db, MANUAL_BODY_METRICS),
    ]);
    const p: Partial<Record<MetricType, string>> = {};
    for (const type of MANUAL_BODY_METRICS) {
      const last = map.get(type);
      if (last) p[type] = String(toShown(METRIC_DEFS[type].unit, last.value));
    }
    setPlaceholders(p);
    setList(rows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filled = MANUAL_BODY_METRICS.filter((t) => {
    const v = parseDecimalBR(values[t] ?? '');
    return v !== null && v > 0;
  });

  async function save() {
    if (!at) return;
    for (const type of filled) {
      const typed = parseDecimalBR(values[type] ?? '')!;
      await addMetric(db, type, toCanonical(METRIC_DEFS[type].unit, typed), at);
    }
    setValues({});
    setSaved(true);
    await load();
  }

  return (
    <Screen>
      <AppText variant="display">{strings.bodyComp.title}</AppText>
      <AppText variant="caption" muted>
        {strings.bodyComp.hint}
      </AppText>
      <Card style={{ gap: spacing.md }}>
        {MANUAL_BODY_METRICS.map((type) => (
          <NumberField
            key={type}
            label={strings.metrics[type]}
            value={values[type] ?? ''}
            onChangeText={(v) => {
              setSaved(false);
              setValues((prev) => ({ ...prev, [type]: v }));
            }}
            suffix={displayUnitOf(METRIC_DEFS[type].unit)}
            placeholder={placeholders[type] ?? '0,0'}
          />
        ))}
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
        />
        <Button
          label={strings.bodyComp.save}
          onPress={save}
          disabled={filled.length === 0 || !at}
        />
        {saved ? (
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.bodyComp.saved}
          </AppText>
        ) : null}
      </Card>
      {list.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.common.historyTitle}</AppText>
          {list.map((m) => (
            <ListRow
              key={m.id}
              title={strings.metrics[m.type]}
              subtitle={formatDateTimeLabel(m.loggedAt)}
              right={`${toShown(m.unit, m.value).toLocaleString(numberLocale(), {
                maximumFractionDigits: 1,
              })} ${displayUnitOf(m.unit)}`}
              onDelete={async () => {
                await deleteMetric(db, m.id);
                await load();
              }}
            />
          ))}
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
