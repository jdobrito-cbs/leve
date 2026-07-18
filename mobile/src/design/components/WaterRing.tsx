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
import { useWaterPhysics } from './useWaterPhysics';

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
  // Cor por status: 0–40% vermelho · 41–60% amarelo · 61–99% azul · 100%+ verde.
  const statusColor =
    clamped >= 1
      ? colors.success
      : clamped > 0.6
        ? colors.primary
        : clamped > 0.4
          ? colors.warning
          : colors.danger;

  const phase = useSharedValue(0);
  const level = useSharedValue(0);
  const ring = useSharedValue(0);
  // Física real: ângulo segue a gravidade do aparelho; boost = chacoalhão.
  const { angle, boost } = useWaterPhysics();

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

  // A água inteira gira ao contrário da inclinação do aparelho → superfície
  // sempre nivelada com o chão de verdade (rotação em volta do centro do copo).
  const tiltLayer = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-angle.value}rad` }],
  }));

  // topo da água dentro do copo: fundo quando 0, topo quando 1.
  // O boost do chacoalhão vira tremida extra nas duas camadas, dessincronizada.
  const backWave = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -phase.value * size + Math.sin(phase.value * Math.PI * 6) * boost.value * 12,
      },
      {
        translateY:
          cupSize * (1 - level.value) +
          3 +
          Math.sin(phase.value * Math.PI * 8) * boost.value * 9,
      },
    ],
  }));
  const frontWave = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -((phase.value * 1.6) % 1) * size -
          Math.sin(phase.value * Math.PI * 7) * boost.value * 12,
      },
      {
        translateY:
          cupSize * (1 - level.value) -
          Math.sin(phase.value * Math.PI * 9 + 1.3) * boost.value * 9,
      },
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
        <Animated.View
          style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, tiltLayer]}
        >
          <Animated.View style={[waveLayer, backWave]}>
            <Svg width={size * 2} height={size * 2}>
              <Path d={wave} fill={statusColor} opacity={0.22} />
            </Svg>
          </Animated.View>
          <Animated.View style={[waveLayer, frontWave]}>
            <Svg width={size * 2} height={size * 2}>
              <Path d={wave} fill={statusColor} opacity={0.3} />
            </Svg>
          </Animated.View>
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
            stroke={statusColor}
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
            stroke={statusColor}
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
