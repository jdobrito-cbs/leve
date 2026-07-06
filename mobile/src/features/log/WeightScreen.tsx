import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import type { WeightLog } from '@/core/types';
import { parseDecimalBR } from '@/core/text';
import { AppText, Button, Card, NumberField, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { addWeight, latestWeight } from '@/db/weightRepo';
import { strings } from '@/i18n/pt-BR';

export function WeightScreen() {
  const [last, setLast] = useState<WeightLog | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    latestWeight(db).then(setLast);
  }, []);

  const kg = parseDecimalBR(value);
  const diff = last && kg !== null ? kg - last.weightKg : null;

  async function save() {
    if (kg === null || kg <= 0) return;
    await addWeight(db, kg, new Date());
    router.back();
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
            {new Date(last.loggedAt).toLocaleDateString('pt-BR')}
          </AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        <NumberField
          label={strings.weight.inputLabel}
          value={value}
          onChangeText={setValue}
          suffix="kg"
          placeholder="0,0"
        />
        {diff !== null ? (
          <AppText variant="caption" muted>
            {diff >= 0 ? '+' : '−'}
            {Math.abs(diff).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg{' '}
            {strings.weight.diffLabel}
          </AppText>
        ) : null}
        <Button label={strings.weight.save} onPress={save} disabled={kg === null || kg <= 0} />
      </Card>
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
