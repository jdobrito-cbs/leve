import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Switch, View } from 'react-native';

import { ageFromIsoDate, brDateToIso } from '@/core/datetime';
import { db } from '@/db/client';
import { exportAllData, wipeAllData } from '@/features/backup/exportData';
import {
  AppText,
  Button,
  Card,
  DateField,
  DisclaimerBanner,
  Input,
  NumberField,
  RulerField,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useHealthConnection } from '@/features/health/useHealthConnection';
import { isLocked } from '@/features/premium/gates';
import { usePremium } from '@/features/premium/usePremium';
import { useProfileForm } from '@/features/profile/useProfileForm';
import { strings } from '@/i18n/pt-BR';

function HealthSection() {
  const { colors } = useTheme();
  const health = useHealthConnection();
  const { premium } = usePremium();
  const platformName = Platform.OS === 'ios' ? strings.health.iosName : strings.health.androidName;

  if (isLocked('healthSync', premium)) {
    return (
      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">
          {strings.health.section} — {platformName}
        </AppText>
        <AppText variant="caption" muted>
          {strings.premium.healthLockedBody}
        </AppText>
        <Button
          label={strings.premium.discover}
          onPress={() => router.push('/assinatura' as never)}
        />
      </Card>
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="title">
        {strings.health.section} — {platformName}
      </AppText>
      {!health.available ? (
        <AppText variant="caption" muted>
          {strings.health.unavailable}
        </AppText>
      ) : health.connected ? (
        <>
          <AppText variant="caption" style={{ color: colors.success }}>
            {strings.health.connected}
          </AppText>
          <Button
            label={strings.health.importNow}
            onPress={health.importNow}
            disabled={health.importing}
          />
          {health.lastImported !== null ? (
            <AppText variant="caption" muted>
              {health.lastImported} {strings.health.importedSuffix}
            </AppText>
          ) : null}
          <Button
            label={strings.health.disconnect}
            variant="secondary"
            onPress={health.disconnect}
          />
        </>
      ) : (
        <Button label={strings.health.connect} onPress={health.connect} />
      )}
      <AppText variant="caption" muted>
        {strings.health.privacyNote}
      </AppText>
    </Card>
  );
}

export function ProfileScreen() {
  const { colors } = useTheme();
  const { loading, form, setField, save, saved, permissionError, autoGoalMl } = useProfileForm();
  const birthIso = brDateToIso(form.birthDateStr);
  const age = birthIso ? ageFromIsoDate(birthIso) : null;

  if (loading) return <Screen />;

  return (
    <Screen>
      <AppText variant="display">{strings.profile.title}</AppText>
      <DisclaimerBanner />

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.profile.editSection}</AppText>
        <Input
          label={strings.profile.nameLabel}
          value={form.name}
          onChangeText={(v) => setField('name', v)}        />
        <AppText variant="caption" muted>
          {strings.profile.sexLabel}
        </AppText>
        <SegmentedChips
          options={(Object.keys(strings.profile.sexes) as Array<keyof typeof strings.profile.sexes>).map(
            (value) => ({ value, label: strings.profile.sexes[value] }),
          )}
          value={form.sex}
          onChange={(v) => setField('sex', v)}
        />
        <DateField
          label={strings.profile.birthDateLabel}
          value={form.birthDateStr}
          onChange={(v) => setField('birthDateStr', v)}        />
        {age !== null ? (
          <AppText variant="caption" muted>
            {age} {strings.profile.ageSuffix}
          </AppText>
        ) : null}
        <RulerField
          label={strings.profile.heightLabel}
          value={form.heightStr}
          onChangeText={(v) => setField('heightStr', v)}
          suffix="cm"
          min={100}
          max={230}
          step={1}
          majorEvery={5}
          labelEvery={10}
          decimals={0}
          fallback={170}
        />
        <Input
          label={strings.profile.medicationLabel}
          value={form.medication}
          onChangeText={(v) => setField('medication', v)}        />
        <RulerField
          label={strings.profile.goalWeightLabel}
          value={form.goalWeightStr}
          onChangeText={(v) => setField('goalWeightStr', v)}
          suffix="kg"
          min={30}
          max={250}
          step={0.1}
          fallback={80}
        />
        <NumberField
          label={strings.dose.intervalLabel}
          value={form.doseIntervalStr}
          onChangeText={(v) => setField('doseIntervalStr', v)}          suffix={strings.dose.days}
        />
        <AppText variant="caption" muted>
          {strings.dose.intervalHint}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.waterGoalAuto}</AppText>
            {form.waterGoalAuto && autoGoalMl !== null ? (
              <AppText variant="caption" muted>
                ≈ {autoGoalMl.toLocaleString('pt-BR')} ml
              </AppText>
            ) : null}
          </View>
          <Switch
            value={form.waterGoalAuto}
            onValueChange={(v) => setField('waterGoalAuto', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        <AppText variant="caption" muted>
          {strings.profile.waterGoalAutoHint}
        </AppText>
        {!form.waterGoalAuto ? (
          <NumberField
            label={strings.profile.waterGoalLabel}
            value={form.waterGoalStr}
            onChangeText={(v) => setField('waterGoalStr', v)}            suffix="ml"
          />
        ) : null}
        <RulerField
          label={strings.profile.calorieGoalLabel}
          value={form.calorieGoalStr}
          onChangeText={(v) => setField('calorieGoalStr', v)}
          suffix="kcal"
          min={800}
          max={4000}
          step={50}
          majorEvery={2}
          labelEvery={10}
          decimals={0}
          fallback={2000}
        />
        <AppText variant="caption" muted>
          {strings.profile.calorieGoalHint}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.profile.remindersSection}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.doseReminder}</AppText>
            <AppText variant="caption" muted>
              {strings.profile.doseReminderHint}
            </AppText>
          </View>
          <Switch
            value={form.doseEnabled}
            onValueChange={(v) => setField('doseEnabled', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.waterReminder}</AppText>
          </View>
          <Switch
            value={form.waterEnabled}
            onValueChange={(v) => setField('waterEnabled', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {form.waterEnabled ? (
          <Input
            label={strings.profile.waterTimesLabel}
            value={form.waterTimesStr}
            onChangeText={(v) => setField('waterTimesStr', v)}            placeholder="09:00, 13:00, 17:00"
          />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.insightsReminder}</AppText>
          </View>
          <Switch
            value={form.insightsEnabled}
            onValueChange={(v) => setField('insightsEnabled', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {permissionError ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {strings.profile.permissionDenied}
          </AppText>
        ) : null}
      </Card>

      <Button label={strings.profile.save} onPress={save} />
      {saved ? (
        <AppText variant="caption" style={{ color: colors.success, textAlign: 'center' }}>
          {strings.profile.saved}
        </AppText>
      ) : null}

      <HealthSection />

      <Card style={{ gap: spacing.sm }}>
        <Button
          label={strings.premium.title}
          variant="secondary"
          onPress={() => router.push('/assinatura' as never)}
        />
        <Button
          label={strings.meds.title}
          variant="secondary"
          onPress={() => router.push('/remedios' as never)}
        />
        <Button
          label={strings.account.section}
          variant="secondary"
          onPress={() => router.push('/conta' as never)}
        />
      </Card>

      <PrivacySection />
    </Screen>
  );
}

function PrivacySection() {
  const { colors } = useTheme();
  const [exported, setExported] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  async function exportData() {
    const data = await exportAllData(db);
    const path = `${FileSystem.cacheDirectory}leve-meus-dados.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
    setExported(true);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    }
  }

  async function deleteData() {
    if (!confirmWipe) return setConfirmWipe(true);
    await wipeAllData(db);
    router.replace('/onboarding' as never);
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="title">{strings.profile.privacySection}</AppText>
      <Button label={strings.profile.exportData} variant="secondary" onPress={exportData} />
      <AppText variant="caption" muted>
        {exported ? strings.profile.exported : strings.profile.exportHint}
      </AppText>
      <Button label={strings.profile.deleteData} variant="secondary" onPress={deleteData} />
      {confirmWipe ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {strings.profile.deleteDataConfirm}
        </AppText>
      ) : null}
    </Card>
  );
}
