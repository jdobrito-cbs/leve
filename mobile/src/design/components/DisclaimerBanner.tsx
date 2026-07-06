import { View } from 'react-native';
import { strings } from '@/i18n/pt-BR';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

export function DisclaimerBanner() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        borderRadius: radius.sm,
        padding: spacing.sm + 4,
      }}
    >
      <AppText variant="caption">ℹ️</AppText>
      <AppText variant="caption" muted style={{ flex: 1 }}>
        {strings.disclaimer.medical}
      </AppText>
    </View>
  );
}
