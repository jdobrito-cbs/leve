import { PropsWithChildren, useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props extends PropsWithChildren {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
}

/** Onda de dois períodos com linha de base em y=0. */
function wavePath(width: number, height: number, amplitude: number): string {
  const half = width / 2;
  const q = half / 4;
  return (
    `M0 0 Q ${q} ${-amplitude} ${half / 2} 0 T ${half} 0` +
    ` T ${half + half / 2} 0 T ${width} 0` +
    ` L ${width} ${height} L 0 ${height} Z`
  );
}

/**
 * Anel de água do Leve: o nível sobe até o progresso da meta e as ondas se
 * movem continuamente. As ondas são camadas de View animadas dentro de um
 * recorte circular (borderRadius + overflow hidden) — funciona em nativo e web.
 */
export function WaterRing({ progress, size = 148, strokeWidth = 12, children }: Props) {
  const { colors } = useTheme();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const inner = r - strokeWidth / 2 - 2; // raio do "copo"
  const cx = size / 2;
  const cupSize = inner * 2;
  const clamped = Math.min(Math.max(progress, 0), 1);

  const phase = useSharedValue(0);
  const level = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.linear }), -1, false);
  }, [phase]);

  useEffect(() => {
    level.value = withTiming(clamped, { duration: 1100, easing: Easing.out(Easing.cubic) });
    ring.value = withTiming(clamped, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [clamped, level, ring]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ring.value),
  }));

  // topo da água dentro do copo: fundo quando 0, topo quando 1
  const backWave = useAnimatedStyle(() => ({
    transform: [
      { translateX: -phase.value * size },
      { translateY: cupSize * (1 - level.value) + 3 },
    ],
  }));
  const frontWave = useAnimatedStyle(() => ({
    transform: [
      { translateX: -((phase.value * 1.6) % 1) * size },
      { translateY: cupSize * (1 - level.value) },
    ],
  }));

  const wave = wavePath(size * 2, size * 2, 5);
  const waveLayer = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: size * 2,
    height: size * 2,
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          left: cx - inner,
          top: cx - inner,
          width: cupSize,
          height: cupSize,
          borderRadius: inner,
          overflow: 'hidden',
        }}
      >
        <Animated.View style={[waveLayer, backWave]}>
          <Svg width={size * 2} height={size * 2}>
            <Path d={wave} fill={colors.primarySoft} />
          </Svg>
        </Animated.View>
        <Animated.View style={[waveLayer, frontWave]}>
          <Svg width={size * 2} height={size * 2}>
            <Path d={wave} fill={colors.primary} opacity={0.28} />
          </Svg>
        </Animated.View>
      </View>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={colors.primarySoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {Platform.OS === 'web' ? (
          <Circle
            cx={cx}
            cy={cx}
            r={r}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            strokeLinecap="round"
          />
        ) : (
          <AnimatedCircle
            cx={cx}
            cy={cx}
            r={r}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeLinecap="round"
            animatedProps={ringProps}
          />
        )}
      </Svg>
      <View style={{ alignItems: 'center', zIndex: 2, elevation: 2 }}>{children}</View>
    </View>
  );
}
