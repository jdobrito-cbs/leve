import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { parseDecimalBR } from '@/core/text';
import { AppText, Button, Card, NumberField, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { addWater, waterTotalForDay } from '@/db/waterRepo';
import { setMascotEvent } from '@/features/today/mascotSignal';
import { getEffectiveWaterGoal } from '@/features/water/waterGoal';
import { strings } from '@/i18n/pt-BR';
import { displayToMl, formatVolume, volumeUnit } from '@/core/units';

// Copos de 200/300/500 ml; no sistema imperial o rótulo mostra fl oz.
const quickOptions = () =>
  [200, 300, 500].map((amount) => ({ amount, label: `+ ${formatVolume(amount)}` }));

export function WaterScreen() {
  const { colors } = useTheme();
  const [totalMl, setTotalMl] = useState(0);
  const [goalMl, setGoalMl] = useState(2000);
  const [custom, setCustom] = useState('');

  const load = useCallback(async () => {
    setTotalMl(await waterTotalForDay(db, new Date()));
    const { goalMl } = await getEffectiveWaterGoal(db);
    setGoalMl(goalMl);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(amountMl: number) {
    await addWater(db, amountMl, new Date());
    // Gole registrado → panda hidratado por 1 minuto no Hoje.
    setMascotEvent('hydrated');
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
          {strings.water.todayTotal}: {formatVolume(totalMl)}
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
          {formatVolume(goalMl)} {strings.today.ofGoal}
        </AppText>
        {totalMl >= goalMl ? (
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.water.goalReached}
          </AppText>
        ) : null}
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {quickOptions().map((q) => (
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
          suffix={volumeUnit()}
          placeholder="0"
        />
        <Button
          label={strings.water.addCustom}
          onPress={() => customMl && add(Math.round(displayToMl(customMl)))}
          disabled={!customMl || customMl <= 0}
        />
      </Card>
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
