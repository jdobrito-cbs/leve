import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { parseDecimalBR } from '@/core/text';
import { db } from '@/db/client';
import { getProfile, updateProfile } from '@/db/profileRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { latestWeight } from '@/db/weightRepo';
import { waterGoalFromWeightKg } from '@/features/water/waterGoal';
import {
  DEFAULT_REMINDERS,
  ReminderSettings,
  applyInsightsReminder,
  applyWaterReminders,
  requestNotificationPermission,
} from '@/services/reminders/reminders';

export interface ProfileForm {
  name: string;
  heightStr: string;
  medication: string;
  goalWeightStr: string;
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
  heightStr: '',
  medication: '',
  goalWeightStr: '',
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
    const [profile, reminders, waterAuto, weight] = await Promise.all([
      getProfile(db),
      getSetting<ReminderSettings>(db, 'reminders'),
      getSetting<boolean>(db, 'waterGoalAuto'),
      latestWeight(db),
    ]);
    const r = reminders ?? DEFAULT_REMINDERS;
    setAutoGoalMl(weight ? waterGoalFromWeightKg(weight.weightKg) : null);
    setForm({
      name: profile?.name ?? '',
      heightStr: profile?.heightCm ? String(profile.heightCm) : '',
      medication: profile?.medication ?? '',
      goalWeightStr: profile?.goalWeightKg ? String(profile.goalWeightKg) : '',
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
    await applyWaterReminders(reminders.waterEnabled, reminders.waterTimes);
    await applyInsightsReminder(insightsEnabled);
    setSaved(true);
  }, [form]);

  return { loading, form, setField, save, saved, permissionError, autoGoalMl };
}
