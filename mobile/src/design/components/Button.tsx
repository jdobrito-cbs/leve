import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: isPrimary ? colors.primary : 'transparent',
            borderWidth: isPrimary ? 0 : 1,
            borderColor: colors.primary,
            borderRadius: 999,
            paddingVertical: spacing.sm + 5,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            opacity: disabled ? 0.4 : 1,
          },
          pressStyle,
        ]}
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
      </Animated.View>
    </Pressable>
  );
}
