import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Screen } from '@/design/components';
import { db, initDb, isDbLockedError } from '@/db/client';
import { seedFoodItemsIfEmpty } from '@/db/seed/tacoSeed';
import { strings } from '@/i18n/pt-BR';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const load = useCallback(() => {
    setError(null);
    initDb()
      .then(() =>
        seedFoodItemsIfEmpty(db).catch((e) =>
          console.warn('Seed TACO falhou (busca ficará vazia):', e),
        ),
      )
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    const locked = isDbLockedError(error);
    return (
      <Screen>
        <AppText variant="title">
          {locked ? strings.common.dbLockedTitle : strings.common.error}
        </AppText>
        <AppText muted>{locked ? strings.common.dbLockedBody : error.message}</AppText>
        <Button label={strings.common.retry} onPress={load} />
      </Screen>
    );
  }
  if (!ready || !fontsLoaded) {
    return <View />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
