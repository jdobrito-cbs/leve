import { router } from 'expo-router';
import { ClipboardList, GlassWater, Syringe, Utensils, Weight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { AppText, Card, IconChip, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { strings } from '@/i18n/pt-BR';

const items = [
  { Icon: GlassWater, label: strings.log.water, route: '/log/agua' },
  { Icon: Utensils, label: strings.log.meal, route: '/log/refeicao' },
  { Icon: Syringe, label: strings.log.dose, route: '/log/dose' },
  { Icon: Weight, label: strings.log.weight, route: '/log/peso' },
  { Icon: ClipboardList, label: strings.log.symptom, route: '/log/sintoma' },
] as const;

export function LogHubScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.log.title}</AppText>
      {items.map(({ Icon, label, route }) => {
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
        return route ? (
          <Pressable
            key={label}
            accessibilityRole="button"
            onPress={() => router.push(route as never)}
          >
            {card}
          </Pressable>
        ) : (
          <View key={label}>{card}</View>
        );
      })}
    </Screen>
  );
}
