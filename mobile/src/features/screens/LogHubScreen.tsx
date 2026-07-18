import { router } from 'expo-router';
import { useEffect, useState, type ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Card, IconChip, Screen } from '@/design/components';
import {
  BodyDanceIcon,
  CycleHeartIcon,
  NotesWritingIcon,
  PillRollIcon,
  StethoscopeSwingIcon,
  SyringeInjectIcon,
  UtensilsCrossIcon,
  WaterGlassIcon,
  WeightDropIcon,
} from '@/design/logIcons';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { getProfile } from '@/db/profileRepo';
import { strings } from '@/i18n/pt-BR';

interface HubItem {
  Anim: ComponentType<{ size?: number }>;
  label: string;
  route: string;
}

const baseItems: HubItem[] = [
  { Anim: WaterGlassIcon, label: strings.log.water, route: '/log/agua' },
  { Anim: UtensilsCrossIcon, label: strings.log.meal, route: '/log/refeicao' },
  { Anim: SyringeInjectIcon, label: strings.log.dose, route: '/log/dose' },
  { Anim: WeightDropIcon, label: strings.log.weight, route: '/log/peso' },
  { Anim: NotesWritingIcon, label: strings.log.symptom, route: '/log/sintoma' },
  { Anim: BodyDanceIcon, label: strings.log.bodyComp, route: '/log/corpo' },
  { Anim: PillRollIcon, label: strings.meds.title, route: '/remedios' },
  { Anim: StethoscopeSwingIcon, label: strings.appointments.title, route: '/consultas' },
];

export function LogHubScreen() {
  const [showCycle, setShowCycle] = useState(false);

  useEffect(() => {
    getProfile(db)
      .then((p) => setShowCycle(p?.sex === 'feminino'))
      .catch(() => setShowCycle(false));
  }, []);

  const items = showCycle
    ? [...baseItems, { Anim: CycleHeartIcon, label: strings.log.cycle, route: '/log/ciclo' }]
    : baseItems;

  return (
    <Screen>
      <AppText variant="display">{strings.log.title}</AppText>
      {items.map(({ Anim, label, route }, index) => (
        <Animated.View key={label} entering={FadeInDown.duration(380).delay(index * 60)}>
          <Pressable accessibilityRole="button" onPress={() => router.push(route as never)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <IconChip>
                <Anim />
              </IconChip>
              <View style={{ flex: 1 }}>
                <AppText>{label}</AppText>
              </View>
            </Card>
          </Pressable>
        </Animated.View>
      ))}
    </Screen>
  );
}
