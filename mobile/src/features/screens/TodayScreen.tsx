import { ScrollView, View } from 'react-native';
import { AppText, Card, HeroHeader, ProgressRing } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { strings } from '@/i18n/pt-BR';

export function TodayScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader>
        <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
          {strings.today.greeting}
        </AppText>
        <AppText variant="display" style={{ color: colors.onHero }}>
          {strings.tabs.today}
        </AppText>
        <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
          {strings.today.summaryLabel}
        </AppText>
      </HeroHeader>
      <ScrollView
        style={{ marginTop: -spacing.lg }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}
      >
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
          <ProgressRing progress={0} size={148}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 40, color: colors.text }}>0</AppText>
            <AppText variant="caption" muted>
              {strings.today.ringLabel}
            </AppText>
          </ProgressRing>
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <AppText variant="title">{strings.today.emptyTitle}</AppText>
            <AppText muted style={{ textAlign: 'center' }}>
              {strings.today.emptyHint}
            </AppText>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
