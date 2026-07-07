import { PropsWithChildren, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Path } from 'react-native-svg';
import { useTheme } from '../useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props extends PropsWithChildren {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
}

/** Onda de dois períodos com linha de base em y=0 (deslocada via props x/y animadas). */
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
 * Anel de água do Leve: o nível do líquido sobe até o progresso da meta e as
 * ondas se movem continuamente, como água num copo.
 */
export function WaterRing({ progress, size = 148, strokeWidth = 12, children }: Props) {
  const { colors } = useTheme();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const inner = r - strokeWidth / 2 - 2; // raio do "copo"
  const cx = size / 2;
  const clamped = Math.min(Math.max(progress, 0), 1);

  const phase = useSharedValue(0);
  const level = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [phase]);

  useEffect(() => {
    level.value = withTiming(clamped, { duration: 1100, easing: Easing.out(Easing.cubic) });
    ring.value = withTiming(clamped, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [clamped, level, ring]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ring.value),
  }));
  // topo da água: fundo do copo quando 0, topo quando 1
  const backWave = useAnimatedProps(() => ({
    x: -phase.value * size,
    y: cx + inner - 2 * inner * level.value + 3,
  }));
  const frontWave = useAnimatedProps(() => ({
    x: -((phase.value * 1.6) % 1) * size,
    y: cx + inner - 2 * inner * level.value,
  }));

  const wave = wavePath(size * 2, size * 2, 5);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <ClipPath id="cup">
            <Circle cx={cx} cy={cx} r={inner} />
          </ClipPath>
        </Defs>
        <AnimatedPath
          d={wave}
          fill={colors.primarySoft}
          animatedProps={backWave}
          clipPath="url(#cup)"
        />
        <AnimatedPath
          d={wave}
          fill={colors.primary}
          opacity={0.28}
          animatedProps={frontWave}
          clipPath="url(#cup)"
        />
      </Svg>
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
      </Svg>
      <View style={{ alignItems: 'center', zIndex: 2, elevation: 2 }}>{children}</View>
    </View>
  );
}
