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
  RulerField,
  Screen,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { addWeight, deleteWeight, listWeights } from '@/db/weightRepo';
import { setMascotEvent } from '@/features/today/mascotSignal';
import { strings } from '@/i18n/pt-BR';
import { displayToKg, formatWeight, kgToDisplay, weightUnit } from '@/core/units';

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

  // O campo digita na unidade de exibição (kg ou lb); o banco guarda kg.
  const entered = parseDecimalBR(value);
  const kg = entered !== null ? displayToKg(entered) : null;
  const at = parseDateTimeBR(dateStr, timeStr);
  const last = list[0] ?? null;
  const diff = last && kg !== null ? kg - last.weightKg : null;

  async function save() {
    if (kg === null || kg <= 0 || !at) return;
    await addWeight(db, kg, at);
    // Peso caiu → panda comemorando por 1 minuto no Hoje.
    if (diff !== null && diff < 0) setMascotEvent('slimmer');
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
          <AppText variant="title">{formatWeight(last.weightKg)}</AppText>
          <AppText variant="caption" muted>
            {formatDateTimeLabel(last.loggedAt)}
          </AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        <RulerField
          label={strings.weight.inputLabel}
          value={value}
          onChangeText={(v) => {
            setSaved(false);
            setValue(v);
          }}
          suffix={weightUnit()}
          placeholder="0,0"
          min={Math.round(kgToDisplay(30))}
          max={Math.round(kgToDisplay(250))}
          step={0.1}
          fallback={Math.round(kgToDisplay(last?.weightKg ?? 80) * 10) / 10}
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
            {formatWeight(Math.abs(diff))} {strings.weight.diffLabel}
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
              title={formatWeight(w.weightKg)}
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
