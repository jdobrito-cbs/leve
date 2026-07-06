import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { parseDecimalBR } from '@/core/text';
import { AppText, Button, Card, NumberField, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { getProfile } from '@/db/profileRepo';
import { addWater, waterTotalForDay } from '@/db/waterRepo';
import { strings } from '@/i18n/pt-BR';

const QUICK = [
  { label: strings.water.quick200, amount: 200 },
  { label: strings.water.quick300, amount: 300 },
  { label: strings.water.quick500, amount: 500 },
];

export function WaterScreen() {
  const { colors } = useTheme();
  const [totalMl, setTotalMl] = useState(0);
  const [goalMl, setGoalMl] = useState(2000);
  const [custom, setCustom] = useState('');

  const load = useCallback(async () => {
    setTotalMl(await waterTotalForDay(db, new Date()));
    const p = await getProfile(db);
    if (p?.waterGoalMl) setGoalMl(p.waterGoalMl);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(amountMl: number) {
    await addWater(db, amountMl, new Date());
    setCustom('');
    await load();
  }

  const customMl = parseDecimalBR(custom);
  const progress = goalMl > 0 ? Math.min(totalMl / goalMl, 1) : 0;

  return (
    <Screen>
      <AppText variant="display">{strings.water.title}</AppText>
      <Card style={{ gap: spacing.sm }}>
        <AppText variant="title">
          {strings.water.todayTotal}: {totalMl.toLocaleString('pt-BR')} ml
        </AppText>
        <View
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primarySoft,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.primary,
            }}
          />
        </View>
        <AppText variant="caption" muted>
          {goalMl.toLocaleString('pt-BR')} ml {strings.today.ofGoal}
        </AppText>
        {totalMl >= goalMl ? (
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.water.goalReached}
          </AppText>
        ) : null}
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {QUICK.map((q) => (
          <View key={q.amount} style={{ flex: 1 }}>
            <Button label={q.label} onPress={() => add(q.amount)} />
          </View>
        ))}
      </View>
      <Card style={{ gap: spacing.md }}>
        <NumberField
          label={strings.water.customLabel}
          value={custom}
          onChangeText={setCustom}
          suffix="ml"
          placeholder="0"
        />
        <Button
          label={strings.water.addCustom}
          onPress={() => customMl && add(customMl)}
          disabled={!customMl || customMl <= 0}
        />
      </Card>
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
