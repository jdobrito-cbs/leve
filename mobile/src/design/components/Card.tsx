import { View, ViewProps } from 'react-native';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors, mode } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.md,
          shadowColor: '#000000',
          shadowOpacity: mode === 'light' ? 0.04 : 0,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: mode === 'light' ? 1 : 0,
        },
        style,
      ]}
      {...rest}
    />
  );
}
