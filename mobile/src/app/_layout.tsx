import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AppText, Screen } from '@/design/components';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { strings } from '@/i18n/pt-BR';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (error) {
    return (
      <Screen>
        <AppText variant="title">{strings.common.error}</AppText>
        <AppText muted>{error.message}</AppText>
      </Screen>
    );
  }
  if (!success || !fontsLoaded) {
    return <View />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
