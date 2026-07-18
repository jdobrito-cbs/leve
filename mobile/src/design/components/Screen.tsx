import { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Screen({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
