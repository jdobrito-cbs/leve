import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Camera, GeoJSONSource, Layer, Map as MapView } from '@maplibre/maplibre-react-native';
import type { RoutePoint } from '@/db/workoutRepo';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const LINE = '#2563EB';

function paddedBounds(coords: [number, number][]): [number, number, number, number] {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  const padLng = Math.max((east - west) * 0.15, 0.0008);
  const padLat = Math.max((north - south) * 0.15, 0.0008);
  return [west - padLng, south - padLat, east + padLng, north + padLat];
}

export function RouteMap({
  points,
  style,
  fit,
  center,
  bearing,
}: {
  points: RoutePoint[];
  style?: StyleProp<ViewStyle>;
  fit?: boolean;
  center?: { lat: number; lng: number } | null;
  bearing?: number;
}) {
  const coords = useMemo<[number, number][]>(
    () =>
      points
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => [p.lng, p.lat]),
    [points],
  );

  const last = coords.length > 0 ? coords[coords.length - 1] : null;
  const here = useMemo<[number, number] | null>(
    () =>
      last ??
      (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)
        ? [center.lng, center.lat]
        : null),
    [last, center],
  );

  const lineData = useMemo(
    () => ({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: coords },
      properties: {},
    }),
    [coords],
  );

  const dotData = useMemo(
    () =>
      here
        ? {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: here },
            properties: {},
          }
        : null,
    [here],
  );

  const bounds = fit && coords.length > 1 ? paddedBounds(coords) : null;

  return (
    <MapView mapStyle={STYLE_URL} style={style} compass={false}>
      {bounds ? (
        <Camera bounds={bounds} />
      ) : here ? (
        <Camera center={here} zoom={16} bearing={bearing ?? 0} />
      ) : (
        <Camera center={[0, 20]} zoom={1} />
      )}

      {coords.length > 1 ? (
        <GeoJSONSource id="route" data={lineData}>
          <Layer
            id="route-line"
            type="line"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{ 'line-color': LINE, 'line-width': 5 }}
          />
        </GeoJSONSource>
      ) : null}

      {dotData ? (
        <GeoJSONSource id="here" data={dotData}>
          <Layer
            id="here-dot"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': LINE,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
            }}
          />
        </GeoJSONSource>
      ) : null}
    </MapView>
  );
}
