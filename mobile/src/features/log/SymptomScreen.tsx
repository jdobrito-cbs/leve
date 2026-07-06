import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import type { SymptomLog } from '@/core/types';
import { AppText, Button, Card, ListRow, Screen, SegmentedChips } from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { addSymptom, symptomsForDay } from '@/db/symptomRepo';
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
  const [today, setToday] = useState<SymptomLog[]>([]);

  const load = useCallback(async () => {
    setToday(await symptomsForDay(db, new Date()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!kind || !intensity) return;
    await addSymptom(db, kind, Number(intensity), new Date());
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
        <Button label={strings.symptom.save} onPress={save} disabled={!kind || !intensity} />
      </Card>
      {today.length > 0 ? (
        <Card>
          <AppText variant="title">{strings.symptom.todayList}</AppText>
          {today.map((s) => (
            <ListRow
              key={s.id}
              title={strings.symptom.kinds[s.kind as KindKey] ?? s.kind}
              right={`${s.intensity}/5`}
            />
          ))}
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
