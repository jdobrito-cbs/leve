import { Info } from 'lucide-react-native';
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
        borderRadius: radius.md,
        padding: spacing.sm + 4,
      }}
    >
      <Info color={colors.primary} size={16} strokeWidth={2} style={{ marginTop: 1 }} />
      <AppText variant="caption" muted style={{ flex: 1 }}>
        {strings.disclaimer.medical}
      </AppText>
    </View>
  );
}
