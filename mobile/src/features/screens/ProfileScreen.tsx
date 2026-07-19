import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { ageFromIsoDate, brDateToIso } from '@/core/datetime';
import { db } from '@/db/client';
import { setSetting } from '@/db/settingsRepo';
import { setThemeSignal } from '@/design/themeSignal';
import { buildBodyReport } from '@/features/report/bodyReport';
import { reportHtml } from '@/features/report/reportHtml';
import {
  AppSwitch,
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
  const [connectDenied, setConnectDenied] = useState(false);
  const platformName = Platform.OS === 'ios' ? strings.health.iosName : strings.health.androidName;

  async function onConnect() {
    setConnectDenied(false);
    const granted = await health.connect();
    if (!granted) setConnectDenied(true);
  }

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
        <>
          <Button label={strings.health.connect} onPress={onConnect} />
          {connectDenied ? (
            <AppText variant="caption" style={{ color: colors.danger }}>
              {strings.health.connectDenied}
            </AppText>
          ) : null}
        </>
      )}
      <AppText variant="caption" muted>
        {strings.health.privacyNote}
      </AppText>
    </Card>
  );
}

export function ProfileScreen() {
  const { colors, mode } = useTheme();
  const { premium } = usePremium();
  const {
    loading,
    form,
    setField,
    save,
    saved,
    permissionError,
    autoGoalMl,
    detectedBedtime,
    detectedWake,
  } = useProfileForm();
  const birthIso = brDateToIso(form.birthDateStr);
  const age = birthIso ? ageFromIsoDate(birthIso) : null;
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);

  async function generateReport() {
    setReportMsg(null);
    if (isLocked('bodyReport', premium)) {
      router.push('/assinatura' as never);
      return;
    }
    if (Platform.OS === 'web') {
      setReportMsg(strings.report.webUnavailable);
      return;
    }
    setReportBusy(true);
    try {
      const report = await buildBodyReport(db);
      if (!report) {
        setReportMsg(strings.report.missingData);
        return;
      }
      const Print = require('expo-print') as typeof import('expo-print');
      // Página A4 (595×842 pt) — o padrão do iOS é Carta e sobrava página em branco.
      const { uri } = await Print.printToFileAsync({
        html: reportHtml(report),
        width: 595,
        height: 842,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      }
    } catch (e) {
      // Build instalada sem o módulo nativo de impressão (anterior ao expo-print).
      const missingModule = e instanceof Error && /ExpoPrint|native module/i.test(e.message);
      setReportMsg(missingModule ? strings.report.needsUpdate : strings.report.failed);
    } finally {
      setReportBusy(false);
    }
  }

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
          <AppSwitch
            value={form.waterGoalAuto}
            onValueChange={(v) => setField('waterGoalAuto', v)}
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
          <AppSwitch
            value={form.doseEnabled}
            onValueChange={(v) => setField('doseEnabled', v)}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.waterReminder}</AppText>
          </View>
          <AppSwitch
            value={form.waterEnabled}
            onValueChange={(v) => setField('waterEnabled', v)}
          />
        </View>
        {form.waterEnabled ? (
          <Input
            label={strings.profile.waterTimesLabel}
            value={form.waterTimesStr}
            onChangeText={(v) => setField('waterTimesStr', v)}
            placeholder="09:00, 13:00, 17:00, 21:00"
          />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.medsReminder}</AppText>
            <AppText variant="caption" muted>
              {strings.profile.medsReminderHint}
            </AppText>
          </View>
          <AppSwitch
            value={form.medsEnabled}
            onValueChange={(v) => setField('medsEnabled', v)}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.sleepReminder}</AppText>
            <AppText variant="caption" muted>
              {strings.profile.sleepReminderHint}
            </AppText>
          </View>
          <AppSwitch
            value={form.sleepEnabled}
            onValueChange={(v) => setField('sleepEnabled', v)}
          />
        </View>
        {form.sleepEnabled ? (
          <>
            <Input
              label={strings.profile.sleepTimeLabel}
              value={form.sleepTimeStr}
              onChangeText={(v) => setField('sleepTimeStr', v)}
              placeholder="22:30"
            />
            <AppText variant="caption" muted>
              {detectedBedtime
                ? strings.profile.sleepDetected.replace('{time}', detectedBedtime)
                : strings.profile.sleepNotDetected}
            </AppText>
          </>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.wakeReminder}</AppText>
            <AppText variant="caption" muted>
              {strings.profile.wakeReminderHint}
            </AppText>
          </View>
          <AppSwitch
            value={form.wakeEnabled}
            onValueChange={(v) => setField('wakeEnabled', v)}
          />
        </View>
        {form.wakeEnabled ? (
          <>
            <Input
              label={strings.profile.wakeTimeLabel}
              value={form.wakeTimeStr}
              onChangeText={(v) => setField('wakeTimeStr', v)}
              placeholder="07:00"
            />
            <AppText variant="caption" muted>
              {detectedWake
                ? strings.profile.wakeDetected.replace('{time}', detectedWake)
                : strings.profile.wakeNotDetected}
            </AppText>
          </>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.movementReminder}</AppText>
            <AppText variant="caption" muted>
              {strings.profile.movementReminderHint}
            </AppText>
          </View>
          <AppSwitch
            value={form.movementEnabled}
            onValueChange={(v) => setField('movementEnabled', v)}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.insightsReminder}</AppText>
          </View>
          <AppSwitch
            value={form.insightsEnabled}
            onValueChange={(v) => setField('insightsEnabled', v)}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.appointmentsReminder}</AppText>
          </View>
          <AppSwitch
            value={form.appointmentsEnabled}
            onValueChange={(v) => setField('appointmentsEnabled', v)}
          />
        </View>
        {permissionError ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {strings.profile.permissionDenied}
          </AppText>
        ) : null}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="title">{strings.profile.appearanceSection}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText>{strings.profile.darkTheme}</AppText>
          </View>
          <AppSwitch
            value={mode === 'dark'}
            onValueChange={async (v) => {
              const m = v ? 'dark' : 'light';
              setThemeSignal(m);
              await setSetting(db, 'themeMode', m).catch(() => undefined);
            }}
          />
        </View>
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
          label={
            isLocked('bodyReport', premium)
              ? `${strings.report.button} · ${strings.premium.lockedTag}`
              : strings.report.button
          }
          variant="secondary"
          onPress={generateReport}
          disabled={reportBusy}
        />
        {reportMsg ? (
          <AppText variant="caption" muted style={{ textAlign: 'center' }}>
            {reportMsg}
          </AppText>
        ) : null}
        <Button
          label={strings.accountPrivacy.title}
          variant="secondary"
          onPress={() => router.push('/conta-privacidade' as never)}
        />
        <Button
          label={strings.about.title}
          variant="secondary"
          onPress={() => router.push('/sobre' as never)}
        />
      </Card>
    </Screen>
  );
}
