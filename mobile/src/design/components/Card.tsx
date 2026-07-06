import { View, ViewProps } from 'react-native';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors, mode } = useTheme();
  const isLight = mode === 'light';
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: isLight ? 0 : 1,
          borderColor: colors.border,
          shadowColor: '#1E3A8A',
          shadowOpacity: isLight ? 0.07 : 0,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: isLight ? 2 : 0,
        },
        style,
      ]}
      {...rest}
    />
  );
}
