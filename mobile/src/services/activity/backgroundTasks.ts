const TASK_NAME = 'leve-hourly-health';

interface TaskManagerModule {
  defineTask(name: string, task: () => Promise<unknown>): void;
}
interface BackgroundTaskModule {
  registerTaskAsync(name: string, options?: { minimumInterval?: number }): Promise<void>;
  BackgroundTaskResult: { Success: unknown; Failed: unknown };
}

function getModules(): { tm: TaskManagerModule; bt: BackgroundTaskModule } | null {
  try {
    const tm = require('expo-task-manager') as TaskManagerModule;
    const bt = require('expo-background-task') as BackgroundTaskModule;
    if (!tm?.defineTask || !bt?.registerTaskAsync) return null;
    return { tm, bt };
  } catch {
    return null;
  }
}

const mods = getModules();

if (mods) {
  try {
    mods.tm.defineTask(TASK_NAME, async () => {
      try {
        const { db } = require('@/db/client') as typeof import('@/db/client');
        const { autoSyncIfDue } =
          require('@/services/health/healthSync') as typeof import('@/services/health/healthSync');
        const { checkMovementIfDue } =
          require('@/services/activity/movementCheck') as typeof import('@/services/activity/movementCheck');
        await autoSyncIfDue(db).catch(() => undefined);
        await checkMovementIfDue(db).catch(() => undefined);
        return mods.bt.BackgroundTaskResult.Success;
      } catch {
        return mods.bt.BackgroundTaskResult.Failed;
      }
    });
  } catch {
  }
}

export async function registerHealthBackgroundTask(): Promise<void> {
  if (!mods) return;
  try {
    await mods.bt.registerTaskAsync(TASK_NAME, { minimumInterval: 60 });
  } catch {
  }
}
