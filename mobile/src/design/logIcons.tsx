import {
  CalendarHeart,
  ClipboardList,
  Footprints,
  PersonStanding,
  Pill,
  Syringe,
  Weight,
} from 'lucide-react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from './useTheme';

/**
 * Ícones do Registrar em movimento contínuo, cada um com uma coreografia que
 * conta o que ele faz. Camadas de View animadas (funciona em nativo e web).
 */

const SIZE = 20;
const stroke = { strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

interface IconProps {
  size?: number;
}

/** Água: o copo inclina como se fosse derramar e a água chacoalha dentro. */
export function WaterGlassIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const tilt = useSharedValue(0);
  const slosh = useSharedValue(0);

  useEffect(() => {
    tilt.value = withRepeat(
      withSequence(
        withDelay(900, withTiming(-18, { duration: 500, easing: Easing.inOut(Easing.quad) })),
        withTiming(-18, { duration: 300 }), // segura o "derramar"
        withSpring(0, { damping: 6, stiffness: 140 }),
        withTiming(0, { duration: 700 }),
      ),
      -1,
    );
    slosh.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [tilt, slosh]);

  const glass = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tilt.value}deg` }],
  }));
  const water = useAnimatedStyle(() => ({
    transform: [{ translateX: slosh.value * 1.6 - 0.8 }, { rotate: `${-tilt.value * 0.4}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, transformOrigin: '70% 100%' }, glass]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.primary} {...stroke}>
        <Path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', inset: 0 }, water]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.primary} {...stroke}>
          <Path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Refeição: garfo e faca se cruzam num X e voltam. */
export function UtensilsCrossIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const cross = useSharedValue(0);

  useEffect(() => {
    cross.value = withRepeat(
      withSequence(
        withDelay(1100, withSpring(1, { damping: 9, stiffness: 160 })),
        withTiming(1, { duration: 500 }),
        withSpring(0, { damping: 9, stiffness: 160 }),
        withTiming(0, { duration: 800 }),
      ),
      -1,
    );
  }, [cross]);

  const fork = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cross.value * 30}deg` }],
  }));
  const knife = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cross.value * -30}deg` }],
  }));

  return (
    <Animated.View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute', inset: 0, transformOrigin: '50% 55%' }, fork]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.primary} {...stroke}>
          <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <Path d="M7 2v20" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', inset: 0, transformOrigin: '50% 55%' }, knife]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.primary} {...stroke}>
          <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Dose: a seringa avança e recua, como aplicando a injeção. */
export function SyringeInjectIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const press = useSharedValue(0);

  useEffect(() => {
    press.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1, { duration: 260, easing: Easing.in(Easing.quad) })),
        withTiming(1, { duration: 220 }),
        withTiming(0, { duration: 550, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 600 }),
      ),
      -1,
    );
  }, [press]);

  const inject = useAnimatedStyle(() => ({
    transform: [{ translateX: -press.value * 2.6 }, { translateY: press.value * 2.6 }],
  }));

  return (
    <Animated.View style={inject}>
      <Syringe color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}

/** Peso: cai de cima e assenta quicando — o peso descendo. */
export function WeightDropIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const drop = useSharedValue(0);

  useEffect(() => {
    drop.value = withRepeat(
      withSequence(
        withTiming(-9, { duration: 1 }),
        withTiming(-9, { duration: 500 }),
        withSpring(0, { damping: 6, stiffness: 260 }),
        withTiming(0, { duration: 1300 }),
      ),
      -1,
    );
  }, [drop]);

  const falling = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }],
    opacity: drop.value < -6 ? 0.25 : 1,
  }));

  return (
    <Animated.View style={falling}>
      <Weight color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}

/** Sintoma: a prancheta balança em traços curtos, como quem escreve. */
export function NotesWritingIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const pen = useSharedValue(0);

  useEffect(() => {
    const strokeMove = (to: number) => withTiming(to, { duration: 120, easing: Easing.inOut(Easing.quad) });
    pen.value = withRepeat(
      withSequence(
        withDelay(1000, strokeMove(1)),
        strokeMove(-1),
        strokeMove(1),
        strokeMove(-1),
        strokeMove(0),
        withTiming(0, { duration: 900 }),
      ),
      -1,
    );
  }, [pen]);

  const writing = useAnimatedStyle(() => ({
    transform: [{ translateX: pen.value * 1.1 }, { rotate: `${pen.value * 3}deg` }],
  }));

  return (
    <Animated.View style={[{ transformOrigin: '50% 90%' }, writing]}>
      <ClipboardList color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}

/** Composição corporal: o boneco dança pé de chinelo, gingando de um lado a outro. */
export function BodyDanceIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const groove = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    groove.value = withRepeat(
      withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    bob.value = withRepeat(
      withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [groove, bob]);

  const dance = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${groove.value * 20 - 10}deg` },
      { translateY: bob.value * 1.4 },
    ],
  }));

  return (
    <Animated.View style={[{ transformOrigin: '50% 85%' }, dance]}>
      <PersonStanding color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}

/** Remédios: a pílula rola de um lado para o outro, como na palma da mão. */
export function PillRollIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const roll = useSharedValue(0);

  useEffect(() => {
    roll.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(24, { duration: 320, easing: Easing.inOut(Easing.quad) })),
        withSpring(-16, { damping: 7, stiffness: 160 }),
        withSpring(0, { damping: 8, stiffness: 160 }),
        withTiming(0, { duration: 900 }),
      ),
      -1,
    );
  }, [roll]);

  const rolling = useAnimatedStyle(() => ({
    transform: [{ rotate: `${roll.value}deg` }],
  }));

  return (
    <Animated.View style={rolling}>
      <Pill color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}

/** Passos: ritmo de caminhada — um passinho para cada lado, sem parar. */
export function FootprintsWalkIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const step = useSharedValue(0);

  useEffect(() => {
    const beat = (to: number) =>
      withTiming(to, { duration: 200, easing: Easing.inOut(Easing.quad) });
    step.value = withRepeat(
      withSequence(beat(1), beat(0), beat(-1), beat(0), withTiming(0, { duration: 500 })),
      -1,
    );
  }, [step]);

  const walking = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.abs(step.value) * 1.6 },
      { rotate: `${step.value * 7}deg` },
    ],
  }));

  return (
    <Animated.View style={walking}>
      <Footprints color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}

/** Ciclo: o coração do calendário pulsa como batimento. */
export function CycleHeartIcon({ size = SIZE }: IconProps) {
  const { colors } = useTheme();
  const beat = useSharedValue(0);

  useEffect(() => {
    beat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 160 }),
        withTiming(0.7, { duration: 120 }),
        withTiming(0, { duration: 180 }),
        withTiming(0, { duration: 900 }),
      ),
      -1,
    );
  }, [beat]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + beat.value * 0.14 }],
  }));

  return (
    <Animated.View style={pulse}>
      <CalendarHeart color={colors.primary} size={size} strokeWidth={1.9} />
    </Animated.View>
  );
}
