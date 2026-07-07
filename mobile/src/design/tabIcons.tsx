import { useEffect } from 'react';
import { View, type ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Ícones da tab bar com movimento interno real, em todas as plataformas:
 * as camadas móveis são Views animadas (transformações de layout), não SVG
 * interno — por isso funcionam igual no nativo e na web.
 * `signal` muda a cada toque na aba e redispara a animação, mesmo com a aba já ativa.
 */

interface TabIconProps {
  color: ColorValue;
  focused: boolean;
  signal: number;
  size?: number;
}

const stroke = { strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Hoje: as folhas balançam como ao vento (o chão fica firme). */
export function SproutTabIcon({ color, focused, signal, size = 22 }: TabIconProps) {
  const sway = useSharedValue(0);

  useEffect(() => {
    if (!focused) return;
    sway.value = withSequence(
      withTiming(-14, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 4, stiffness: 140 }), // oscila várias vezes até assentar
    );
  }, [focused, signal, sway]);

  const leaves = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          { position: 'absolute', inset: 0, transformOrigin: '50% 100%' },
          leaves,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
          <Path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
          <Path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
        </Svg>
      </Animated.View>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        style={{ position: 'absolute' }}
        {...stroke}
      >
        <Path d="M5 21h14" />
      </Svg>
    </View>
  );
}

/** Progresso: a linha de tendência se desenha da esquerda para a direita. */
export function ChartTabIcon({ color, focused, signal, size = 22 }: TabIconProps) {
  const reveal = useSharedValue(size);

  useEffect(() => {
    if (!focused) return;
    reveal.value = 0;
    reveal.value = withTiming(size, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [focused, signal, reveal, size]);

  const mask = useAnimatedStyle(() => ({ width: reveal.value }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        style={{ position: 'absolute' }}
        {...stroke}
      >
        <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', height: size, overflow: 'hidden' }, mask]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
          <Path d="m19 9-5 5-4-4-3 3" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Perfil: o boneco dá um mergulho rápido e volta, dentro do círculo parado. */
export function UserTabIcon({ color, focused, signal, size = 22 }: TabIconProps) {
  const dip = useSharedValue(0);

  useEffect(() => {
    if (!focused) return;
    dip.value = withSequence(
      withTiming(2.4, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 5, stiffness: 190 }),
    );
  }, [focused, signal, dip]);

  const person = useAnimatedStyle(() => ({
    transform: [{ translateY: dip.value }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        style={{ position: 'absolute' }}
        {...stroke}
      >
        <Circle cx="12" cy="12" r="10" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', inset: 0 }, person]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
          <Circle cx="12" cy="10" r="3" />
          <Path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </Svg>
      </Animated.View>
    </View>
  );
}
