import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { Component, PropsWithChildren, useCallback, useEffect, useState } from 'react';
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
// Importa no escopo global: o defineTask da tarefa horária precisa existir
// também quando o sistema acorda o app em segundo plano (partida headless).
import { registerHealthBackgroundTask } from '@/services/activity/backgroundTasks';
import { attachReminderMascotListeners } from '@/services/reminders/reminders';
import { strings } from '@/i18n/pt-BR';

// No Expo Go alguns módulos nativos não existem — não pode derrubar o app.
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

/** Mostra o erro real na tela em vez de deixar tudo em branco. */
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
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  // Fonte que falhou não pode segurar o app — segue com a fonte do sistema.
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
        // Preferência de tema salva no Perfil vale desde a abertura.
        const themeMode = await getSetting<ThemeMode>(db, 'themeMode').catch(() => null);
        if (themeMode) setThemeSignal(themeMode);
        console.log('[leve] inicialização concluída');
        setReady(true);
        // Busca automática da saúde na abertura (Premium; throttle de 1 h).
        autoSyncIfDue(db).catch(() => undefined);
        // Sem passos na última hora → aviso de levantar (mesmo ciclo de 1 h).
        checkMovementIfDue(db).catch(() => undefined);
        // Tarefa horária em segundo plano (sync + movimento) — melhor esforço.
        registerHealthBackgroundTask().catch(() => undefined);
        // Chave de parceiro do servidor: reconfere (revogação vale aqui).
        revalidatePartnerIfDue(db).catch(() => undefined);
      })
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))));
  }, []);

  useEffect(() => {
    load();
    // Avisos → mascote por 1 minuto: água → com sede; remédio de apoio →
    // hora do remédio; aplicação GLP-1 → panda da dose.
    attachReminderMascotListeners({
      onWater: () => setMascotEvent('thirsty'),
      onMeds: () => setMascotEvent('meds'),
      onDose: () => setMascotEvent('dose'),
    });
  }, [load]);

  // Vigia: travou em alguma etapa → vira erro legível em vez de spinner eterno.
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
        <Stack screenOptions={{ headerShown: false }} />
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}
