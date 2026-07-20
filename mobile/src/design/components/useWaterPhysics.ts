import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  Easing,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface AccelSubscription {
  remove(): void;
}

interface AccelModule {
  Accelerometer: {
    setUpdateInterval(ms: number): void;
    addListener(
      cb: (data: { x: number; y: number; z: number }) => void,
    ): AccelSubscription;
  };
}

export function useWaterPhysics(): {
  angle: SharedValue<number>;
  boost: SharedValue<number>;
} {
  const angle = useSharedValue(0);
  const boost = useSharedValue(0);

  useEffect(() => {
    let sub: AccelSubscription | null = null;
    try {
      const { requireOptionalNativeModule } = require('expo-modules-core') as {
        requireOptionalNativeModule(name: string): unknown;
      };
      if (!requireOptionalNativeModule('ExponentAccelerometer')) return;
      const { Accelerometer } = require('expo-sensors') as AccelModule;
      Accelerometer.setUpdateInterval(60);
      sub = Accelerometer.addListener((d) => {
        const gx = Platform.OS === 'android' ? -d.x : d.x;
        const gy = Platform.OS === 'android' ? -d.y : d.y;
        const target = Math.max(-2.2, Math.min(2.2, Math.atan2(gx, -gy)));
        angle.value = withSpring(target, { damping: 13, stiffness: 110, mass: 0.7 });
        const excess = Math.abs(Math.hypot(d.x, d.y, d.z) - 1);
        if (excess > 0.3 && excess * 0.8 > boost.value) {
          boost.value = withSequence(
            withTiming(Math.min(1, excess * 0.8), { duration: 70 }),
            withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) }),
          );
        }
      });
    } catch {
    }
    return () => sub?.remove();
  }, [angle, boost]);

  return { angle, boost };
}
