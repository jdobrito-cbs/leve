import { router } from 'expo-router';
import { Check, CloudUpload } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText, Button, Card, DisclaimerBanner, HeroHeader, IconChip } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { isAppleSignInSupported, signInWithApple } from '@/services/cloudAccount';
import { strings } from '@/i18n/pt-BR';

function AccountStep() {
  const { colors } = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function finish() {
    router.replace('/');
  }

  async function onApple() {
    setMessage(null);
    setBusy(true);
    try {
      const account = await signInWithApple(db);
      if (account) finish();
    } catch {
      setMessage(strings.cloudAccount.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <IconChip size={38}>
          <CloudUpload size={18} color={colors.primary} />
        </IconChip>
        <AppText variant="title" style={{ flex: 1 }}>
          {strings.cloudAccount.title}
        </AppText>
      </View>
      <AppText variant="caption" muted>
        {strings.cloudAccount.body}
      </AppText>
      {isAppleSignInSupported() ? (
        <Button label={strings.cloudAccount.apple} onPress={onApple} disabled={busy} />
      ) : null}
      <Button
        label={strings.cloudAccount.google}
        variant="secondary"
        onPress={() => setMessage(strings.cloudAccount.googleSoon)}
        disabled={busy}
      />
      {message ? (
        <AppText variant="caption" muted>
          {message}
        </AppText>
      ) : null}
      <Pressable accessibilityRole="button" onPress={finish}>
        <AppText variant="caption" muted style={{ textAlign: 'center' }}>
          {strings.cloudAccount.skip}
        </AppText>
      </Pressable>
    </Card>
  );
}

export default function Onboarding() {
  const { accept } = useOnboarding();
  const { colors } = useTheme();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'consent' | 'account'>('consent');

  async function onContinue() {
    setSaving(true);
    try {
      await accept();
      setStep('account');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
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
      <View style={{ padding: spacing.md, gap: spacing.md, marginTop: -spacing.lg, zIndex: 1 }}>
        {step === 'consent' ? (
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
        ) : (
          <AccountStep />
        )}
      </View>
    </ScrollView>
  );
}
