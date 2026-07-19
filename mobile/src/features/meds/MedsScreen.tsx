import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  Input,
  ListRow,
  Screen,
  SegmentedChips,
} from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { getSetting } from '@/db/settingsRepo';
import { isLocked } from '@/features/premium/gates';
import { usePremium } from '@/features/premium/usePremium';
import { strings } from '@/i18n/pt-BR';
import {
  applyMedicationReminders,
  requestNotificationPermission,
  type ReminderSettings,
} from '@/services/reminders/reminders';
import {
  DAILY_DOSE_COUNTS,
  Medication,
  TodayIntake,
  addMedication,
  adherence,
  deactivateMedication,
  listMedications,
  markTaken,
  parseTimes,
  timesForDailyCount,
  todayIntakes,
} from './medsRepo';

const DOSE_COUNT_OPTIONS = DAILY_DOSE_COUNTS.map((n) => ({
  value: String(n),
  label: `${n}x`,
}));

export function MedsScreen() {
  const { colors } = useTheme();
  const { premium } = usePremium();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<TodayIntake[]>([]);
  const [stats, setStats] = useState({ taken: 0, total: 0 });
  const [name, setName] = useState('');
  const [doseText, setDoseText] = useState('');
  const [doseCount, setDoseCount] = useState('1');
  // Horários sugeridos pelo sistema, editáveis pela pessoa antes de adicionar.
  const [timesStr, setTimesStr] = useState(timesForDailyCount(1).join(', '));

  function pickDoseCount(v: string) {
    setDoseCount(v);
    setTimesStr(timesForDailyCount(Number(v)).join(', '));
  }

  const load = useCallback(async () => {
    setMeds(await listMedications(db));
    setIntakes(await todayIntakes(db, new Date()));
    setStats(await adherence(db, 7, new Date()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLocked('meds', premium)) {
    return (
      <Screen>
        <AppText variant="display">{strings.meds.title}</AppText>
        <Card style={{ gap: spacing.md }}>
          <AppText variant="caption" muted>
            {strings.premium.medsLockedBody}
          </AppText>
          <Button
            label={strings.premium.discover}
            onPress={() => router.push('/assinatura' as never)}
          />
        </Card>
        {router.canGoBack?.() ? (
          <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
        ) : null}
      </Screen>
    );
  }

  async function reschedule() {
    const active = await listMedications(db);
    const r = await getSetting<ReminderSettings>(db, 'reminders');
    await applyMedicationReminders(
      r?.medsEnabled ?? true,
      active.map((m) => ({ id: m.id, name: m.name, doseText: m.doseText, times: parseTimes(m.times) })),
    );
  }

  async function add() {
    if (!name.trim()) return;
    const custom = timesStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => /^\d{2}:\d{2}$/.test(t))
      .sort();
    await addMedication(db, {
      name: name.trim(),
      doseText: doseText.trim() || null,
      times: custom.length ? custom : timesForDailyCount(Number(doseCount)),
    });
    await requestNotificationPermission();
    await reschedule();
    setName('');
    setDoseText('');
    setDoseCount('1');
    setTimesStr(timesForDailyCount(1).join(', '));
    await load();
  }

  async function remove(id: number) {
    await deactivateMedication(db, id);
    await reschedule();
    await load();
  }

  return (
    <Screen>
      <AppText variant="display">{strings.meds.title}</AppText>
      <AppText variant="caption" muted>
        {strings.meds.hint}
      </AppText>

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="title">{strings.meds.todayTitle}</AppText>
        {intakes.length === 0 ? (
          <AppText muted>{strings.meds.empty}</AppText>
        ) : (
          intakes.map((i) => (
            <View
              key={i.intakeId}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <View style={{ flex: 1 }}>
                <AppText>
                  {i.time} · {i.name}
                </AppText>
                {i.doseText ? (
                  <AppText variant="caption" muted>
                    {i.doseText}
                  </AppText>
                ) : null}
              </View>
              {i.takenAt ? (
                <AppText variant="caption" style={{ color: colors.success }}>
                  {strings.meds.takenDone}
                </AppText>
              ) : (
                <Button
                  label={strings.meds.taken}
                  onPress={async () => {
                    await markTaken(db, i.intakeId, new Date());
                    await load();
                  }}
                />
              )}
            </View>
          ))
        )}
        {stats.total > 0 ? (
          <AppText variant="caption" muted>
            {strings.meds.adherence}: {stats.taken}/{stats.total}
          </AppText>
        ) : null}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Input label={strings.meds.nameLabel} value={name} onChangeText={setName} />
        <Input label={strings.meds.doseLabel} value={doseText} onChangeText={setDoseText} />
        <AppText variant="caption" muted>
          {strings.meds.dosesPerDayLabel}
        </AppText>
        <SegmentedChips options={DOSE_COUNT_OPTIONS} value={doseCount} onChange={pickDoseCount} />
        <Input
          label={strings.meds.timesLabel}
          value={timesStr}
          onChangeText={setTimesStr}
          placeholder="08:00, 20:00"
        />
        <AppText variant="caption" muted>
          {strings.meds.timesHint}
        </AppText>
        <Button label={strings.meds.add} onPress={add} disabled={!name.trim()} />
        <AppText variant="caption" muted>
          {strings.meds.remindersOn}
        </AppText>
      </Card>

      {meds.length > 0 ? (
        <Card>
          {meds.map((m) => (
            <ListRow
              key={m.id}
              title={m.name}
              subtitle={`${m.doseText ?? ''} ${parseTimes(m.times).join(' · ')}`.trim()}
              right={strings.meds.remove}
              onPress={() => remove(m.id)}
            />
          ))}
        </Card>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
