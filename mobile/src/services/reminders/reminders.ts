import * as Notifications from 'expo-notifications';
import { strings } from '@/i18n/pt-BR';

const DOSE_ID = 'dose-reminder';
const WATER_PREFIX = 'water-';
const MAX_WATER = 6;

export interface ReminderSettings {
  doseEnabled: boolean;
  waterEnabled: boolean;
  waterTimes: string[]; // 'HH:MM'
  insightsEnabled?: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  doseEnabled: false,
  waterEnabled: false,
  waterTimes: ['09:00', '13:00', '17:00', '21:00'],
  insightsEnabled: false,
};

const INSIGHTS_ID = 'insights-daily';
const MED_PREFIX = 'med-';
const MAX_MED_SLOTS = 40;

/**
 * No Expo Go (Android) o módulo de notificações não existe — agendar falharia.
 * Nenhum lembrete pode derrubar a ação do usuário (salvar perfil, dose etc.).
 */
async function safely(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (e) {
    console.warn('Lembretes indisponíveis neste ambiente:', e);
  }
}

/** Reagenda os lembretes DAILY de todos os remédios ativos (apoio de memória). */
export async function applyMedicationReminders(
  meds: Array<{ id: number; name: string; doseText: string | null; times: string[] }>,
): Promise<void> {
  await safely(async () => {
    for (let i = 0; i < MAX_MED_SLOTS; i++) {
      await Notifications.cancelScheduledNotificationAsync(`${MED_PREFIX}${i}`);
    }
    let slot = 0;
    for (const med of meds) {
      for (const time of med.times) {
        if (slot >= MAX_MED_SLOTS || !/^\d{2}:\d{2}$/.test(time)) continue;
        const [hour, minute] = time.split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
          identifier: `${MED_PREFIX}${slot++}`,
          content: {
            title: strings.reminders.medTitle,
            body: `${med.name}${med.doseText ? ` — ${med.doseText}` : ''}`,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
        });
      }
    }
  });
}

/** Resumo diário neutro (a análise roda ao abrir o app; sem processamento em background). */
export async function applyInsightsReminder(enabled: boolean): Promise<void> {
  await safely(async () => {
    await Notifications.cancelScheduledNotificationAsync(INSIGHTS_ID);
    if (!enabled) return;
    await Notifications.scheduleNotificationAsync({
      identifier: INSIGHTS_ID,
      content: { title: strings.reminders.insightsTitle, body: strings.reminders.insightsBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
    });
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const result = await Notifications.requestPermissionsAsync();
    return result.granted === true;
  } catch (e) {
    console.warn('Permissão de notificação indisponível neste ambiente:', e);
    return false;
  }
}

export async function cancelDoseReminder(): Promise<void> {
  await safely(() => Notifications.cancelScheduledNotificationAsync(DOSE_ID));
}

/** Apoio de memória — não é orientação clínica. Só agenda datas futuras. */
export async function scheduleDoseReminder(at: Date): Promise<void> {
  await safely(async () => {
    await Notifications.cancelScheduledNotificationAsync(DOSE_ID);
    if (at.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: DOSE_ID,
      content: { title: strings.reminders.doseTitle, body: strings.reminders.doseBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  });
}

export async function applyWaterReminders(enabled: boolean, times: string[]): Promise<void> {
  await safely(async () => {
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
  });
}
