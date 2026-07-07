import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Input, ListRow, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { strings } from '@/i18n/pt-BR';
import { applyMedicationReminders, requestNotificationPermission } from '@/services/reminders/reminders';
import {
  Medication,
  TodayIntake,
  addMedication,
  adherence,
  deactivateMedication,
  listMedications,
  markTaken,
  parseTimes,
  todayIntakes,
} from './medsRepo';

export function MedsScreen() {
  const { colors } = useTheme();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<TodayIntake[]>([]);
  const [stats, setStats] = useState({ taken: 0, total: 0 });
  const [name, setName] = useState('');
  const [doseText, setDoseText] = useState('');
  const [timesStr, setTimesStr] = useState('08:00');

  const load = useCallback(async () => {
    setMeds(await listMedications(db));
    setIntakes(await todayIntakes(db, new Date()));
    setStats(await adherence(db, 7, new Date()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function reschedule() {
    const active = await listMedications(db);
    await applyMedicationReminders(
      active.map((m) => ({ id: m.id, name: m.name, doseText: m.doseText, times: parseTimes(m.times) })),
    );
  }

  async function add() {
    const times = parseTimes(timesStr);
    if (!name.trim() || times.length === 0) return;
    await addMedication(db, { name: name.trim(), doseText: doseText.trim() || null, times });
    await requestNotificationPermission();
    await reschedule();
    setName('');
    setDoseText('');
    setTimesStr('08:00');
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
        <Input
          label={strings.meds.timesLabel}
          value={timesStr}
          onChangeText={setTimesStr}
          placeholder="08:00, 20:00"
        />
        <Button
          label={strings.meds.add}
          onPress={add}
          disabled={!name.trim() || parseTimes(timesStr).length === 0}
        />
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
