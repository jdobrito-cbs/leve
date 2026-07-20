import * as Notifications from 'expo-notifications';
import { strings } from '@/i18n/pt-BR';

const DOSE_ID = 'dose-reminder';
const WATER_PREFIX = 'water-';
const MAX_WATER = 6;

export interface ReminderSettings {
  doseEnabled: boolean;
  waterEnabled: boolean;
  waterTimes: string[];
  insightsEnabled?: boolean;
  appointmentsEnabled?: boolean;
  medsEnabled?: boolean;
  sleepEnabled?: boolean;
  sleepTime?: string;
  sleepAuto?: boolean;
  wakeEnabled?: boolean;
  wakeTime?: string;
  wakeAuto?: boolean;
  movementEnabled?: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  doseEnabled: false,
  waterEnabled: false,
  waterTimes: ['09:00', '13:00', '17:00', '21:00'],
  insightsEnabled: false,
  appointmentsEnabled: false,
  medsEnabled: true,
  sleepEnabled: false,
  sleepAuto: true,
  wakeEnabled: false,
  wakeAuto: true,
  movementEnabled: false,
};

const INSIGHTS_ID = 'insights-daily';
const MED_PREFIX = 'med-';
const MAX_MED_SLOTS = 40;

async function safely(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (e) {
    console.warn('Lembretes indisponíveis neste ambiente:', e);
  }
}

export function attachReminderMascotListeners(handlers: {
  onWater: () => void;
  onMeds: () => void;
  onDose: () => void;
}): void {
  const dispatch = (identifier: string) => {
    if (identifier.startsWith(WATER_PREFIX)) handlers.onWater();
    else if (identifier.startsWith(MED_PREFIX)) handlers.onMeds();
    else if (identifier === DOSE_ID) handlers.onDose();
  };
  try {
    Notifications.addNotificationReceivedListener((n) => dispatch(n.request.identifier));
    Notifications.addNotificationResponseReceivedListener((r) =>
      dispatch(r.notification.request.identifier),
    );
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (!r) return;
        const raw = r.notification.date;
        const ts = raw > 1e12 ? raw : raw * 1000;
        if (Date.now() - ts < 10 * 60 * 1000) dispatch(r.notification.request.identifier);
      })
      .catch(() => undefined);
  } catch (e) {
    console.warn('Lembretes indisponíveis neste ambiente:', e);
  }
}

export async function applyMedicationReminders(
  enabled: boolean,
  meds: { id: number; name: string; doseText: string | null; times: string[] }[],
): Promise<void> {
  await safely(async () => {
    for (let i = 0; i < MAX_MED_SLOTS; i++) {
      await Notifications.cancelScheduledNotificationAsync(`${MED_PREFIX}${i}`);
    }
    if (!enabled) return;
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

const SLEEP_ID = 'sleep-reminder';
const MORNING_ID = 'water-morning';
const MOVE_ID = 'movement-alert';

export async function applySleepReminder(enabled: boolean, time: string | undefined): Promise<void> {
  await safely(async () => {
    await Notifications.cancelScheduledNotificationAsync(SLEEP_ID);
    if (!enabled || !time || !/^\d{2}:\d{2}$/.test(time)) return;
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: SLEEP_ID,
      content: { title: strings.reminders.sleepTitle, body: strings.reminders.sleepBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  });
}

export async function applyMorningWaterReminder(
  enabled: boolean,
  time: string | undefined,
): Promise<void> {
  await safely(async () => {
    await Notifications.cancelScheduledNotificationAsync(MORNING_ID);
    if (!enabled || !time || !/^\d{2}:\d{2}$/.test(time)) return;
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: MORNING_ID,
      content: { title: strings.reminders.morningTitle, body: strings.reminders.morningBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  });
}

export async function sendMovementAlert(): Promise<void> {
  await safely(async () => {
    await Notifications.scheduleNotificationAsync({
      identifier: MOVE_ID,
      content: { title: strings.reminders.moveTitle, body: strings.reminders.moveBody },
      trigger: null,
    });
  });
}

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

const APPT_PREFIX = 'appt-';
const MAX_APPT_SLOTS = 80;

const APPT_OFFSETS_H = [3, 2, 1];

export async function applyAppointmentReminders(
  enabled: boolean,
  appts: { id: number; place: string; specialty: string; scheduledAt: string }[],
): Promise<void> {
  await safely(async () => {
    for (let i = 0; i < MAX_APPT_SLOTS; i++) {
      await Notifications.cancelScheduledNotificationAsync(`${APPT_PREFIX}${i}`);
    }
    if (!enabled) return;
    let slot = 0;
    const now = Date.now();
    for (const appt of appts) {
      const at = new Date(appt.scheduledAt);
      const body = `${appt.specialty} · ${appt.place}`;
      const dayStart = new Date(at);
      dayStart.setHours(8, 0, 0, 0);
      const moments = [
        { date: dayStart, title: strings.reminders.apptTodayTitle },
        ...APPT_OFFSETS_H.map((h) => ({
          date: new Date(at.getTime() - h * 3600 * 1000),
          title: strings.reminders.apptSoonTitle.replace('{h}', String(h)),
        })),
      ];
      for (const m of moments) {
        if (slot >= MAX_APPT_SLOTS) break;
        if (m.date.getTime() <= now || m.date.getTime() > at.getTime()) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `${APPT_PREFIX}${slot++}`,
          content: { title: m.title, body },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: m.date },
        });
      }
    }
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
