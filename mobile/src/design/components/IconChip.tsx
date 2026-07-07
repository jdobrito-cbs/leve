import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../useTheme';

interface Props {
  Icon: LucideIcon;
  size?: number;
  /** Quando este valor muda, o chip dá uma sacudidinha (dado atualizado). */
  wiggleKey?: string | number;
}

/**
 * Ícone flat dentro de um chip arredondado — motivo visual do Leve.
 * Nasce com um pop de mola e sacode quando o dado que representa muda.
 */
export function IconChip({ Icon, size = 40, wiggleKey }: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(0.4);
  const tilt = useSharedValue(0);
  const firstRender = useRef(true);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 11, stiffness: 220 });
  }, [scale]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    tilt.value = withSequence(
      withTiming(-12, { duration: 90 }),
      withSpring(0, { damping: 5, stiffness: 200 }),
    );
    scale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
  }, [wiggleKey, scale, tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.35,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon color={colors.primary} size={size * 0.5} strokeWidth={1.9} />
    </Animated.View>
  );
}
