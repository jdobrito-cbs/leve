import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { formatDateBR, formatDateTimeLabel, formatTimeHM, parseDateTimeBR } from '@/core/datetime';
import type { WeightLog } from '@/core/types';
import { parseDecimalBR } from '@/core/text';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  ListRow,
  NumberField,
  Screen,
  ValueRuler,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { addWeight, deleteWeight, listWeights } from '@/db/weightRepo';
import { strings } from '@/i18n/pt-BR';

export function WeightScreen() {
  const { colors } = useTheme();
  const [list, setList] = useState<WeightLog[]>([]);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));

  const load = useCallback(async () => {
    setList(await listWeights(db));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kg = parseDecimalBR(value);
  const at = parseDateTimeBR(dateStr, timeStr);
  const last = list[0] ?? null;
  const diff = last && kg !== null ? kg - last.weightKg : null;

  async function save() {
    if (kg === null || kg <= 0 || !at) return;
    await addWeight(db, kg, at);
    setValue('');
    setSaved(true);
    await load();
  }

  async function remove(id: number) {
    await deleteWeight(db, id);
    await load();
  }

  return (
    <Screen>
      <AppText variant="display">{strings.weight.title}</AppText>
      {last ? (
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="caption" muted>
            {strings.weight.lastLabel}
          </AppText>
          <AppText variant="title">
            {last.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
          </AppText>
          <AppText variant="caption" muted>
            {formatDateTimeLabel(last.loggedAt)}
          </AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        <NumberField
          label={strings.weight.inputLabel}
          value={value}
          onChangeText={(v) => {
            setSaved(false);
            setValue(v);
          }}
          suffix="kg"
          placeholder="0,0"
        />
        <ValueRuler
          value={kg ?? last?.weightKg ?? 80}
          min={30}
          max={250}
          step={0.1}
          onChange={(v) => {
            setSaved(false);
            setValue(v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
          }}
        />
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
        />
        {diff !== null ? (
          <AppText variant="caption" muted>
            {diff >= 0 ? '+' : '−'}
            {Math.abs(diff).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg{' '}
            {strings.weight.diffLabel}
          </AppText>
        ) : null}
        <Button label={strings.weight.save} onPress={save} disabled={kg === null || kg <= 0 || !at} />
        {saved ? (
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.weight.savedLabel}
          </AppText>
        ) : null}
      </Card>
      {list.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.common.historyTitle}</AppText>
          {list.map((w) => (
            <ListRow
              key={w.id}
              title={`${w.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`}
              subtitle={formatDateTimeLabel(w.loggedAt)}
              onDelete={() => remove(w.id)}
            />
          ))}
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
