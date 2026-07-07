import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText, Button, Card, DisclaimerBanner, HeroHeader } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { strings } from '@/i18n/pt-BR';

export default function Onboarding() {
  const { accept } = useOnboarding();
  const { colors } = useTheme();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    setSaving(true);
    try {
      await accept();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader>
        <AppText variant="caption" style={{ color: colors.onHero, opacity: 0.85 }}>
          {strings.appName} — {strings.tagline}
        </AppText>
        <AppText variant="display" style={{ color: colors.onHero }}>
          {strings.onboarding.welcomeTitle}
        </AppText>
        <AppText style={{ color: colors.onHero, opacity: 0.9 }}>
          {strings.onboarding.welcomeBody}
        </AppText>
      </HeroHeader>
      <ScrollView
        style={{ marginTop: -spacing.lg, zIndex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}
      >
        <Card style={{ gap: spacing.md }}>
          <DisclaimerBanner />
          <AppText variant="caption" muted>
            {strings.onboarding.privacyNote}
          </AppText>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setChecked((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: checked ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked ? <Check color={colors.onPrimary} size={14} strokeWidth={3} /> : null}
            </View>
            <AppText>{strings.onboarding.acceptLabel}</AppText>
          </Pressable>
          <Button
            label={strings.onboarding.continueButton}
            onPress={onContinue}
            disabled={!checked || saving}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
