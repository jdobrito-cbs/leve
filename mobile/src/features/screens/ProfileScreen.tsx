import { View } from 'react-native';
import { AppText, Card, DisclaimerBanner, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { strings } from '@/i18n/pt-BR';

export function ProfileScreen() {
  return (
    <Screen>
      <AppText variant="display">{strings.profile.title}</AppText>
      <DisclaimerBanner />
      <Card style={{ gap: spacing.sm }}>
        <AppText variant="title">{strings.profile.privacySection}</AppText>
        <View style={{ gap: spacing.xs }}>
          <AppText muted>{strings.profile.exportData}</AppText>
          <AppText variant="caption" muted>
            {strings.profile.comingSoon}
          </AppText>
        </View>
        <View style={{ gap: spacing.xs }}>
          <AppText muted>{strings.profile.deleteData}</AppText>
          <AppText variant="caption" muted>
            {strings.profile.comingSoon}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}
