import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { formatDateTimeShort } from '@/core/datetime';
import { AppText, Button, Card, Screen } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { getWorkout, setWorkoutCalories, setWorkoutHr, type Workout } from '@/db/workoutRepo';
import { latestWeight } from '@/db/weightRepo';
import { getHealthProvider } from '@/services/health/HealthProvider';
import { estimateWorkoutKcal } from './calories';
import {
  caloriesLabel,
  distanceLabel,
  durationLabel,
  heartRateLabel,
  paceLabel,
  speedLabel,
  workoutTypeLabel,
} from './format';
import { RouteMap } from './tracking/RouteMap';
import { strings } from '@/i18n/pt-BR';

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: '33%', alignItems: 'center', gap: 2 }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>{value}</AppText>
    </View>
  );
}

export function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [w, setW] = useState<Workout | null>(null);

  useEffect(() => {
    const n = Number(id);
    if (Number.isFinite(n)) {
      getWorkout(db, n)
        .then(setW)
        .catch(() => setW(null));
    }
  }, [id]);

  useEffect(() => {
    if (!w || w.avgHr != null) return;
    let active = true;
    (async () => {
      const end = w.endAt ? new Date(w.endAt) : new Date();
      const hr = await getHealthProvider()
        .readHeartRateWindow(new Date(w.startAt), end)
        .catch(() => null);
      if (active && hr != null && hr > 0) {
        const rounded = Math.round(hr);
        setW((prev) => (prev ? { ...prev, avgHr: rounded } : prev));
        setWorkoutHr(db, w.id, rounded).catch(() => undefined);
      }
    })();
    return () => {
      active = false;
    };
  }, [w]);

  useEffect(() => {
    if (!w || w.calories != null || !w.durationSec) return;
    let active = true;
    (async () => {
      const weight = (await latestWeight(db).catch(() => null))?.weightKg ?? 70;
      const kcal = estimateWorkoutKcal(w.type, weight, w.durationSec);
      if (active && kcal != null && kcal > 0) {
        setW((prev) => (prev ? { ...prev, calories: kcal } : prev));
        setWorkoutCalories(db, w.id, kcal).catch(() => undefined);
      }
    })();
    return () => {
      active = false;
    };
  }, [w]);

  return (
    <Screen>
      <AppText variant="display">{w ? workoutTypeLabel(w.type) : strings.workouts.title}</AppText>
      {w ? (
        <>
          <AppText variant="caption" muted>
            {formatDateTimeShort(w.startAt)}
            {w.endAt ? ` – ${formatDateTimeShort(w.endAt)}` : ''}
          </AppText>
          {w.route && w.route.length > 1 ? (
            <Card style={{ padding: 0, overflow: 'hidden', height: 260 }}>
              <RouteMap points={w.route} fit style={{ flex: 1 }} />
            </Card>
          ) : null}
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
            <Stat label={strings.workouts.distance} value={distanceLabel(w.distanceM)} />
            <Stat label={strings.workouts.duration} value={durationLabel(w.durationSec)} />
            <Stat label={strings.workouts.speed} value={speedLabel(w.distanceM, w.durationSec)} />
            <Stat label={strings.workouts.pace} value={paceLabel(w.distanceM, w.durationSec)} />
            <Stat label={strings.workouts.heartRate} value={heartRateLabel(w.avgHr)} />
            <Stat label={strings.workouts.calories} value={caloriesLabel(w.calories)} />
          </Card>
          <Button
            label={strings.workouts.share}
            onPress={() => router.push(`/compartilhar/${w.id}` as never)}
          />
        </>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
