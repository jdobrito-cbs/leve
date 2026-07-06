import { View } from 'react-native';
import { AppText, Card, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { strings } from '@/i18n/pt-BR';

const items = [
  { icon: '💧', label: strings.log.water },
  { icon: '🍽️', label: strings.log.meal },
  { icon: '💉', label: strings.log.dose },
  { icon: '⚖️', label: strings.log.weight },
  { icon: '📝', label: strings.log.symptom },
];

export function LogHubScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.log.title}</AppText>
      {items.map((item) => (
        <Card key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <AppText variant="title">{item.icon}</AppText>
          <View style={{ flex: 1 }}>
            <AppText>{item.label}</AppText>
            <AppText variant="caption" muted>
              {strings.log.comingSoon}
            </AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
