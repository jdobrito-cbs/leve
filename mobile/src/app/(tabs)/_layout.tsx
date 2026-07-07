import { Redirect, Tabs } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { ChartTabIcon, SproutTabIcon, UserTabIcon } from '@/design/tabIcons';
import { fonts } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { strings } from '@/i18n/pt-BR';

/** Ícone de aba com "pulo" elástico ao ganhar foco. */
function BouncyIcon({ focused, children }: PropsWithChildren<{ focused: boolean }>) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = focused
      ? withSequence(
          withSpring(1.25, { damping: 11, stiffness: 320 }),
          withSpring(1.08, { damping: 14, stiffness: 220 }),
        )
      : withSpring(1, { damping: 14, stiffness: 220 });
  }, [focused, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Botão central de Registrar: cresce com mola quando ativo. */
function Fab({ focused }: { focused: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = focused
      ? withSequence(
          withSpring(1.18, { damping: 10, stiffness: 300 }),
          withSpring(1.08, { damping: 13, stiffness: 200 }),
        )
      : withSpring(1, { damping: 13, stiffness: 200 });
  }, [focused, scale]);

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

export default function TabsLayout() {
  const { loading, accepted } = useOnboarding();
  const { colors, mode } = useTheme();

  if (loading) return <View />;
  if (!accepted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#1E3A8A',
          shadowOpacity: mode === 'light' ? 0.08 : 0,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          height: 62,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.today,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused}>
              <SproutTabIcon color={color} focused={focused} />
            </BouncyIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: strings.tabs.log,
          tabBarIcon: ({ focused }) => <Fab focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: strings.tabs.progress,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused}>
              <ChartTabIcon color={color} focused={focused} />
            </BouncyIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <BouncyIcon focused={focused}>
              <UserTabIcon color={color} focused={focused} />
            </BouncyIcon>
          ),
        }}
      />
    </Tabs>
  );
}
