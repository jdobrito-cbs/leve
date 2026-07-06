import { ClipboardList, GlassWater, Syringe, Utensils, Weight } from 'lucide-react-native';
import { View } from 'react-native';
import { AppText, Card, IconChip, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { strings } from '@/i18n/pt-BR';

const items = [
  { Icon: GlassWater, label: strings.log.water },
  { Icon: Utensils, label: strings.log.meal },
  { Icon: Syringe, label: strings.log.dose },
  { Icon: Weight, label: strings.log.weight },
  { Icon: ClipboardList, label: strings.log.symptom },
];

export function LogHubScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.log.title}</AppText>
      {items.map(({ Icon, label }) => (
        <Card key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconChip Icon={Icon} />
          <View style={{ flex: 1 }}>
            <AppText>{label}</AppText>
            <AppText variant="caption" muted>
              {strings.log.comingSoon}
            </AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
