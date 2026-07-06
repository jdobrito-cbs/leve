import { View, ViewProps } from 'react-native';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        style,
      ]}
      {...rest}
    />
  );
}
