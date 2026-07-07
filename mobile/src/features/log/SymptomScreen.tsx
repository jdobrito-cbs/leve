import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  formatDateBR,
  formatDateTimeLabel,
  formatTimeHM,
  parseDateTimeBR,
} from '@/core/datetime';
import type { SymptomLog } from '@/core/types';
import { AppText, Button, Card, DateTimeField, ListRow, Screen, SegmentedChips } from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { addSymptom, deleteSymptom, listSymptoms } from '@/db/symptomRepo';
import { strings } from '@/i18n/pt-BR';

type KindKey = keyof typeof strings.symptom.kinds;

const KIND_OPTIONS = (Object.keys(strings.symptom.kinds) as KindKey[]).map((value) => ({
  value,
  label: strings.symptom.kinds[value],
}));

const INTENSITY_OPTIONS = ['1', '2', '3', '4', '5'].map((value) => ({ value, label: value }));

export function SymptomScreen() {
  const [kind, setKind] = useState<KindKey | null>(null);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [list, setList] = useState<SymptomLog[]>([]);
  const [dateStr, setDateStr] = useState(formatDateBR(new Date()));
  const [timeStr, setTimeStr] = useState(formatTimeHM(new Date()));
  const at = parseDateTimeBR(dateStr, timeStr);

  const load = useCallback(async () => {
    setList(await listSymptoms(db));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!kind || !intensity || !at) return;
    await addSymptom(db, kind, Number(intensity), at);
    setKind(null);
    setIntensity(null);
    await load();
  }

  return (
    <Screen>
      <AppText variant="display">{strings.symptom.title}</AppText>
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" muted>
          {strings.symptom.kindLabel}
        </AppText>
        <SegmentedChips options={KIND_OPTIONS} value={kind} onChange={setKind} />
        <AppText variant="caption" muted>
          {strings.symptom.intensityLabel}
        </AppText>
        <SegmentedChips options={INTENSITY_OPTIONS} value={intensity} onChange={setIntensity} />
        <DateTimeField
          dateValue={dateStr}
          timeValue={timeStr}
          onChangeDate={setDateStr}
          onChangeTime={setTimeStr}
        />
        <Button label={strings.symptom.save} onPress={save} disabled={!kind || !intensity || !at} />
      </Card>
      {list.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.common.historyTitle}</AppText>
          {list.map((s) => (
            <ListRow
              key={s.id}
              title={strings.symptom.kinds[s.kind as KindKey] ?? s.kind}
              subtitle={formatDateTimeLabel(s.loggedAt)}
              right={`${s.intensity}/5`}
              onDelete={async () => {
                await deleteSymptom(db, s.id);
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
