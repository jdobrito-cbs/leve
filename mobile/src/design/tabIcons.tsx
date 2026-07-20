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

interface TabIconProps {
  color: ColorValue;
  focused: boolean;
  signal: number;
  size?: number;
}

const stroke = { strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function SproutTabIcon({ color, focused, signal, size = 22 }: TabIconProps) {
  const sway = useSharedValue(0);

  useEffect(() => {
    if (!focused) return;
    sway.value = withSequence(
      withTiming(-14, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 4, stiffness: 140 }),
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

export function CycleTabIcon({ color, focused, signal, size = 22 }: TabIconProps) {
  const drop = useSharedValue(0);

  useEffect(() => {
    if (!focused) return;
    drop.value = withSequence(
      withTiming(-3, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 5, stiffness: 200 }),
    );
  }, [focused, signal, drop]);

  const droplet = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute', inset: 0 }, droplet]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
          <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function MuscleTabIcon({ color, focused, signal, size = 22 }: TabIconProps) {
  const pump = useSharedValue(1);

  useEffect(() => {
    if (!focused) return;
    pump.value = withSequence(
      withTiming(1.22, { duration: 130, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 5, stiffness: 180 }),
    );
  }, [focused, signal, pump]);

  const arms = useAnimatedStyle(() => ({
    transform: [{ scale: pump.value }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {}
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        style={{ position: 'absolute' }}
        {...stroke}
        strokeWidth={2.3}
      >
        <Circle cx="12" cy="4.2" r="2.4" />
        <Path d="M9 9h6l-1.1 7.2h-3.8z" />
        <Path d="M10.1 16.2 9.2 21.4M13.9 16.2l.9 5.2" />
      </Svg>
      {}
      <Animated.View style={[{ position: 'absolute', inset: 0, transformOrigin: '50% 45%' }, arms]}>
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          {...stroke}
          strokeWidth={2.3}
        >
          <Path d="M9 9.7 5.6 11.4 6.1 7.4" />
          <Path d="M15 9.7l3.4 1.7-.5-4" />
        </Svg>
      </Animated.View>
    </View>
  );
}
