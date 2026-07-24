import { forwardRef } from 'react';
import { Image, View } from 'react-native';
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
const PAD = 18;

function polylinePoints(route: RoutePoint[]): string | null {
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
  const scale = Math.min((CARD_W - 2 * PAD) / spanX, (MAP_H - 2 * PAD) / spanY);
  const offX = (CARD_W - spanX * scale) / 2;
  const offY = (MAP_H - spanY * scale) / 2;
  return pts
    .map((_, i) => {
      const x = offX + (xs[i] - minX) * scale;
      const y = MAP_H - (offY + (ys[i] - minY) * scale);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: '50%', paddingVertical: 6 }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.bold, fontSize: 20, color: colors.text }}>{value}</AppText>
    </View>
  );
}

export const ShareCard = forwardRef<View, { workout: Workout; mapUri?: string | null }>(
  function ShareCardImpl({ workout: w, mapUri }, ref) {
    const { colors } = useTheme();
    const line = w.route ? polylinePoints(w.route) : null;

    return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: CARD_W,
        backgroundColor: colors.surface,
        borderRadius: 22,
        overflow: 'hidden',
      }}
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
          <Image
            source={require('../../../assets/images/icon.png')}
            style={{ width: 32, height: 32, borderRadius: 9 }}
          />
          <AppText style={{ color: colors.onPrimary, fontFamily: fonts.bold, fontSize: 24 }}>
            Leve
          </AppText>
        </View>
        <AppText style={{ color: colors.onPrimary, fontFamily: fonts.semibold, fontSize: 15 }}>
          {workoutTypeLabel(w.type)}
        </AppText>
      </View>

      <View style={{ height: MAP_H, backgroundColor: colors.primarySoft }}>
        {mapUri ? (
          <Image
            source={{ uri: mapUri }}
            style={{ width: CARD_W, height: MAP_H }}
            resizeMode="cover"
          />
        ) : (
          <Svg width={CARD_W} height={MAP_H}>
            <Rect x={0} y={0} width={CARD_W} height={MAP_H} fill={colors.primarySoft} />
            {line ? (
              <Polyline
                points={line}
                fill="none"
                stroke={colors.primary}
                strokeWidth={4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
          </Svg>
        )}
      </View>

      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Metric label={strings.workouts.distance} value={distanceLabel(w.distanceM)} />
          <Metric label={strings.workouts.duration} value={durationLabel(w.durationSec)} />
          <Metric label={strings.workouts.speed} value={speedLabel(w.distanceM, w.durationSec)} />
          <Metric label={strings.workouts.heartRate} value={heartRateLabel(w.avgHr)} />
          <Metric label={strings.workouts.calories} value={caloriesLabel(w.calories)} />
        </View>
        <AppText variant="caption" muted style={{ marginTop: spacing.sm }}>
          {formatDateTimeShort(w.startAt)}
          {w.endAt ? ` – ${formatDateTimeShort(w.endAt)}` : ''}
        </AppText>
        <AppText
          variant="caption"
          style={{ marginTop: 4, color: colors.primary, fontFamily: fonts.semibold }}
        >
          levemobile.com.br
        </AppText>
      </View>
    </View>
  );
});
