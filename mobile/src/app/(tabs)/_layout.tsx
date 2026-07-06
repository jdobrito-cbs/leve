import { Redirect, Tabs } from 'expo-router';
import { ChartLine, CircleUser, Plus, Sprout } from 'lucide-react-native';
import { View } from 'react-native';
import { fonts } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { strings } from '@/i18n/pt-BR';

export default function TabsLayout() {
  const { loading, accepted } = useOnboarding();
  const { colors } = useTheme();

  if (loading) return <View />;
  if (!accepted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
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
          tabBarIcon: ({ color }) => <Plus color={color} size={22} strokeWidth={1.9} />,
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
