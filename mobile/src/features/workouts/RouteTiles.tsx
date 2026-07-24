import { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import type { RoutePoint } from '@/db/workoutRepo';

const TILE = 256;
const LINE = '#2563EB';
const TILE_URL = (z: number, x: number, y: number) =>
  `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

function worldPx(lng: number, lat: number, z: number): { x: number; y: number } {
  const scale = TILE * Math.pow(2, z);
  const x = ((lng + 180) / 360) * scale;
  const s = Math.min(0.9999, Math.max(-0.9999, Math.sin((lat * Math.PI) / 180)));
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function layoutFor(route: RoutePoint[], w: number, h: number) {
  const pts = route.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (pts.length < 2) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const p of pts) {
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
  }
  const padX = (maxLng - minLng) * 0.15 || 0.001;
  const padY = (maxLat - minLat) * 0.15 || 0.001;
  minLng -= padX;
  maxLng += padX;
  minLat -= padY;
  maxLat += padY;

  let z = 18;
  for (; z > 1; z--) {
    const a = worldPx(minLng, maxLat, z);
    const b = worldPx(maxLng, minLat, z);
    if (b.x - a.x <= w && b.y - a.y <= h) break;
  }

  const tl = worldPx(minLng, maxLat, z);
  const br = worldPx(maxLng, minLat, z);
  const originX = (tl.x + br.x) / 2 - w / 2;
  const originY = (tl.y + br.y) / 2 - h / 2;

  const n = Math.pow(2, z);
  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  for (let tx = Math.floor(originX / TILE); tx <= Math.floor((originX + w) / TILE); tx++) {
    for (let ty = Math.floor(originY / TILE); ty <= Math.floor((originY + h) / TILE); ty++) {
      if (ty < 0 || ty >= n) continue;
      const wx = ((tx % n) + n) % n;
      tiles.push({
        key: `${z}-${tx}-${ty}`,
        url: TILE_URL(z, wx, ty),
        left: tx * TILE - originX,
        top: ty * TILE - originY,
      });
    }
  }

  const line = pts
    .map((p) => {
      const q = worldPx(p.lng, p.lat, z);
      return `${(q.x - originX).toFixed(1)},${(q.y - originY).toFixed(1)}`;
    })
    .join(' ');

  return { tiles, line };
}

export function RouteTiles({
  route,
  w,
  h,
  strokeWidth = 4,
  onReady,
}: {
  route: RoutePoint[];
  w: number;
  h: number;
  strokeWidth?: number;
  onReady?: () => void;
}) {
  const layout = useMemo(() => layoutFor(route, w, h), [route, w, h]);
  const [settled, setSettled] = useState(0);

  useEffect(() => {
    if (!layout) {
      onReady?.();
      return;
    }
    if (settled >= layout.tiles.length) onReady?.();
  }, [settled, layout, onReady]);

  if (!layout) {
    return <View style={{ width: w, height: h, backgroundColor: '#e8eef6' }} />;
  }

  const bump = () => setSettled((n) => n + 1);
  return (
    <View style={{ width: w, height: h, overflow: 'hidden', backgroundColor: '#e8eef6' }}>
      {layout.tiles.map((t) => (
        <Image
          key={t.key}
          source={{ uri: t.url }}
          onLoad={bump}
          onError={bump}
          style={{ position: 'absolute', left: t.left, top: t.top, width: TILE, height: TILE }}
        />
      ))}
      <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Polyline
          points={layout.line}
          fill="none"
          stroke={LINE}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
