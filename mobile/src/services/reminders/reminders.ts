import * as Notifications from 'expo-notifications';
import { strings } from '@/i18n/pt-BR';

const DOSE_ID = 'dose-reminder';
const WATER_PREFIX = 'water-';
const MAX_WATER = 6;

export interface ReminderSettings {
  doseEnabled: boolean;
  waterEnabled: boolean;
  waterTimes: string[]; // 'HH:MM'
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  doseEnabled: false,
  waterEnabled: false,
  waterTimes: ['09:00', '13:00', '17:00'],
};

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await Notifications.requestPermissionsAsync();
  return result.granted === true;
}

export async function cancelDoseReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DOSE_ID);
}

/** Apoio de memória — não é orientação clínica. Só agenda datas futuras. */
export async function scheduleDoseReminder(at: Date): Promise<void> {
  await cancelDoseReminder();
  if (at.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: DOSE_ID,
    content: { title: strings.reminders.doseTitle, body: strings.reminders.doseBody },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  });
}

export async function applyWaterReminders(enabled: boolean, times: string[]): Promise<void> {
  for (let i = 0; i < MAX_WATER; i++) {
    await Notifications.cancelScheduledNotificationAsync(`${WATER_PREFIX}${i}`);
  }
  if (!enabled) return;
  const valid = times.filter((t) => /^\d{2}:\d{2}$/.test(t)).slice(0, MAX_WATER);
  for (let i = 0; i < valid.length; i++) {
    const [hour, minute] = valid[i].split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: `${WATER_PREFIX}${i}`,
      content: { title: strings.reminders.waterTitle, body: strings.reminders.waterBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
}
