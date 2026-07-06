import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Screen } from '@/design/components';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { seedFoodItemsIfEmpty } from '@/db/seed/tacoSeed';
import { strings } from '@/i18n/pt-BR';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (!success) return;
    seedFoodItemsIfEmpty(db)
      .catch((e) => console.warn('Seed TACO falhou (busca ficará vazia):', e))
      .finally(() => setSeeded(true));
  }, [success]);

  if (error) {
    return (
      <Screen>
        <AppText variant="title">{strings.common.error}</AppText>
        <AppText muted>{error.message}</AppText>
      </Screen>
    );
  }
  if (!success || !seeded || !fontsLoaded) {
    return <View />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
