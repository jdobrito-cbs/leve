import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { brDateToIso, isoDateToBR } from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import { db } from '@/db/client';
import { getProfile, updateProfile } from '@/db/profileRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { latestWeight } from '@/db/weightRepo';
import { getCloudAccount } from '@/services/cloudAccount';
import { setSexSignal } from '@/features/profile/sexSignal';
import { waterGoalFromWeightKg } from '@/features/water/waterGoal';
import { listAppointments } from '@/db/appointmentsRepo';
import {
  DEFAULT_REMINDERS,
  ReminderSettings,
  applyAppointmentReminders,
  applyInsightsReminder,
  applyMedicationReminders,
  applyMorningWaterReminder,
  applySleepReminder,
  applyWaterReminders,
  requestNotificationPermission,
} from '@/services/reminders/reminders';
import { listMedications, parseTimes } from '@/features/meds/medsRepo';

export type SexOption = 'feminino' | 'masculino' | 'nao_informar';

export interface ProfileForm {
  name: string;
  sex: SexOption | null;
  birthDateStr: string;
  heightStr: string;
  goalWeightStr: string;
  doseIntervalStr: string;
  waterGoalStr: string;
  waterGoalAuto: boolean;
  calorieGoalStr: string;
  doseEnabled: boolean;
  waterEnabled: boolean;
  waterTimesStr: string;
  insightsEnabled: boolean;
  appointmentsEnabled: boolean;
  medsEnabled: boolean;
  sleepEnabled: boolean;
  sleepTimeStr: string;
  wakeEnabled: boolean;
  wakeTimeStr: string;
  movementEnabled: boolean;
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  sex: null,
  birthDateStr: '',
  heightStr: '',
  goalWeightStr: '',
  doseIntervalStr: '7',
  waterGoalStr: '2000',
  waterGoalAuto: true,
  calorieGoalStr: '',
  doseEnabled: false,
  waterEnabled: false,
  waterTimesStr: DEFAULT_REMINDERS.waterTimes.join(', '),
  insightsEnabled: false,
  appointmentsEnabled: false,
  medsEnabled: true,
  sleepEnabled: false,
  sleepTimeStr: '22:30',
  wakeEnabled: false,
  wakeTimeStr: '07:00',
  movementEnabled: false,
};

export function useProfileForm() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [autoGoalMl, setAutoGoalMl] = useState<number | null>(null);
  const [detectedBedtime, setDetectedBedtime] = useState<string | null>(null);
  const [detectedWake, setDetectedWake] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [profile, reminders, waterAuto, weight, doseInterval, account, bedDet, wakeDet] =
      await Promise.all([
        getProfile(db),
        getSetting<ReminderSettings>(db, 'reminders'),
        getSetting<boolean>(db, 'waterGoalAuto'),
        latestWeight(db),
        getSetting<number>(db, 'doseIntervalDays'),
        getCloudAccount(db).catch(() => null),
        getSetting<string>(db, 'sleepBedtimeDetected'),
        getSetting<string>(db, 'sleepWakeDetected'),
      ]);
    const r = reminders ?? DEFAULT_REMINDERS;
    setDetectedBedtime(bedDet);
    setDetectedWake(wakeDet);
    setAutoGoalMl(weight ? waterGoalFromWeightKg(weight.weightKg) : null);
    setForm({
      name: profile?.name ?? account?.name ?? '',
      sex: (profile?.sex as SexOption | null) ?? null,
      birthDateStr: profile?.birthDate ? isoDateToBR(profile.birthDate) : '',
      heightStr: profile?.heightCm ? String(profile.heightCm) : '',
      goalWeightStr: profile?.goalWeightKg ? String(profile.goalWeightKg) : '',
      doseIntervalStr: doseInterval !== null ? String(doseInterval) : '7',
      waterGoalStr: profile?.waterGoalMl ? String(profile.waterGoalMl) : '2000',
      waterGoalAuto: waterAuto ?? true,
      calorieGoalStr: profile?.calorieGoalKcal ? String(profile.calorieGoalKcal) : '',
      doseEnabled: r.doseEnabled,
      waterEnabled: r.waterEnabled,
      waterTimesStr: r.waterTimes.join(', '),
      insightsEnabled: r.insightsEnabled ?? false,
      appointmentsEnabled: r.appointmentsEnabled ?? false,
      medsEnabled: r.medsEnabled ?? true,
      sleepEnabled: r.sleepEnabled ?? false,
      sleepTimeStr: r.sleepTime ?? bedDet ?? '22:30',
      wakeEnabled: r.wakeEnabled ?? false,
      wakeTimeStr: r.wakeTime ?? wakeDet ?? '07:00',
      movementEnabled: r.movementEnabled ?? false,
    });
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function setField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  const save = useCallback(async () => {
    setPermissionError(false);
    let {
      doseEnabled,
      waterEnabled,
      insightsEnabled,
      appointmentsEnabled,
      medsEnabled,
      sleepEnabled,
      wakeEnabled,
      movementEnabled,
    } = form;

    const anyOn =
      doseEnabled ||
      waterEnabled ||
      insightsEnabled ||
      appointmentsEnabled ||
      medsEnabled ||
      sleepEnabled ||
      wakeEnabled ||
      movementEnabled;
    if (anyOn) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        doseEnabled = false;
        waterEnabled = false;
        insightsEnabled = false;
        appointmentsEnabled = false;
        medsEnabled = false;
        sleepEnabled = false;
        wakeEnabled = false;
        movementEnabled = false;
        setPermissionError(true);
        setForm((f) => ({
          ...f,
          doseEnabled: false,
          waterEnabled: false,
          insightsEnabled: false,
          appointmentsEnabled: false,
          medsEnabled: false,
          sleepEnabled: false,
          wakeEnabled: false,
          movementEnabled: false,
        }));
      }
    }

    const waterTimes = form.waterTimesStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => /^\d{2}:\d{2}$/.test(t));

    await updateProfile(db, {
      name: form.name.trim() || null,
      sex: form.sex,
      birthDate: brDateToIso(form.birthDateStr),
      heightCm: parseDecimalBR(form.heightStr),
      goalWeightKg: parseDecimalBR(form.goalWeightStr),
      waterGoalMl: parseDecimalBR(form.waterGoalStr) ?? 2000,
      calorieGoalKcal: parseDecimalBR(form.calorieGoalStr),
    });
    const validTime = (s: string, fallback: string) =>
      /^\d{2}:\d{2}$/.test(s.trim()) ? s.trim() : fallback;
    const sleepTime = validTime(form.sleepTimeStr, detectedBedtime ?? '22:30');
    const wakeTime = validTime(form.wakeTimeStr, detectedWake ?? '07:00');
    const reminders: ReminderSettings = {
      doseEnabled,
      waterEnabled,
      waterTimes: waterTimes.length ? waterTimes : DEFAULT_REMINDERS.waterTimes,
      insightsEnabled,
      appointmentsEnabled,
      medsEnabled,
      sleepEnabled,
      sleepTime,
      sleepAuto: detectedBedtime === null || sleepTime === detectedBedtime,
      wakeEnabled,
      wakeTime,
      wakeAuto: detectedWake === null || wakeTime === detectedWake,
      movementEnabled,
    };
    setSexSignal(form.sex ?? 'nao_informar');
    await setSetting(db, 'reminders', reminders);
    await setSetting(db, 'waterGoalAuto', form.waterGoalAuto);
    await setSetting(
      db,
      'doseIntervalDays',
      Math.max(0, Math.round(parseDecimalBR(form.doseIntervalStr) ?? 7)),
    );
    await applyWaterReminders(reminders.waterEnabled, reminders.waterTimes);
    await applyInsightsReminder(insightsEnabled);
    await applyAppointmentReminders(appointmentsEnabled, await listAppointments(db));
    await applySleepReminder(sleepEnabled, sleepTime);
    await applyMorningWaterReminder(wakeEnabled, wakeTime);
    const activeMeds = await listMedications(db);
    await applyMedicationReminders(
      medsEnabled,
      activeMeds.map((m) => ({
        id: m.id,
        name: m.name,
        doseText: m.doseText,
        times: parseTimes(m.times),
      })),
    );
    setSaved(true);
  }, [form, detectedBedtime, detectedWake]);

  return {
    loading,
    form,
    setField,
    save,
    saved,
    permissionError,
    autoGoalMl,
    detectedBedtime,
    detectedWake,
  };
}
