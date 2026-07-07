import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../useTheme';

/**
 * Transbordo da meta de água (>100%): o box vai enchendo por trás do conteúdo,
 * com ondas na superfície. A cada +50% além da meta, o box enche por completo.
 */

const WAVE_W = 1600;
const WAVE_H = 16;
const wave =
  `M0 8 Q ${WAVE_W / 16} 0 ${WAVE_W / 8} 8 T ${WAVE_W / 4} 8 T ${(WAVE_W * 3) / 8} 8 T ${WAVE_W / 2} 8` +
  ` T ${(WAVE_W * 5) / 8} 8 T ${(WAVE_W * 3) / 4} 8 T ${(WAVE_W * 7) / 8} 8 T ${WAVE_W} 8` +
  ` L ${WAVE_W} ${WAVE_H} L 0 ${WAVE_H} Z`;

export function OverflowFill({ progress }: { progress: number }) {
  const { colors } = useTheme();
  const over = Math.max(0, progress - 1);
  const fillPct = Math.min(over / 0.5, 1) * 100; // +50% além da meta = box cheio

  const height = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(fillPct, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [fillPct, height]);

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false);
  }, [drift]);

  const fill = useAnimatedStyle(() => ({ height: `${height.value}%` }));
  const surface = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.value * (WAVE_W / 2) }],
  }));

  if (fillPct <= 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
        fill,
      ]}
    >
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, width: WAVE_W, height: WAVE_H }, surface]}
      >
        <Svg width={WAVE_W} height={WAVE_H}>
          <Path d={wave} fill={colors.success} opacity={0.22} />
        </Svg>
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          top: WAVE_H - 2,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.success,
          opacity: 0.22,
        }}
      />
    </Animated.View>
  );
}

function Drip({ side, delay }: { side: 'left' | 'right'; delay: number }) {
  const { colors } = useTheme();
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withRepeat(
      withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.in(Easing.quad) })),
      -1,
      false,
    );
  }, [fall, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: fall.value * 46 }],
    // some por completo no fim da queda (sem rastro)
    opacity: fall.value < 0.05 || fall.value > 0.92 ? 0 : 1 - fall.value * 0.85,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: '55%', [side]: -5, width: 8, height: 12 }, style]}
    >
      <Svg width={8} height={12} viewBox="0 0 8 12">
        <Path
          d="M4 0 C 5.2 3 8 5.2 8 7.8 A 4 4 0 1 1 0 7.8 C 0 5.2 2.8 3 4 0 Z"
          fill={colors.success}
        />
      </Svg>
    </Animated.View>
  );
}

/** Gotas escorrendo pelas laterais do anel quando a meta transborda. */
export function OverflowDrips({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      <Drip side="left" delay={0} />
      <Drip side="right" delay={550} />
    </>
  );
}
