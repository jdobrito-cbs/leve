import { Redirect, Tabs, useSegments } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PropsWithChildren, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '@/db/client';
import { getProfile } from '@/db/profileRepo';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import {
  ChartTabIcon,
  CycleTabIcon,
  MuscleTabIcon,
  SproutTabIcon,
  UserTabIcon,
} from '@/design/tabIcons';
import { fonts } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { strings } from '@/i18n/pt-BR';

/** Pulo elástico do ícone — redisparado a cada toque na aba (via `signal`). */
function BouncyIcon({
  focused,
  signal,
  children,
}: PropsWithChildren<{ focused: boolean; signal: number }>) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 11, stiffness: 320 }),
        withSpring(1.08, { damping: 14, stiffness: 220 }),
      );
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }
  }, [focused, signal, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Botão central de Registrar: salta com mola a cada toque. */
function Fab({ focused, signal }: { focused: boolean; signal: number }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.18, { damping: 10, stiffness: 300 }),
        withSpring(1.08, { damping: 13, stiffness: 200 }),
      );
    } else {
      scale.value = withSpring(1, { damping: 13, stiffness: 200 });
    }
  }, [focused, signal, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -14,
          shadowColor: colors.primary,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        style,
      ]}
    >
      <Plus color={colors.onPrimary} size={24} strokeWidth={2.2} />
    </Animated.View>
  );
}

type TabName = 'index' | 'registrar' | 'academia' | 'progresso' | 'ciclo' | 'perfil';

export default function TabsLayout() {
  const { loading, accepted } = useOnboarding();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [signals, setSignals] = useState<Record<TabName, number>>({
    index: 0,
    registrar: 0,
    academia: 0,
    progresso: 0,
    ciclo: 0,
    perfil: 0,
  });
  // A aba Ciclo só existe para o sexo feminino; re-lê ao navegar (Perfil pode mudar).
  const segments = useSegments();
  const [cycleTab, setCycleTab] = useState(false);
  useEffect(() => {
    getProfile(db)
      .then((p) => setCycleTab(p?.sex === 'feminino'))
      .catch(() => undefined);
  }, [segments]);

  if (loading) return <View />;
  if (!accepted) return <Redirect href="/onboarding" />;

  const bump = (name: TabName) => ({
    tabPress: () => setSignals((s) => ({ ...s, [name]: s[name] + 1 })),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Em telas largas (tablet/web) o padrão vira ícone ao lado do texto,
        // o que desmonta o botão central — mantém o layout vertical sempre.
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10 },
        // Até 6 abas: zera folgas e larguras mínimas para nada vazar da tela.
        tabBarItemStyle: { paddingHorizontal: 0, marginHorizontal: 0, minWidth: 0, flex: 1 },
        tabBarIconStyle: { marginHorizontal: 0 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#1E3A8A',
          shadowOpacity: mode === 'light' ? 0.08 : 0,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          // Altura inclui o recuo do indicador de início (senão fica um vão escuro
          // abaixo da barra e ela briga com o gesto de home do iPhone).
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={bump('index')}
        options={{
          title: strings.tabs.today,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused} signal={signals.index}>
              <SproutTabIcon color={color} focused={focused} signal={signals.index} />
            </BouncyIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="registrar"
        listeners={bump('registrar')}
        options={{
          title: strings.tabs.log,
          tabBarIcon: ({ focused }) => <Fab focused={focused} signal={signals.registrar} />,
        }}
      />
      <Tabs.Screen
        name="academia"
        listeners={bump('academia')}
        options={{
          title: strings.tabs.gym,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused} signal={signals.academia}>
              <MuscleTabIcon color={color} focused={focused} signal={signals.academia} />
            </BouncyIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="progresso"
        listeners={bump('progresso')}
        options={{
          title: strings.tabs.progress,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused} signal={signals.progresso}>
              <ChartTabIcon color={color} focused={focused} signal={signals.progresso} />
            </BouncyIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="ciclo"
        listeners={bump('ciclo')}
        options={{
          href: cycleTab ? '/ciclo' : null,
          title: strings.tabs.cycle,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused} signal={signals.ciclo}>
              <CycleTabIcon color={color} focused={focused} signal={signals.ciclo} />
            </BouncyIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        listeners={bump('perfil')}
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused} signal={signals.perfil}>
              <UserTabIcon color={color} focused={focused} signal={signals.perfil} />
            </BouncyIcon>
          ),
        }}
      />
    </Tabs>
  );
}
