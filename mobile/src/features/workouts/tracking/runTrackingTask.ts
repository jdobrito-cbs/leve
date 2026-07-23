import type { LocationObject } from 'expo-location';
import { addRunPoint } from './runStore';

export const RUN_TASK = 'leve-run-tracking';

interface TaskManagerModule {
  defineTask(name: string, task: (body: { data?: unknown; error?: unknown }) => void): void;
}

function getTaskManager(): TaskManagerModule | null {
  try {
    const tm = require('expo-task-manager') as TaskManagerModule;
    if (!tm?.defineTask) return null;
    return tm;
  } catch {
    return null;
  }
}

const tm = getTaskManager();

if (tm) {
  try {
    tm.defineTask(RUN_TASK, ({ data, error }) => {
      if (error || !data) return;
      const locations = (data as { locations?: LocationObject[] }).locations ?? [];
      for (const l of locations) {
        addRunPoint(l.coords.latitude, l.coords.longitude, l.timestamp, l.coords.accuracy);
      }
    });
  } catch {
  }
}
