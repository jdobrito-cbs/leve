import { PropsWithChildren, ReactElement } from 'react';
import { RefreshControlProps, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Screen({
  children,
  refreshControl,
}: PropsWithChildren<{ refreshControl?: ReactElement<RefreshControlProps> }>) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
