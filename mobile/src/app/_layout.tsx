import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import {
  Component,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppText, Button, Screen } from '@/design/components';
import { db, initDb, isDbLockedError } from '@/db/client';
import { getSetting } from '@/db/settingsRepo';
import { seedFoodItemsIfEmpty } from '@/db/seed/tacoSeed';
import { setThemeSignal, type ThemeMode } from '@/design/themeSignal';
import { revalidatePartnerIfDue } from '@/features/premium/partnerServer';
import { setMascotEvent } from '@/features/today/mascotSignal';
import { autoSyncIfDue } from '@/services/health/healthSync';
import { checkMovementIfDue } from '@/services/activity/movementCheck';
import { registerHealthBackgroundTask } from '@/services/activity/backgroundTasks';
import { attachReminderMascotListeners } from '@/services/reminders/reminders';
import { strings } from '@/i18n/pt-BR';
import {
  getActiveLanguage,
  resolveAutoLanguage,
  resolveAutoMeasurement,
  setActiveLanguage,
  subscribeLanguage,
  type LanguageCode,
} from '@/i18n/engine';
import { getUnitSystem, setUnitSystem, subscribeUnits, type UnitSystem } from '@/core/units';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn('Notificações indisponíveis neste ambiente:', e);
}

class RootErrorBoundary extends Component<PropsWithChildren, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Screen>
          <AppText variant="title">{strings.common.error}</AppText>
          <AppText muted>{this.state.error.message}</AppText>
        </Screen>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stage, setStage] = useState<string>(strings.common.bootDb);
  const lang = useSyncExternalStore(subscribeLanguage, getActiveLanguage, getActiveLanguage);
  const units = useSyncExternalStore(subscribeUnits, getUnitSystem, getUnitSystem);
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const fontsReady = fontsLoaded || fontError !== null;

  const load = useCallback(() => {
    setError(null);
    setStage(strings.common.bootDb);
    console.log('[leve] iniciando banco…');
    initDb()
      .then(() => {
        console.log('[leve] banco pronto; semeando alimentos…');
        setStage(strings.common.bootSeed);
        return seedFoodItemsIfEmpty(db).catch((e) =>
          console.warn('Seed TACO falhou (busca ficará vazia):', e),
        );
      })
      .then(async () => {
        const themeMode = await getSetting<ThemeMode>(db, 'themeMode').catch(() => null);
        if (themeMode) setThemeSignal(themeMode);
        const language = await getSetting<LanguageCode | 'auto'>(db, 'language').catch(() => null);
        setActiveLanguage(language && language !== 'auto' ? language : resolveAutoLanguage());
        const units = await getSetting<UnitSystem | 'auto'>(db, 'unitSystem').catch(() => null);
        setUnitSystem(units && units !== 'auto' ? units : resolveAutoMeasurement());
        console.log('[leve] inicialização concluída');
        setReady(true);
        autoSyncIfDue(db).catch(() => undefined);
        checkMovementIfDue(db).catch(() => undefined);
        registerHealthBackgroundTask().catch(() => undefined);
        revalidatePartnerIfDue(db).catch(() => undefined);
      })
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))));
  }, []);

  useEffect(() => {
    load();
    attachReminderMascotListeners({
      onWater: () => setMascotEvent('thirsty'),
      onMeds: () => setMascotEvent('meds'),
      onDose: () => setMascotEvent('dose'),
    });
  }, [load]);

  useEffect(() => {
    if (ready || error) return;
    const timer = setTimeout(
      () => setError(new Error(`${strings.common.bootStuck}: ${stage}`)),
      20000,
    );
    return () => clearTimeout(timer);
  }, [ready, error, stage]);

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
  if (!ready || !fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" />
        <AppText variant="caption" muted>
          {stage}
        </AppText>
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootErrorBoundary>
        <Stack key={`${lang}-${units}`} screenOptions={{ headerShown: false }} />
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}
