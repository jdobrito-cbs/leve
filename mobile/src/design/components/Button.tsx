import { Pressable } from 'react-native';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: isPrimary ? colors.primary : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.lg,
        alignItems: 'center' as const,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <AppText style={{ color: isPrimary ? colors.onPrimary : colors.primary, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
