import { router } from 'expo-router';
import { CalendarHeart, ClipboardList, GlassWater, PersonStanding, Syringe, Utensils, Weight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Card, IconChip, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { getProfile } from '@/db/profileRepo';
import { strings } from '@/i18n/pt-BR';

const baseItems = [
  { Icon: GlassWater, label: strings.log.water, route: '/log/agua' },
  { Icon: Utensils, label: strings.log.meal, route: '/log/refeicao' },
  { Icon: Syringe, label: strings.log.dose, route: '/log/dose' },
  { Icon: Weight, label: strings.log.weight, route: '/log/peso' },
  { Icon: ClipboardList, label: strings.log.symptom, route: '/log/sintoma' },
  { Icon: PersonStanding, label: strings.log.bodyComp, route: '/log/corpo' },
] as const;

export function LogHubScreen() {
  const [showCycle, setShowCycle] = useState(false);

  useEffect(() => {
    getProfile(db)
      .then((p) => setShowCycle(p?.sex === 'feminino'))
      .catch(() => setShowCycle(false));
  }, []);

  const items = showCycle
    ? [...baseItems, { Icon: CalendarHeart, label: strings.log.cycle, route: '/log/ciclo' } as const]
    : baseItems;

  return (
    <Screen>
      <AppText variant="display">{strings.log.title}</AppText>
      {items.map(({ Icon, label, route }, index) => {
        const card = (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <IconChip Icon={Icon} />
            <View style={{ flex: 1 }}>
              <AppText>{label}</AppText>
              {route ? null : (
                <AppText variant="caption" muted>
                  {strings.log.comingSoon}
                </AppText>
              )}
            </View>
          </Card>
        );
        return (
          <Animated.View key={label} entering={FadeInDown.duration(380).delay(index * 60)}>
            {route ? (
              <Pressable accessibilityRole="button" onPress={() => router.push(route as never)}>
                {card}
              </Pressable>
            ) : (
              <View>{card}</View>
            )}
          </Animated.View>
        );
      })}
    </Screen>
  );
}
