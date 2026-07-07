import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { formatDateBR, formatTimeHM, parseDateTimeBR } from '@/core/datetime';
import { MANUAL_BODY_METRICS, METRIC_DEFS, MetricType } from '@/core/metrics';
import { parseDecimalBR } from '@/core/text';
import { AppText, Button, Card, DateTimeField, NumberField, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { addMetric, latestMetrics } from '@/db/metricsRepo';
import { strings } from '@/i18n/pt-BR';

export function BodyCompScreen() {
  const { colors } = useTheme();
  const [values, setValues] = useState<Partial<Record<MetricType, string>>>({});
  const [placeholders, setPlaceholders] = useState<Partial<Record<MetricType, string>>>({});
  const [saved, setSaved] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const at = parseDateTimeBR(dateStr, timeStr);

  useEffect(() => {
    latestMetrics(db).then((map) => {
      const p: Partial<Record<MetricType, string>> = {};
      for (const type of MANUAL_BODY_METRICS) {
        const last = map.get(type);
        if (last) p[type] = String(last.value);
      }
      setPlaceholders(p);
    });
  }, []);

  const filled = MANUAL_BODY_METRICS.filter((t) => {
    const v = parseDecimalBR(values[t] ?? '');
    return v !== null && v > 0;
  });

  async function save() {
    if (!at) return;
    for (const type of filled) {
      await addMetric(db, type, parseDecimalBR(values[type] ?? '')!, at);
    }
    setValues({});
    setSaved(true);
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
            suffix={METRIC_DEFS[type].unit}
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
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
