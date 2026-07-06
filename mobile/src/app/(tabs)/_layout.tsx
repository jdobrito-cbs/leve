import { Redirect, Tabs } from 'expo-router';
import { ChartLine, CircleUser, Plus, Sprout } from 'lucide-react-native';
import { View } from 'react-native';
import { fonts } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { strings } from '@/i18n/pt-BR';

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
          tabBarIcon: ({ color }) => <Sprout color={color} size={22} strokeWidth={1.9} />,
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: strings.tabs.log,
          tabBarIcon: () => (
            <View
              style={{
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
              }}
            >
              <Plus color={colors.onPrimary} size={24} strokeWidth={2.2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: strings.tabs.progress,
          tabBarIcon: ({ color }) => <ChartLine color={color} size={22} strokeWidth={1.9} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ color }) => <CircleUser color={color} size={22} strokeWidth={1.9} />,
        }}
      />
    </Tabs>
  );
}
