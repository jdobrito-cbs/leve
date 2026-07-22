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
var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([20, 0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
var line = L.polyline([], { color: '#2563EB', weight: 5, lineJoin: 'round' }).addTo(map);
var dot = null;
var here = null;
var first = true;
function setHere(lat, lng) {
  var ll = [lat, lng];
  if (here) { here.setLatLng(ll); }
  else { here = L.circleMarker(ll, { radius: 7, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map); }
  if (first) { map.setView(ll, 16); first = false; }
}
function update(pts, fit) {
  if (!pts || !pts.length) return;
  if (here) { map.removeLayer(here); here = null; }
  var latlngs = pts.map(function (p) { return [p.lat, p.lng]; });
  line.setLatLngs(latlngs);
  var last = latlngs[latlngs.length - 1];
  if (dot) { dot.setLatLng(last); }
  else { dot = L.circleMarker(last, { radius: 7, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map); }
  if (fit && latlngs.length > 1) { map.fitBounds(line.getBounds(), { padding: [24, 24] }); }
  else if (first) { map.setView(last, 16); first = false; }
  else { map.panTo(last); }
}
</script></body></html>`;

export function RouteMap({
  points,
  style,
  fit,
  center,
}: {
  points: RoutePoint[];
  style?: StyleProp<ViewStyle>;
  fit?: boolean;
  center?: { lat: number; lng: number } | null;
}) {
  const ref = useRef<WebView>(null);
  const loaded = useRef(false);
  const payload = useMemo(
    () => JSON.stringify(points.map((p) => ({ lat: p.lat, lng: p.lng }))),
    [points],
  );
  const call = `update(${payload}, ${fit ? 'true' : 'false'}); true;`;
  const centerCall =
    center && Number.isFinite(center.lat) && Number.isFinite(center.lng)
      ? `setHere(${center.lat}, ${center.lng}); true;`
      : '';

  useEffect(() => {
    if (loaded.current) ref.current?.injectJavaScript(call);
  }, [call]);

  useEffect(() => {
    if (loaded.current && centerCall) ref.current?.injectJavaScript(centerCall);
  }, [centerCall]);

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html: HTML }}
      style={style}
      scrollEnabled={false}
      onLoadEnd={() => {
        loaded.current = true;
        if (centerCall) ref.current?.injectJavaScript(centerCall);
        ref.current?.injectJavaScript(call);
      }}
    />
  );
}
