import { Pressable } from 'react-native';
import { fonts, spacing } from '../tokens';
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
        borderRadius: 999,
        paddingVertical: spacing.sm + 5,
        paddingHorizontal: spacing.lg,
        alignItems: 'center' as const,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <AppText
        style={{
          color: isPrimary ? colors.onPrimary : colors.primary,
          fontFamily: fonts.semibold,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
