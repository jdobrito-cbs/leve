import { Redirect, router, Tabs, usePathname } from 'expo-router';
import { Plus } from 'lucide-react-native';
import {
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSexSignal, setSexSignal, subscribeSex } from '@/features/profile/sexSignal';
import { db } from '@/db/client';
import { getProfile } from '@/db/profileRepo';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type SharedValue,
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

// Elipse do vidro: mais larga que alta, como o Liquid Glass das abas do iOS.
const GLASS_W = 62;
const GLASS_H = 46;

/** Vidro líquido do iOS 26 quando disponível; senão, círculo translúcido. */
function getGlassView(): ComponentType<{
  style?: object;
  glassEffectStyle?: string;
}> | null {
  try {
    const mod = require('expo-glass-effect') as {
      GlassView: ComponentType<{ style?: object; glassEffectStyle?: string }>;
      isLiquidGlassAvailable(): boolean;
    };
    return mod.isLiquidGlassAvailable() ? mod.GlassView : null;
  } catch {
    return null;
  }
}

/** Botão de aba que aceita toque E arrasto: arrastar leva o vidro junto e,
 *  ao soltar, seleciona a aba sob o dedo — como no Liquid Glass do iOS. */
function DragTabButton({
  children,
  style,
  onPress,
  dragX,
  dragging,
  onSelectX,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  dragX: SharedValue<number>;
  dragging: SharedValue<number>;
  onSelectX: (absX: number) => void;
}) {
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDeltaX(14)
      .maxDeltaY(14)
      .onEnd((_e, success) => {
        if (success && onPress) runOnJS(onPress)();
      });
    const pan = Gesture.Pan()
      .minDistance(6)
      .onStart((e) => {
        dragging.value = 1;
        dragX.value = e.absoluteX;
      })
      .onUpdate((e) => {
        dragX.value = e.absoluteX;
      })
      .onFinalize((e) => {
        if (dragging.value === 1) {
          dragging.value = 0;
          runOnJS(onSelectX)(e.absoluteX);
        }
      });
    return Gesture.Race(pan, tap);
  }, [onPress, onSelectX, dragX, dragging]);

  return (
    <GestureDetector gesture={gesture}>
      <View accessibilityRole="button" style={style}>
        {children}
      </View>
    </GestureDetector>
  );
}

/** Fundo da barra de abas: círculo de vidro que desliza até a aba ativa e,
 *  durante o arrasto, segue o dedo com leve crescimento. */
function GlassSlider({
  count,
  activeIndex,
  dragX,
  dragging,
  onWidth,
}: {
  count: number;
  activeIndex: number;
  dragX: SharedValue<number>;
  dragging: SharedValue<number>;
  onWidth: (w: number) => void;
}) {
  const { mode } = useTheme();
  const [barW, setBarW] = useState(0);
  const x = useSharedValue(-9999);
  const slot = count > 0 ? barW / count : 0;
  const Glass = useMemo(getGlassView, []);

  useEffect(() => {
    if (slot <= 0 || activeIndex < 0) return;
    const target = activeIndex * slot + slot / 2 - GLASS_W / 2;
    // Primeira medição posiciona sem animar; depois, sempre desliza com mola.
    if (x.value < -5000) x.value = target;
    else x.value = withSpring(target, { damping: 17, stiffness: 190 });
  }, [activeIndex, slot, x]);

  // Soltou o dedo → a mola parte da posição onde o vidro estava, sem pulo.
  useAnimatedReaction(
    () => dragging.value,
    (now, prev) => {
      if (prev === 1 && now === 0 && barW > 0) {
        x.value = Math.min(
          Math.max(dragX.value - GLASS_W / 2, 4),
          Math.max(4, barW - GLASS_W - 4),
        );
      }
    },
    [barW],
  );

  const slide = useAnimatedStyle(() => {
    const tx =
      dragging.value === 1 && barW > 0
        ? Math.min(
            Math.max(dragX.value - GLASS_W / 2, 4),
            Math.max(4, barW - GLASS_W - 4),
          )
        : x.value;
    return {
      transform: [
        { translateX: tx },
        { scale: withSpring(dragging.value === 1 ? 1.15 : 1, { damping: 16, stiffness: 240 }) },
      ],
    };
  });

  return (
    <View
      style={{ flex: 1 }}
      pointerEvents="none"
      onLayout={(e) => {
        setBarW(e.nativeEvent.layout.width);
        onWidth(e.nativeEvent.layout.width);
      }}
    >
      {slot > 0 && activeIndex >= 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 9,
              left: 0,
              width: GLASS_W,
              height: GLASS_H,
              borderRadius: GLASS_H / 2,
              overflow: 'hidden',
            },
            slide,
          ]}
        >
          {Glass ? (
            <Glass
              style={{ flex: 1, borderRadius: GLASS_H / 2 }}
              glassEffectStyle="clear"
            />
          ) : (
            <View
              style={{
                flex: 1,
                borderRadius: GLASS_H / 2,
                backgroundColor:
                  mode === 'light' ? 'rgba(37,99,235,0.10)' : 'rgba(148,197,255,0.14)',
                borderWidth: 1,
                borderColor:
                  mode === 'light' ? 'rgba(37,99,235,0.18)' : 'rgba(148,197,255,0.22)',
              }}
            />
          )}
        </Animated.View>
      ) : null}
    </View>
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
  // A aba Ciclo só existe para o sexo feminino; o Perfil emite o sinal
  // na hora do clique, e aqui só carregamos o valor salvo na primeira vez.
  const sexLive = useSyncExternalStore(subscribeSex, getSexSignal, getSexSignal);
  useEffect(() => {
    if (getSexSignal() !== null) return;
    getProfile(db)
      .then((p) => setSexSignal(p?.sex ?? 'nao_informar'))
      .catch(() => undefined);
  }, []);
  const cycleTab = sexLive === 'feminino';
  const visibleNames: string[] = [
    'index',
    'registrar',
    'academia',
    'progresso',
    ...(cycleTab ? ['ciclo'] : []),
    'perfil',
  ];
  // Aba ativa pela rota atual ('/' = index; '/perfil' = perfil; fora das abas = -1).
  const pathname = usePathname();
  const activeTab = pathname === '/' ? 'index' : (pathname.split('/')[1] ?? '');
  const activeIndex = visibleNames.indexOf(activeTab);
  // Arrasto do vidro: posição do dedo compartilhada entre botões e círculo.
  const dragX = useSharedValue(0);
  const dragging = useSharedValue(0);
  const [barW, setBarW] = useState(0);
  const selectByX = (absX: number) => {
    if (barW <= 0) return;
    const slot = barW / visibleNames.length;
    const idx = Math.min(visibleNames.length - 1, Math.max(0, Math.floor(absX / slot)));
    const name = visibleNames[idx];
    if (name) router.navigate((name === 'index' ? '/' : `/${name}`) as never);
  };

  if (loading) return <View />;
  if (!accepted) return <Redirect href="/onboarding" />;

  const bump = (name: TabName) => ({
    tabPress: () => setSignals((s) => ({ ...s, [name]: s[name] + 1 })),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <GlassSlider
            count={visibleNames.length}
            activeIndex={activeIndex}
            dragX={dragX}
            dragging={dragging}
            onWidth={setBarW}
          />
        ),
        tabBarButton: (p) => (
          <DragTabButton
            style={(p as { style?: StyleProp<ViewStyle> }).style}
            onPress={(p as { onPress?: () => void }).onPress}
            dragX={dragX}
            dragging={dragging}
            onSelectX={selectByX}
          >
            {(p as { children?: ReactNode }).children}
          </DragTabButton>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Em telas largas (tablet/web) o padrão vira ícone ao lado do texto,
        // o que desmonta o botão central — mantém o layout vertical sempre.
        tabBarLabelPosition: 'below-icon',
        // Fonte fixa (sem escala do sistema): rótulos ampliados estouravam as abas.
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 9 },
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
