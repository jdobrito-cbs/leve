import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';
import { AppText } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';

export const RULER_TICK_WIDTH = 8;
export const RULER_STEP = 0.1;
export const RULER_MIN_KG = 30;
export const RULER_MAX_KG = 250;

export function offsetToKg(offset: number, minKg = RULER_MIN_KG): number {
  const kg = minKg + Math.round(offset / RULER_TICK_WIDTH) * RULER_STEP;
  return Math.round(Math.min(Math.max(kg, minKg), RULER_MAX_KG) * 10) / 10;
}

export function kgToOffset(kg: number, minKg = RULER_MIN_KG): number {
  const clamped = Math.min(Math.max(kg, minKg), RULER_MAX_KG);
  return Math.round((clamped - minKg) / RULER_STEP) * RULER_TICK_WIDTH;
}

interface Props {
  valueKg: number;
  onChange: (kg: number) => void;
}

/** Régua rolante de peso: arraste para escolher de 0,1 em 0,1 kg. */
export function WeightRuler({ valueKg, onChange }: Props) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<number>>(null);
  const lastReported = useRef<number>(valueKg);
  const [width, setWidth] = useState(0);

  const count = Math.round((RULER_MAX_KG - RULER_MIN_KG) / RULER_STEP) + 1;
  const ticks = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  // Valor digitado no campo move a régua (sem eco do próprio arrasto).
  useEffect(() => {
    if (width === 0) return;
    if (Math.abs(valueKg - lastReported.current) < RULER_STEP / 2) return;
    lastReported.current = valueKg;
    listRef.current?.scrollToOffset({ offset: kgToOffset(valueKg), animated: false });
  }, [valueKg, width]);

  function report(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const kg = offsetToKg(e.nativeEvent.contentOffset.x);
    if (Math.abs(kg - lastReported.current) >= RULER_STEP / 2) {
      lastReported.current = kg;
      onChange(kg);
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
            snapToInterval={RULER_TICK_WIDTH}
            decelerationRate="fast"
            initialScrollIndex={Math.round(kgToOffset(valueKg) / RULER_TICK_WIDTH)}
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
            scrollEventThrottle={32}
            onMomentumScrollEnd={report}
            onScrollEndDrag={report}
            keyExtractor={(i) => String(i)}
            renderItem={({ item: i }) => {
              const isKg = i % 10 === 0;
              const isFiveKg = i % 50 === 0;
              return (
                <View
                  style={{
                    width: RULER_TICK_WIDTH,
                    height: 72,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {isFiveKg ? (
                    <AppText
                      variant="caption"
                      muted
                      style={{ position: 'absolute', top: 0, width: 40, textAlign: 'center' }}
                    >
                      {Math.round(RULER_MIN_KG + i * RULER_STEP)}
                    </AppText>
                  ) : null}
                  <View
                    style={{
                      width: 2,
                      height: isFiveKg ? 30 : isKg ? 22 : 12,
                      borderRadius: 1,
                      backgroundColor: isKg ? colors.textMuted : colors.border,
                    }}
                  />
                </View>
              );
            }}
          />
          {/* Agulha central */}
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
