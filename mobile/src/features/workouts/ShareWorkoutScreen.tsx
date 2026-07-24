import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { AppText, Button, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { db } from '@/db/client';
import { getWorkout, type Workout } from '@/db/workoutRepo';
import { ShareCard } from './ShareCard';
import { strings } from '@/i18n/pt-BR';

const MAP_TIMEOUT_MS = 8000;

export function ShareWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [w, setW] = useState<Workout | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const cardRef = useRef<View>(null);
  const mapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const n = Number(id);
    if (Number.isFinite(n)) {
      getWorkout(db, n)
        .then(setW)
        .catch(() => setW(null));
    }
  }, [id]);

  useEffect(() => {
    mapTimer.current = setTimeout(() => setMapReady(true), MAP_TIMEOUT_MS);
    return () => {
      if (mapTimer.current) clearTimeout(mapTimer.current);
    };
  }, []);

  function armMap() {
    setMapReady(false);
    if (mapTimer.current) clearTimeout(mapTimer.current);
    mapTimer.current = setTimeout(() => setMapReady(true), MAP_TIMEOUT_MS);
  }

  function mapDone() {
    if (mapTimer.current) clearTimeout(mapTimer.current);
    setMapReady(true);
  }

  async function pickPhoto() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, mediaTypes: 'images' });
      if (!res.canceled && res.assets?.[0]) {
        armMap();
        setPhotoUri(res.assets[0].uri);
      }
    } catch {
      setPhotoUri(null);
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
    }
  }

  return (
    <Screen>
      <AppText variant="display">{strings.workouts.share}</AppText>
      {w ? (
        <>
          <View style={{ alignItems: 'center' }}>
            <ShareCard ref={cardRef} workout={w} photoUri={photoUri} onMapReady={mapDone} />
          </View>
          <View style={{ gap: spacing.sm }}>
            <Button
              label={photoUri ? strings.workouts.removePhoto : strings.workouts.addPhoto}
              onPress={
                photoUri
                  ? () => {
                      armMap();
                      setPhotoUri(null);
                    }
                  : pickPhoto
              }
              disabled={busy}
            />
            <Button label={strings.workouts.share} onPress={doShare} disabled={busy || !mapReady} />
          </View>
        </>
      ) : null}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
