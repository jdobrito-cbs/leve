import { useState } from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import {
  gaugeBoundaryFractions,
  gaugeMarkerFraction,
  zoneOf,
  type GaugeZone,
} from '@/features/body/bodyBands';
import { useTheme } from '../useTheme';

interface Props {
  value: number;
  zones: GaugeZone[];
  digits?: number;
}

const fmtN = (n: number, digits: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: digits });

export function RangeGauge({ value, zones, digits = 1 }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const bounds = zones.filter((z) => z.to !== null).map((z) => z.to as number);
  if (bounds.length === 0) return null;
  const boundaryFracs = gaugeBoundaryFractions(zones);
  const marker = gaugeMarkerFraction(value, zones) * width;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {}
      <View style={{ height: 14 }}>
        {width > 0
          ? bounds.map((b, i) => (
              <AppText
                key={i}
                variant="caption"
                muted
                style={{
                  position: 'absolute',
                  left: boundaryFracs[i] * width - 24,
                  width: 48,
                  textAlign: 'center',
                  fontSize: 11,
                }}
              >
                {fmtN(b, digits)}
              </AppText>
            ))
          : null}
      </View>
      {}
      <View style={{ height: 14, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          {zones.map((zone, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: zone.color }} />
          ))}
        </View>
        {width > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: Math.min(Math.max(marker - 7, 0), Math.max(width - 14, 0)),
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 3,
              borderColor: zoneOf(value, zones).color,
              backgroundColor: colors.surface,
            }}
          />
        ) : null}
      </View>
      {}
      <View style={{ flexDirection: 'row' }}>
        {zones.map((zone, i) => (
          <AppText
            key={i}
            variant="caption"
            muted
            style={{ flex: 1, textAlign: 'center', fontSize: 10 }}
          >
            {zone.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}
