import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Footprints } from 'lucide-react-native';
import { formatDateTimeShort } from '@/core/datetime';
import { AppText, Button, EmptyState, ListRow, Screen } from '@/design/components';
import { db } from '@/db/client';
import { deleteWorkout, listWorkouts, type Workout } from '@/db/workoutRepo';
import { distanceLabel, durationLabel, paceLabel, workoutTypeLabel } from './format';
import { strings } from '@/i18n/pt-BR';

export function WorkoutsScreen() {
  const [items, setItems] = useState<Workout[]>([]);

  const load = useCallback(async () => {
    setItems(await listWorkouts(db));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <AppText variant="display">{strings.workouts.title}</AppText>
      <Button label={strings.workouts.record} onPress={() => router.push('/gravar-corrida' as never)} />
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
