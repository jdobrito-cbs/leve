import { numberLocale } from '@/i18n/engine';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';
import { spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';

export const RULER_TICK_WIDTH = 8;

export function offsetToValue(
  offset: number,
  min: number,
  max: number,
  step: number,
): number {
  const raw = min + Math.round(offset / RULER_TICK_WIDTH) * step;
  const clamped = Math.min(Math.max(raw, min), max);
  return Math.round(clamped / step) * step;
}

export function valueToOffset(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  return Math.round((clamped - min) / step) * RULER_TICK_WIDTH;
}

interface Props {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  majorEvery?: number;
  labelEvery?: number;
  decimals?: number;
}

export function ValueRuler({
  value,
  onChange,
  min,
  max,
  step,
  majorEvery = 10,
  labelEvery = 50,
  decimals = 1,
}: Props) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<number>>(null);
  const lastReported = useRef<number>(value);
  const [width, setWidth] = useState(0);

  const count = Math.round((max - min) / step) + 1;
  const ticks = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  const round = (v: number) => Number(v.toFixed(decimals));

  useEffect(() => {
    if (width === 0) return;
    if (Math.abs(value - lastReported.current) < step / 2) return;
    lastReported.current = value;
    listRef.current?.scrollToOffset({
      offset: valueToOffset(value, min, max, step),
      animated: false,
    });
  }, [value, width, min, max, step]);

  function report(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const v = round(offsetToValue(e.nativeEvent.contentOffset.x, min, max, step));
    if (Math.abs(v - lastReported.current) >= step / 2) {
      lastReported.current = v;
      onChange(v);
    }
  }

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: 84 }}>
      {width > 0 ? (
        <>
          <FlatList
            ref={listRef}
            data={ticks}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="normal"
            initialScrollIndex={Math.round(valueToOffset(value, min, max, step) / RULER_TICK_WIDTH)}
            getItemLayout={(_, index) => ({
              length: RULER_TICK_WIDTH,
              offset: RULER_TICK_WIDTH * index,
              index,
            })}
            windowSize={5}
            initialNumToRender={80}
            maxToRenderPerBatch={120}
            contentContainerStyle={{ paddingHorizontal: width / 2 }}
            onScroll={report}
            scrollEventThrottle={16}
            onMomentumScrollEnd={report}
            onScrollEndDrag={report}
            keyExtractor={(i) => String(i)}
            renderItem={({ item: i }) => {
              const isMajor = i % majorEvery === 0;
              const isLabeled = i % labelEvery === 0;
              return (
                <View
                  style={{
                    width: RULER_TICK_WIDTH,
                    height: 72,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {isLabeled ? (
                    <AppText
                      variant="caption"
                      muted
                      style={{ position: 'absolute', top: 0, width: 48, textAlign: 'center' }}
                    >
                      {round(min + i * step).toLocaleString(numberLocale())}
                    </AppText>
                  ) : null}
                  <View
                    style={{
                      width: 2,
                      height: isLabeled ? 30 : isMajor ? 22 : 12,
                      borderRadius: 1,
                      backgroundColor: isMajor ? colors.textMuted : colors.border,
                    }}
                  />
                </View>
              );
            }}
          />
          {}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: width / 2 - 1.5,
              bottom: spacing.xs,
              width: 3,
              height: 44,
              borderRadius: 2,
              backgroundColor: colors.primary,
            }}
          />
        </>
      ) : null}
    </View>
  );
}
