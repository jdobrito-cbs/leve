import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/design/components';
import { useTheme } from '@/design/useTheme';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { strings } from '@/i18n/pt-BR';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <AppText style={{ opacity: focused ? 1 : 0.45 }}>{glyph}</AppText>;
}

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
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.today,
          tabBarIcon: ({ focused }) => <TabIcon glyph="🌱" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: strings.tabs.log,
          tabBarIcon: ({ focused }) => <TabIcon glyph="➕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: strings.tabs.progress,
          tabBarIcon: ({ focused }) => <TabIcon glyph="📈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ focused }) => <TabIcon glyph="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
