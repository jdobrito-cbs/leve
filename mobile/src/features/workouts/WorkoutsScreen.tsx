import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';
import { Footprints } from 'lucide-react-native';
import { formatDateTimeShort } from '@/core/datetime';
import { AppText, Button, Card, EmptyState, ListRow, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { deleteWorkout, listWorkouts, type Workout } from '@/db/workoutRepo';
import { useHealthConnection } from '@/features/health/useHealthConnection';
import { distanceLabel, durationLabel, paceLabel, workoutTypeLabel } from './format';
import { strings } from '@/i18n/pt-BR';

export function WorkoutsScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Workout[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const health = useHealthConnection();

  const load = useCallback(async () => {
    setItems(await listWorkouts(db));
    setLastSync(await getSetting<string>(db, 'lastHealthSyncAt'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = useCallback(async () => {
    await health.syncWorkouts();
    await setSetting(db, 'lastHealthSyncAt', new Date().toISOString());
    await load();
  }, [health, load]);

  const connectAndSync = useCallback(async () => {
    const ok = await health.connect();
    if (ok) await sync();
  }, [health, sync]);

  return (
    <Screen
      refreshControl={
        health.connected ? (
          <RefreshControl
            refreshing={health.importing}
            onRefresh={sync}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      <AppText variant="display">{strings.workouts.title}</AppText>

      <Button
        label={strings.workouts.record}
        onPress={() => router.push('/gravar-corrida' as never)}
      />

      {health.available ? (
        <Card style={{ gap: spacing.sm }}>
          {health.connected ? (
            <>
              <Button
                label={health.importing ? strings.workouts.syncing : strings.workouts.sync}
                variant="secondary"
                disabled={health.importing}
                onPress={sync}
              />
              <AppText variant="caption" muted>
                {lastSync
                  ? strings.workouts.lastSync.replace('{time}', formatDateTimeShort(lastSync))
                  : strings.workouts.neverSynced}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="caption" muted>
                {strings.workouts.connectHint}
              </AppText>
              <Button
                label={health.importing ? strings.workouts.syncing : strings.workouts.connect}
                disabled={health.importing}
                onPress={connectAndSync}
              />
            </>
          )}
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title={strings.workouts.empty} hint="" Icon={Footprints} />
      ) : (
        items.map((w) => (
          <ListRow
            key={w.id}
            title={workoutTypeLabel(w.type)}
            subtitle={`${distanceLabel(w.distanceM)} · ${durationLabel(w.durationSec)} · ${paceLabel(
              w.distanceM,
              w.durationSec,
            )}`}
            right={formatDateTimeShort(w.startAt)}
            onPress={() => router.push(`/treino/${w.id}` as never)}
            onDelete={async () => {
              await deleteWorkout(db, w.id);
              await load();
            }}
          />
        ))
      )}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
