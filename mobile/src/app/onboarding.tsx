import { router } from 'expo-router';
import { Check, CloudUpload } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ageFromIsoDate, brDateToIso, isoDateToBR } from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import {
  AppText,
  Button,
  Card,
  DateField,
  DisclaimerBanner,
  HeroHeader,
  IconChip,
  Input,
  RulerField,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { getProfile, updateProfile } from '@/db/profileRepo';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { estimateCalorieGoal } from '@/features/profile/calorieGoal';
import { setSexSignal } from '@/features/profile/sexSignal';
import type { SexOption } from '@/features/profile/useProfileForm';
import {
  getCloudAccount,
  isAppleSignInSupported,
  isGoogleSignInSupported,
  signInWithApple,
  signInWithGoogle,
} from '@/services/cloudAccount';
import { strings } from '@/i18n/pt-BR';

/** Dados básicos obrigatórios — a conta Apple/Google não fornece sexo nem
 *  nascimento (a Apple envia só nome/e-mail, e apenas no primeiro login). */
function ProfileStep() {
  const [name, setName] = useState('');
  const [sex, setSex] = useState<SexOption | null>(null);
  const [birthStr, setBirthStr] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [goalWeightStr, setGoalWeightStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getProfile(db).catch(() => null);
      const account = await getCloudAccount(db).catch(() => null);
      setName(profile?.name ?? account?.name ?? '');
      if (profile?.sex) setSex(profile.sex as SexOption);
      if (profile?.birthDate) setBirthStr(isoDateToBR(profile.birthDate));
      if (profile?.heightCm) setHeightStr(String(profile.heightCm));
      if (profile?.goalWeightKg) setGoalWeightStr(String(profile.goalWeightKg));
    })();
  }, []);

  const birthIso = brDateToIso(birthStr);
  const age = birthIso ? ageFromIsoDate(birthIso) : null;
  const heightCm = parseDecimalBR(heightStr);
  const goalWeightKg = parseDecimalBR(goalWeightStr);
  // Meta de calorias automática: manter o peso-meta (ajustável no Perfil).
  const calorieGoal =
    sex !== null && age !== null && heightCm && goalWeightKg
      ? estimateCalorieGoal(sex, goalWeightKg, heightCm, age)
      : null;
  const canSave =
    name.trim().length > 0 &&
    sex !== null &&
    birthIso !== null &&
    !!heightCm &&
    !!goalWeightKg;

  async function onSave() {
    if (!canSave || sex === null) return;
    setSaving(true);
    try {
      await updateProfile(db, {
        name: name.trim(),
        sex,
        birthDate: birthIso,
        heightCm,
        goalWeightKg,
        calorieGoalKcal: calorieGoal,
      });
      setSexSignal(sex);
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="title">{strings.onboarding.profileTitle}</AppText>
      <AppText variant="caption" muted>
        {strings.onboarding.profileBody}
      </AppText>
      <Input label={strings.profile.nameLabel} value={name} onChangeText={setName} />
      <AppText variant="caption" muted>
        {strings.profile.sexLabel}
      </AppText>
      <SegmentedChips
        options={(
          Object.keys(strings.profile.sexes) as Array<keyof typeof strings.profile.sexes>
        ).map((value) => ({ value, label: strings.profile.sexes[value] }))}
        value={sex}
        onChange={(v) => setSex(v as SexOption)}
      />
      <DateField
        label={strings.profile.birthDateLabel}
        value={birthStr}
        onChange={setBirthStr}
      />
      <RulerField
        label={strings.profile.heightLabel}
        value={heightStr}
        onChangeText={setHeightStr}
        suffix="cm"
        min={100}
        max={230}
        step={1}
        majorEvery={5}
        fallback={170}
      />
      <RulerField
        label={strings.profile.goalWeightLabel}
        value={goalWeightStr}
        onChangeText={setGoalWeightStr}
        suffix="kg"
        min={30}
        max={250}
        step={0.1}
        fallback={80}
      />
      {calorieGoal !== null ? (
        <>
          <AppText variant="caption" muted>
            {strings.onboarding.autoCalorieLabel}
          </AppText>
          <AppText variant="title">≈ {calorieGoal.toLocaleString('pt-BR')} kcal/dia</AppText>
          <AppText variant="caption" muted>
            {strings.onboarding.autoCalorieHint}
          </AppText>
        </>
      ) : null}
      <Button
        label={strings.onboarding.profileContinue}
        onPress={onSave}
        disabled={!canSave || saving}
      />
    </Card>
  );
}

function AccountStep({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function finish() {
    onDone();
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

  async function onGoogle() {
    setMessage(null);
    setBusy(true);
    try {
      const account = await signInWithGoogle(db);
      if (account) finish();
    } catch (e) {
      setMessage(
        e instanceof Error && e.message === 'google-unavailable'
          ? strings.cloudAccount.needsUpdate
          : strings.cloudAccount.failed,
      );
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
      {isGoogleSignInSupported() ? (
        <Button
          label={strings.cloudAccount.google}
          variant="secondary"
          onPress={onGoogle}
          disabled={busy}
        />
      ) : null}
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
  const [step, setStep] = useState<'consent' | 'account' | 'profile'>('consent');

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
      contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      // iOS: rola o conteúdo para cima quando o teclado abre — sem isto,
      // altura, meta de peso e o botão Concluir somem atrás do teclado.
      automaticallyAdjustKeyboardInsets
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
        ) : step === 'account' ? (
          <AccountStep onDone={() => setStep('profile')} />
        ) : (
          <ProfileStep />
        )}
      </View>
    </ScrollView>
  );
}
