import { useState } from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import type { GaugeZone } from '@/features/body/bodyBands';
import { useTheme } from '../useTheme';

interface Props {
  value: number;
  zones: GaugeZone[];
  /** Casas decimais dos números de fronteira. */
  digits?: number;
}

const fmtN = (n: number, digits: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: digits });

/**
 * Medidor no estilo da balança: barra segmentada por zonas coloridas, números
 * das fronteiras acima, rótulos abaixo e um marcador redondo na posição atual.
 * A régua se estende meia-zona antes da 1ª fronteira e meia depois da última.
 */
export function RangeGauge({ value, zones, digits = 1 }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const bounds = zones.filter((z) => z.to !== null).map((z) => z.to as number);
  if (bounds.length === 0) return null;
  const spanSeed = bounds.length > 1 ? bounds[bounds.length - 1] - bounds[0] : bounds[0];
  const pad = Math.max(spanSeed * 0.5, bounds[0] * 0.25, 1);
  const min = Math.max(0, bounds[0] - pad);
  const max = bounds[bounds.length - 1] + pad;
  const toX = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min)));

  // Segmentos coloridos: cada zona vai da fronteira anterior à sua.
  const stops = [min, ...bounds, max];
  const marker = toX(value) * width;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* números das fronteiras */}
      <View style={{ height: 14 }}>
        {width > 0
          ? bounds.map((b, i) => (
              <AppText
                key={i}
                variant="caption"
                muted
                style={{
                  position: 'absolute',
                  left: toX(b) * width - 24,
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
      {/* barra segmentada + marcador */}
      <View style={{ height: 14, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          {zones.map((zone, i) => (
            <View
              key={i}
              style={{
                flex: Math.max(stops[i + 1] - stops[i], 0.0001),
                backgroundColor: zone.color,
              }}
            />
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
              borderColor: zones.find((z) => z.to === null || value <= z.to)?.color ?? colors.primary,
              backgroundColor: colors.surface,
            }}
          />
        ) : null}
      </View>
      {/* rótulos das zonas */}
      <View style={{ flexDirection: 'row' }}>
        {zones.map((zone, i) => (
          <AppText
            key={i}
            variant="caption"
            muted
            style={{
              flex: Math.max(stops[i + 1] - stops[i], 0.0001),
              textAlign: 'center',
              fontSize: 10,
            }}
          >
            {zone.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}
