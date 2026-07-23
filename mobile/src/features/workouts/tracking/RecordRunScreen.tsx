import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';
import { AppText, Button, Card, Screen, SegmentedChips } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { upsertWorkout, type WorkoutType } from '@/db/workoutRepo';
import { distanceLabel, durationLabel, paceLabel } from '../format';
import { RouteMap } from './RouteMap';
import { useRunTracker } from './useRunTracker';
import { strings } from '@/i18n/pt-BR';

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.bold, fontSize: 20, color: colors.text }}>{value}</AppText>
    </View>
  );
}

export function RecordRunScreen() {
  const { colors } = useTheme();
  const [type, setType] = useState<WorkoutType>('run');
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const tracker = useRunTracker();
  useKeepAwake();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        let granted = perm.status === 'granted';
        if (!granted) {
          const req = await Location.requestForegroundPermissionsAsync();
          granted = req.status === 'granted';
        }
        if (!granted) return;
        const known = await Location.getLastKnownPositionAsync();
        if (active && known) {
          setCenter({ lat: known.coords.latitude, lng: known.coords.longitude });
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        if (active) setCenter(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const recording = tracker.status === 'recording';
  const paused = tracker.status === 'paused';
  const active = recording || paused;

  const typeOptions: { value: WorkoutType; label: string }[] = [
    { value: 'run', label: strings.workouts.run },
    { value: 'walk', label: strings.workouts.walk },
  ];

  async function finish() {
    const r = await tracker.stop();
    if (r.durationSec > 0 || r.route.length > 0) {
      await upsertWorkout(db, {
        source: 'gps',
        externalId: null,
        type,
        startAt: r.startAt,
        endAt: r.endAt,
        durationSec: r.durationSec,
        distanceM: r.distanceM > 0 ? r.distanceM : null,
        calories: null,
        route: r.route.length > 0 ? r.route : null,
      });
    }
    router.replace('/treinos' as never);
  }

  return (
    <Screen>
      <AppText variant="display">{strings.workouts.record}</AppText>
      {!active ? (
        <SegmentedChips options={typeOptions} value={type} onChange={setType} />
      ) : null}

      <Card style={{ padding: 0, overflow: 'hidden', height: 280 }}>
        <RouteMap points={tracker.points} center={center} style={{ flex: 1 }} />
      </Card>

      <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Stat label={strings.workouts.duration} value={durationLabel(tracker.elapsedSec)} />
        <Stat label={strings.workouts.distance} value={distanceLabel(tracker.distanceM)} />
        <Stat
          label={strings.workouts.pace}
          value={paceLabel(tracker.distanceM, tracker.elapsedSec)}
        />
      </Card>

      {tracker.error ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {tracker.error === 'permission'
            ? strings.workouts.permissionDenied
            : strings.workouts.startFailed}
        </AppText>
      ) : null}

      {!active ? (
        <Button
          label={tracker.starting ? strings.workouts.starting : strings.workouts.start}
          disabled={tracker.starting}
          onPress={tracker.start}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {recording ? (
            <Button label={strings.workouts.pause} variant="secondary" onPress={tracker.pause} />
          ) : (
            <Button label={strings.workouts.resume} variant="secondary" onPress={tracker.resume} />
          )}
          <Button label={strings.workouts.finish} onPress={finish} />
        </View>
      )}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
