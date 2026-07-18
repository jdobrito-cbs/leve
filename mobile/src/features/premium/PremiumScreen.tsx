import { router } from 'expo-router';
import {
  Camera,
  Droplet,
  Dumbbell,
  FileText,
  HeartPulse,
  KeyRound,
  Pill,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, IconChip, Input, PickerSheet, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { setEntitlement } from '@/features/premium/entitlement';
import { verifyLicenseKey } from '@/features/premium/licenseKey';
import { usePremium } from '@/features/premium/usePremium';
import {
  PaidPlan,
  PlanPrices,
  getPurchasesProvider,
  isStoreConfigured,
} from '@/services/purchases/PurchasesProvider';
import { strings } from '@/i18n/pt-BR';

export function PremiumScreen() {
  const { colors } = useTheme();
  const { entitlement, premium, refresh } = usePremium();
  const [prices, setPrices] = useState<PlanPrices>({ monthly: null, annual: null });
  const [keyStr, setKeyStr] = useState('');
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStoreConfigured()) {
      getPurchasesProvider().getPrices().then(setPrices);
    }
  }, []);

  async function subscribe(plan: PaidPlan) {
    setMessage(null);
    if (!isStoreConfigured()) {
      setMessage({ text: strings.premium.storeUnavailable, ok: false });
      return;
    }
    setBusy(true);
    try {
      if (await getPurchasesProvider().purchase(plan)) {
        await setEntitlement(db, { plan, activatedAt: new Date().toISOString() });
        await refresh();
      } else {
        setMessage({ text: strings.premium.purchaseFailed, ok: false });
      }
    } catch {
      setMessage({ text: strings.premium.purchaseFailed, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setMessage(null);
    if (!isStoreConfigured()) {
      setMessage({ text: strings.premium.storeUnavailable, ok: false });
      return;
    }
    setBusy(true);
    try {
      if (await getPurchasesProvider().restore()) {
        await setEntitlement(db, { plan: 'annual', activatedAt: new Date().toISOString() });
        await refresh();
        setMessage({ text: strings.premium.restored, ok: true });
      } else {
        setMessage({ text: strings.premium.nothingToRestore, ok: false });
      }
    } catch {
      setMessage({ text: strings.premium.nothingToRestore, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function confirmKey() {
    const licenseId = verifyLicenseKey(keyStr);
    if (!licenseId) {
      setKeyError(strings.premium.keyInvalid);
      return;
    }
    await setEntitlement(db, {
      plan: 'partner',
      licenseId,
      activatedAt: new Date().toISOString(),
    });
    setKeyOpen(false);
    setKeyStr('');
    setKeyError(null);
    await refresh();
  }

  if (premium) {
    return (
      <Screen>
        <AppText variant="display">{strings.premium.title}</AppText>
        <Card style={{ gap: spacing.sm, alignItems: 'center' }}>
          <IconChip size={44}>
            <Sparkles size={22} color={colors.primary} />
          </IconChip>
          <AppText variant="title">{strings.premium.activeTitle}</AppText>
          <AppText muted>
            {strings.premium.activePlans[entitlement.plan as 'monthly' | 'annual' | 'partner']}
          </AppText>
        </Card>
        <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display">{strings.premium.title}</AppText>
      <AppText muted>{strings.premium.subtitle}</AppText>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.premium.benefitsTitle}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <Camera size={17} color={colors.primary} />
          </IconChip>
          <AppText style={{ flex: 1 }}>{strings.premium.benefits.scan}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <HeartPulse size={17} color={colors.primary} />
          </IconChip>
          <AppText style={{ flex: 1 }}>{strings.premium.benefits.health}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <Pill size={17} color={colors.primary} />
          </IconChip>
          <AppText style={{ flex: 1 }}>{strings.premium.benefits.meds}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <Dumbbell size={17} color={colors.primary} />
          </IconChip>
          <AppText style={{ flex: 1 }}>{strings.premium.benefits.gym}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <Droplet size={17} color={colors.primary} />
          </IconChip>
          <AppText style={{ flex: 1 }}>{strings.premium.benefits.cycle}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <FileText size={17} color={colors.primary} />
          </IconChip>
          <AppText style={{ flex: 1 }}>{strings.premium.benefits.report}</AppText>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Card style={{ flex: 1, gap: spacing.sm }}>
          <AppText variant="title">{strings.premium.monthly}</AppText>
          <AppText variant="caption" muted>
            {prices.monthly ?? strings.premium.monthlyPrice} · {strings.premium.perMonth}
          </AppText>
          <Button
            label={strings.premium.subscribe}
            onPress={() => subscribe('monthly')}
            disabled={busy}
          />
        </Card>
        <Card style={{ flex: 1, gap: spacing.sm }}>
          <AppText variant="title">{strings.premium.annual}</AppText>
          <AppText variant="caption" muted>
            {prices.annual ?? strings.premium.annualPrice} · {strings.premium.perYear}
          </AppText>
          <Button
            label={strings.premium.subscribe}
            onPress={() => subscribe('annual')}
            disabled={busy}
          />
        </Card>
      </View>
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        {strings.premium.billedByStore}
      </AppText>
      <Button
        label={strings.premium.restore}
        variant="secondary"
        onPress={restore}
        disabled={busy}
      />

      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconChip size={34}>
            <KeyRound size={17} color={colors.primary} />
          </IconChip>
          <AppText variant="title">{strings.premium.keySectionTitle}</AppText>
        </View>
        <Button
          label={strings.premium.redeem}
          variant="secondary"
          onPress={() => {
            setKeyStr('');
            setKeyError(null);
            setKeyOpen(true);
          }}
        />
      </Card>

      {/* Modal da chave: campo sempre visível acima do teclado + OK. */}
      <PickerSheet visible={keyOpen} onConfirm={confirmKey} onCancel={() => setKeyOpen(false)}>
        <AppText variant="title">{strings.premium.keySectionTitle}</AppText>
        <Input
          label={strings.premium.keyLabel}
          value={keyStr}
          onChangeText={(v) => {
            setKeyError(null);
            setKeyStr(v);
          }}
          placeholder={strings.premium.keyPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {keyError ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {keyError}
          </AppText>
        ) : null}
      </PickerSheet>

      {message ? (
        <AppText
          variant="caption"
          style={{ color: message.ok ? colors.success : colors.danger, textAlign: 'center' }}
        >
          {message.text}
        </AppText>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
