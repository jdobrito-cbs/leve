import { useEffect, useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
import type { StyleProp, ViewStyle } from 'react-native';
import type { RoutePoint } from '@/db/workoutRepo';

const HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;background:#e8eef6}</style>
</head><body><div id="map"></div>
<script>
var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([0, 0], 15);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
var line = L.polyline([], { color: '#2563EB', weight: 5, lineJoin: 'round' }).addTo(map);
var dot = null;
var first = true;
function update(pts) {
  if (!pts || !pts.length) return;
  var latlngs = pts.map(function (p) { return [p.lat, p.lng]; });
  line.setLatLngs(latlngs);
  var last = latlngs[latlngs.length - 1];
  if (dot) { dot.setLatLng(last); }
  else { dot = L.circleMarker(last, { radius: 7, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map); }
  if (first) { map.setView(last, 16); first = false; } else { map.panTo(last); }
}
</script></body></html>`;

export function RouteMap({
  points,
  style,
}: {
  points: RoutePoint[];
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<WebView>(null);
  const loaded = useRef(false);
  const payload = useMemo(
    () => JSON.stringify(points.map((p) => ({ lat: p.lat, lng: p.lng }))),
    [points],
  );

  useEffect(() => {
    if (loaded.current) ref.current?.injectJavaScript(`update(${payload}); true;`);
  }, [payload]);

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html: HTML }}
      style={style}
      scrollEnabled={false}
      onLoadEnd={() => {
        loaded.current = true;
        ref.current?.injectJavaScript(`update(${payload}); true;`);
      }}
    />
  );
}
