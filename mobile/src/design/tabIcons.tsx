import { useEffect } from 'react';
import type { ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TabIconProps {
  color: ColorValue;
  focused: boolean;
  size?: number;
}

const stroke = { strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Hoje: as folhas do broto balançam como ao vento quando a aba é escolhida. */
export function SproutTabIcon({ color, focused, size = 22 }: TabIconProps) {
  const sway = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      sway.value = withSequence(
        withTiming(-11, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 5, stiffness: 150 }), // oscila até assentar
      );
    } else {
      sway.value = withTiming(0, { duration: 150 });
    }
  }, [focused, sway]);

  const leaves = useAnimatedProps(() => ({ rotation: sway.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedG animatedProps={leaves} origin="12, 21" stroke={color} {...stroke}>
        <Path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
        <Path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
      </AnimatedG>
      <Path d="M5 21h14" stroke={color} {...stroke} />
    </Svg>
  );
}

const TREND_LENGTH = 17.2; // comprimento aproximado da linha de tendência

/** Progresso: a linha do gráfico se desenha da esquerda para a direita ao focar. */
export function ChartTabIcon({ color, focused, size = 22 }: TabIconProps) {
  const offset = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      offset.value = TREND_LENGTH;
      offset.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    } else {
      offset.value = withTiming(0, { duration: 120 });
    }
  }, [focused, offset]);

  const trend = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" stroke={color} {...stroke} />
      <AnimatedPath
        d="m19 9-5 5-4-4-3 3"
        stroke={color}
        strokeDasharray={`${TREND_LENGTH}`}
        animatedProps={trend}
        {...stroke}
      />
    </Svg>
  );
}

/** Perfil: o boneco dá um mergulho rápido e volta, dentro do círculo. */
export function UserTabIcon({ color, focused, size = 22 }: TabIconProps) {
  const dip = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      dip.value = withSequence(
        withTiming(2, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 6, stiffness: 200 }),
      );
    } else {
      dip.value = withTiming(0, { duration: 150 });
    }
  }, [focused, dip]);

  const person = useAnimatedProps(() => ({ y: dip.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} {...stroke} />
      <AnimatedG animatedProps={person} stroke={color} {...stroke}>
        <Circle cx="12" cy="10" r="3" />
        <Path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
      </AnimatedG>
    </Svg>
  );
}
