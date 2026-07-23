import type { RoutePoint } from '@/db/workoutRepo';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const LINE = '#2563EB';

interface StaticManager {
  createImage(options: {
    mapStyle: string | object;
    bounds: [number, number, number, number];
    width: number;
    height: number;
    output: 'file' | 'base64';
    logo?: boolean;
  }): Promise<string>;
}

function routeBounds(route: RoutePoint[]): [number, number, number, number] | null {
  const pts = route.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (pts.length < 2) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const p of pts) {
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
  }
  const padLng = Math.max((east - west) * 0.18, 0.0006);
  const padLat = Math.max((north - south) * 0.18, 0.0006);
  return [west - padLng, south - padLat, east + padLng, north + padLat];
}

export async function buildRouteMapImage(
  route: RoutePoint[],
  width: number,
  height: number,
): Promise<string | null> {
  const bounds = routeBounds(route);
  if (!bounds) return null;
  try {
    const { StaticMapImageManager } = require('@maplibre/maplibre-react-native') as {
      StaticMapImageManager?: StaticManager;
    };
    if (!StaticMapImageManager?.createImage) return null;

    const style = (await (await fetch(STYLE_URL)).json()) as {
      sources?: Record<string, unknown>;
      layers?: unknown[];
    };
    const coordinates = route
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => [p.lng, p.lat]);

    style.sources = {
      ...(style.sources ?? {}),
      'leve-route': {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} },
      },
    };
    style.layers = [
      ...(style.layers ?? []),
      {
        id: 'leve-route',
        type: 'line',
        source: 'leve-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': LINE, 'line-width': 5 },
      },
    ];

    return await StaticMapImageManager.createImage({
      mapStyle: style,
      bounds,
      width,
      height,
      output: 'file',
      logo: false,
    });
  } catch {
    return null;
  }
}
