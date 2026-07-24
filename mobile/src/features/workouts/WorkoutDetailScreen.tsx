import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { formatDateTimeShort } from '@/core/datetime';
import { AppText, Button, Card, Screen } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { getWorkout, setWorkoutHr, type Workout } from '@/db/workoutRepo';
import { getHealthProvider } from '@/services/health/HealthProvider';
import { ShareCard } from './ShareCard';
import { buildRouteMapImage } from './staticMap';
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
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mapUri, setMapUri] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cardRef = useRef<View>(null);

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

  async function pickPhoto() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, mediaTypes: 'images' });
      if (!res.canceled && res.assets?.[0]) setPhotoUri(res.assets[0].uri);
    } catch {
      setPhotoUri(null);
    }
  }

  async function openShare(workout: Workout) {
    setMapUri(null);
    setPhotoUri(null);
    setSharing(true);
    if (workout.route && workout.route.length > 1) {
      setMapLoading(true);
      const uri = await buildRouteMapImage(workout.route, 680, 380).catch(() => null);
      setMapUri(uri);
      setMapLoading(false);
    }
  }

  async function doShare() {
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: strings.workouts.share,
        });
      }
    } catch {
      setBusy(false);
    } finally {
      setBusy(false);
      setSharing(false);
    }
  }

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
          <Button label={strings.workouts.share} onPress={() => openShare(w)} />

          <Modal
            visible={sharing}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setSharing(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.lg,
                gap: spacing.lg,
              }}
            >
              <ShareCard ref={cardRef} workout={w} mapUri={mapUri} photoUri={photoUri} />
              <View style={{ width: '100%', maxWidth: 340, gap: spacing.sm, alignItems: 'center' }}>
                {mapLoading ? <ActivityIndicator color="#fff" /> : null}
                <View style={{ width: '100%', gap: spacing.sm }}>
                  <Button
                    label={photoUri ? strings.workouts.removePhoto : strings.workouts.addPhoto}
                    variant="secondary"
                    onPress={photoUri ? () => setPhotoUri(null) : pickPhoto}
                    disabled={busy}
                  />
                  <Button
                    label={strings.workouts.share}
                    onPress={doShare}
                    disabled={busy || mapLoading}
                  />
                  <Button
                    label={strings.common.close}
                    variant="secondary"
                    onPress={() => setSharing(false)}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
