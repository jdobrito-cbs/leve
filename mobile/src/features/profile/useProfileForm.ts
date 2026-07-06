import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { parseDecimalBR } from '@/core/text';
import { db } from '@/db/client';
import { getProfile, updateProfile } from '@/db/profileRepo';
import { getSetting, setSetting } from '@/db/settingsRepo';
import {
  DEFAULT_REMINDERS,
  ReminderSettings,
  applyWaterReminders,
  requestNotificationPermission,
} from '@/services/reminders/reminders';

export interface ProfileForm {
  name: string;
  heightStr: string;
  medication: string;
  goalWeightStr: string;
  waterGoalStr: string;
  calorieGoalStr: string;
  doseEnabled: boolean;
  waterEnabled: boolean;
  waterTimesStr: string; // 'HH:MM, HH:MM'
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  heightStr: '',
  medication: '',
  goalWeightStr: '',
  waterGoalStr: '2000',
  calorieGoalStr: '',
  doseEnabled: false,
  waterEnabled: false,
  waterTimesStr: DEFAULT_REMINDERS.waterTimes.join(', '),
};

export function useProfileForm() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const load = useCallback(async () => {
    const [profile, reminders] = await Promise.all([
      getProfile(db),
      getSetting<ReminderSettings>(db, 'reminders'),
    ]);
    const r = reminders ?? DEFAULT_REMINDERS;
    setForm({
      name: profile?.name ?? '',
      heightStr: profile?.heightCm ? String(profile.heightCm) : '',
      medication: profile?.medication ?? '',
      goalWeightStr: profile?.goalWeightKg ? String(profile.goalWeightKg) : '',
      waterGoalStr: profile?.waterGoalMl ? String(profile.waterGoalMl) : '2000',
      calorieGoalStr: profile?.calorieGoalKcal ? String(profile.calorieGoalKcal) : '',
      doseEnabled: r.doseEnabled,
      waterEnabled: r.waterEnabled,
      waterTimesStr: r.waterTimes.join(', '),
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
    let { doseEnabled, waterEnabled } = form;

    if (doseEnabled || waterEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        doseEnabled = false;
        waterEnabled = false;
        setPermissionError(true);
        setForm((f) => ({ ...f, doseEnabled: false, waterEnabled: false }));
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
    };
    await setSetting(db, 'reminders', reminders);
    await applyWaterReminders(reminders.waterEnabled, reminders.waterTimes);
    setSaved(true);
  }, [form]);

  return { loading, form, setField, save, saved, permissionError };
}
