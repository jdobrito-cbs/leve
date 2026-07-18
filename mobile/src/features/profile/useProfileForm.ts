import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { brDateToIso, isoDateToBR } from '@/core/datetime';
import { parseDecimalBR } from '@/core/text';
import { db } from '@/db/client';
import { getProfile, updateProfile } from '@/db/profileRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { latestWeight } from '@/db/weightRepo';
import { getCloudAccount } from '@/services/cloudAccount';
import { waterGoalFromWeightKg } from '@/features/water/waterGoal';
import {
  DEFAULT_REMINDERS,
  ReminderSettings,
  applyInsightsReminder,
  applyWaterReminders,
  requestNotificationPermission,
} from '@/services/reminders/reminders';

export type SexOption = 'feminino' | 'masculino' | 'nao_informar';

export interface ProfileForm {
  name: string;
  sex: SexOption | null;
  birthDateStr: string; // 'DD/MM/AAAA'
  heightStr: string;
  medication: string;
  goalWeightStr: string;
  doseIntervalStr: string;
  waterGoalStr: string;
  waterGoalAuto: boolean;
  calorieGoalStr: string;
  doseEnabled: boolean;
  waterEnabled: boolean;
  waterTimesStr: string; // 'HH:MM, HH:MM'
  insightsEnabled: boolean;
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  sex: null,
  birthDateStr: '',
  heightStr: '',
  medication: '',
  goalWeightStr: '',
  doseIntervalStr: '7',
  waterGoalStr: '2000',
  waterGoalAuto: true,
  calorieGoalStr: '',
  doseEnabled: false,
  waterEnabled: false,
  waterTimesStr: DEFAULT_REMINDERS.waterTimes.join(', '),
  insightsEnabled: false,
};

export function useProfileForm() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [autoGoalMl, setAutoGoalMl] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [profile, reminders, waterAuto, weight, doseInterval, account] = await Promise.all([
      getProfile(db),
      getSetting<ReminderSettings>(db, 'reminders'),
      getSetting<boolean>(db, 'waterGoalAuto'),
      latestWeight(db),
      getSetting<number>(db, 'doseIntervalDays'),
      getCloudAccount(db).catch(() => null),
    ]);
    const r = reminders ?? DEFAULT_REMINDERS;
    setAutoGoalMl(weight ? waterGoalFromWeightKg(weight.weightKg) : null);
    setForm({
      // Sem nome salvo, usa o da conta conectada (Apple/Google).
      name: profile?.name ?? account?.name ?? '',
      sex: (profile?.sex as SexOption | null) ?? null,
      birthDateStr: profile?.birthDate ? isoDateToBR(profile.birthDate) : '',
      heightStr: profile?.heightCm ? String(profile.heightCm) : '',
      medication: profile?.medication ?? '',
      goalWeightStr: profile?.goalWeightKg ? String(profile.goalWeightKg) : '',
      doseIntervalStr: doseInterval !== null ? String(doseInterval) : '7',
      waterGoalStr: profile?.waterGoalMl ? String(profile.waterGoalMl) : '2000',
      waterGoalAuto: waterAuto ?? true,
      calorieGoalStr: profile?.calorieGoalKcal ? String(profile.calorieGoalKcal) : '',
      doseEnabled: r.doseEnabled,
      waterEnabled: r.waterEnabled,
      waterTimesStr: r.waterTimes.join(', '),
      insightsEnabled: r.insightsEnabled ?? false,
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
    let { doseEnabled, waterEnabled, insightsEnabled } = form;

    if (doseEnabled || waterEnabled || insightsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        doseEnabled = false;
        waterEnabled = false;
        insightsEnabled = false;
        setPermissionError(true);
        setForm((f) => ({ ...f, doseEnabled: false, waterEnabled: false, insightsEnabled: false }));
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
      medication: form.medication.trim() || null,
      goalWeightKg: parseDecimalBR(form.goalWeightStr),
      waterGoalMl: parseDecimalBR(form.waterGoalStr) ?? 2000,
      calorieGoalKcal: parseDecimalBR(form.calorieGoalStr),
    });
    const reminders: ReminderSettings = {
      doseEnabled,
      waterEnabled,
      waterTimes: waterTimes.length ? waterTimes : DEFAULT_REMINDERS.waterTimes,
      insightsEnabled,
    };
    await setSetting(db, 'reminders', reminders);
    await setSetting(db, 'waterGoalAuto', form.waterGoalAuto);
    await setSetting(
      db,
      'doseIntervalDays',
      Math.max(0, Math.round(parseDecimalBR(form.doseIntervalStr) ?? 7)),
    );
    await applyWaterReminders(reminders.waterEnabled, reminders.waterTimes);
    await applyInsightsReminder(insightsEnabled);
    setSaved(true);
  }, [form]);

  return { loading, form, setField, save, saved, permissionError, autoGoalMl };
}
