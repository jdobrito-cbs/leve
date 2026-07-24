import { forwardRef } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Rect } from 'react-native-svg';
import { formatDateTimeShort } from '@/core/datetime';
import { AppText } from '@/design/components';
import { fonts, spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import type { RoutePoint, Workout } from '@/db/workoutRepo';
import {
  caloriesLabel,
  distanceLabel,
  durationLabel,
  heartRateLabel,
  speedLabel,
  workoutTypeLabel,
} from './format';
import { strings } from '@/i18n/pt-BR';

const CARD_W = 340;
const MAP_H = 190;
const PHOTO_H = 500;
const SITE = 'levemobile.com.br';
const LOGO = require('../../../assets/images/icon.png');

function polylinePoints(route: RoutePoint[], w: number, h: number, pad: number): string | null {
  const pts = route.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (pts.length < 2) return null;
  const k = Math.cos((pts[0].lat * Math.PI) / 180) || 1;
  const xs = pts.map((p) => p.lng * k);
  const ys = pts.map((p) => p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
  const offX = (w - spanX * scale) / 2;
  const offY = (h - spanY * scale) / 2;
  return pts
    .map((_, i) => {
      const x = offX + (xs[i] - minX) * scale;
      const y = h - (offY + (ys[i] - minY) * scale);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function RouteThumb({
  mapUri,
  route,
  w,
  h,
  radius,
  strokeWidth,
}: {
  mapUri?: string | null;
  route: RoutePoint[] | null;
  w: number;
  h: number;
  radius: number;
  strokeWidth: number;
}) {
  const { colors } = useTheme();
  const line = route ? polylinePoints(route, w, h, radius > 0 ? 8 : 0) : null;
  return (
    <View
      style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', backgroundColor: colors.primarySoft }}
    >
      {mapUri ? (
        <Image source={{ uri: mapUri }} style={{ width: w, height: h }} resizeMode="cover" />
      ) : (
        <Svg width={w} height={h}>
          <Rect x={0} y={0} width={w} height={h} fill={colors.primarySoft} />
          {line ? (
            <Polyline
              points={line}
              fill="none"
              stroke={colors.primary}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      )}
    </View>
  );
}

function Metric({ label, value, light }: { label: string; value: string; light?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: '50%', paddingVertical: 4 }}>
      <AppText variant="caption" style={{ color: light ? 'rgba(255,255,255,0.82)' : colors.textMuted }}>
        {label}
      </AppText>
      <AppText
        style={{ fontFamily: fonts.bold, fontSize: light ? 17 : 20, color: light ? '#fff' : colors.text }}
      >
        {value}
      </AppText>
    </View>
  );
}

export const ShareCard = forwardRef<
  View,
  { workout: Workout; mapUri?: string | null; photoUri?: string | null }
>(function ShareCardImpl({ workout: w, mapUri, photoUri }, ref) {
  const { colors } = useTheme();
  const dateLine = `${formatDateTimeShort(w.startAt)}${
    w.endAt ? ` – ${formatDateTimeShort(w.endAt)}` : ''
  }`;

  const metrics = (light: boolean) => (
    <>
      <Metric label={strings.workouts.distance} value={distanceLabel(w.distanceM)} light={light} />
      <Metric label={strings.workouts.duration} value={durationLabel(w.durationSec)} light={light} />
      <Metric
        label={strings.workouts.speed}
        value={speedLabel(w.distanceM, w.durationSec)}
        light={light}
      />
      <Metric label={strings.workouts.heartRate} value={heartRateLabel(w.avgHr)} light={light} />
      <Metric label={strings.workouts.calories} value={caloriesLabel(w.calories)} light={light} />
    </>
  );

  if (photoUri) {
    return (
      <View
        ref={ref}
        collapsable={false}
        style={{ width: CARD_W, height: PHOTO_H, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000' }}
      >
        <Image
          source={{ uri: photoUri }}
          style={{ position: 'absolute', width: CARD_W, height: PHOTO_H }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 96 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 280 }}
        />

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Image source={LOGO} style={{ width: 30, height: 30, borderRadius: 8 }} />
            <AppText style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 22 }}>Leve</AppText>
          </View>
          <AppText style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 14 }}>
            {workoutTypeLabel(w.type)}
          </AppText>
        </View>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
            <RouteThumb mapUri={mapUri} route={w.route} w={86} h={86} radius={12} strokeWidth={3} />
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>{metrics(true)}</View>
          </View>
          <AppText style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: spacing.sm }}>
            {dateLine}
          </AppText>
          <AppText style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 12, marginTop: 2 }}>
            {SITE}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: CARD_W, backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden' }}
    >
      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Image source={LOGO} style={{ width: 32, height: 32, borderRadius: 9 }} />
          <AppText style={{ color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 24 }}>
            Leve
          </AppText>
        </View>
        <AppText style={{ color: colors.onPrimary, fontFamily: fonts.semibold, fontSize: 15 }}>
          {workoutTypeLabel(w.type)}
        </AppText>
      </View>

      <RouteThumb mapUri={mapUri} route={w.route} w={CARD_W} h={MAP_H} radius={0} strokeWidth={4} />

      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{metrics(false)}</View>
        <AppText variant="caption" muted style={{ marginTop: spacing.sm }}>
          {dateLine}
        </AppText>
        <AppText
          variant="caption"
          style={{ marginTop: 4, color: colors.primary, fontFamily: fonts.semibold }}
        >
          {SITE}
        </AppText>
      </View>
    </View>
  );
});
