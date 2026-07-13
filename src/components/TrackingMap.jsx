import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../styles/theme';
import { apiRequest } from '../services/api';

function buildMapHtml(initialLat, initialLng, isStatic) {
  const lat = initialLat || 8.9824;
  const lng = initialLng || -79.5199;
  const staticInit = isStatic ? `
    updatePosition(${lat}, ${lng}, []);
  ` : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"/>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#1a3025}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap'
        }
      },
      layers: [{
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }]
    },
    center: [${lng}, ${lat}],
    zoom: 16
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  var marker = null;
  var routeLine = null;
  var routeCoords = [];
  var mapReady = false;

  map.on('load', function() {
    mapReady = true;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    ${staticInit}
  });

  function updatePosition(lat, lng, history) {
    if (!mapReady) return;

    if (marker) {
      marker.setLngLat([lng, lat]);
    } else {
      var el = document.createElement('div');
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#10b981';
      el.style.border = '3px solid #fff';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
      marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    }

    map.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });

    if (history && history.length > 1) {
      routeCoords = history.map(function(p) { return [p.longitude, p.latitude]; });

      if (routeLine) {
        routeLine.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: routeCoords }
        });
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: routeCoords }
          }
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#10b981',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
        routeLine = map.getSource('route');
      }
    }
  }
</script>
</body>
</html>`;
}

function formatRemaining(startTime, duration) {
  if (!startTime) return '0:00';
  const dur = (duration || 30) * 60000;
  const elapsed = Math.max(0, Math.min(Date.now() - new Date(startTime).getTime(), dur));
  const remaining = dur - elapsed;
  if (remaining <= 0) return '0:00';
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function TrackingMap({ visible, bookingId, role, booking, onCancel, mode = 'live', bookingLocation }) {
  const webViewRef = useRef(null);
  const [tracking, setTracking] = useState(null);
  const [elapsed, setElapsed] = useState('0:00');
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const pendingUpdateRef = useRef(null);

  const isStatic = mode === 'static';
  const initialLat = isStatic && bookingLocation?.latitude != null ? bookingLocation.latitude : (booking?.location?.latitude || 8.9824);
  const initialLng = isStatic && bookingLocation?.longitude != null ? bookingLocation.longitude : (booking?.location?.longitude || -79.5199);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setMapReady(false);
    setTracking(null);
  }, [visible]);

  useEffect(() => {
    if (!visible || isStatic || !bookingId) return;
    let cancelled = false;
    let interval;

    async function fetchLocation() {
      try {
        const data = await apiRequest(`/api/bookings/${bookingId}/location`);
        if (cancelled) return;
        setTracking(data.tracking);
        setLoading(false);

        if (data.tracking?.current) {
          const { latitude, longitude } = data.tracking.current;
          const history = data.tracking.history || [];
          const payload = `updatePosition(${latitude}, ${longitude}, ${JSON.stringify(history)})`;

          if (mapReady && webViewRef.current) {
            webViewRef.current.injectJavaScript(payload);
          } else {
            pendingUpdateRef.current = payload;
          }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLocation();
    interval = setInterval(fetchLocation, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [visible, bookingId, mapReady, isStatic]);

  useEffect(() => {
    if (!visible || isStatic || !booking?.startTime) return;
    const timer = setInterval(() => {
      setElapsed(formatRemaining(booking.startTime, booking.duration));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, booking?.startTime, booking?.duration, isStatic]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        setLoading(false);
        if (!isStatic && pendingUpdateRef.current && webViewRef.current) {
          webViewRef.current.injectJavaScript(pendingUpdateRef.current);
          pendingUpdateRef.current = null;
        }
      }
    } catch {}
  };

  const title = isStatic ? 'Ubicacion del servicio' : 'Tracking en vivo';
  const titleColor = isStatic ? '#ef4444' : '#10b981';

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="location" size={18} color={titleColor} />
              <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
            </View>
            <Pressable onPress={onCancel}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.mapWrapper}>
            <WebView
              ref={webViewRef}
              source={{ html: buildMapHtml(initialLat, initialLng, isStatic) }}
              style={styles.webview}
              originWhitelist={['*']}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
            />
            {loading || !mapReady ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={titleColor} />
                <Text style={styles.loadingText}>Cargando mapa...</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomSheet}>
            <View style={styles.infoRow}>
              {!isStatic && (
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.infoLabel}>Restante</Text>
                  <Text style={styles.infoValue}>{elapsed}</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Ionicons name="paw-outline" size={16} color={colors.primary} />
                <Text style={styles.infoLabel}>Mascota</Text>
                <Text style={styles.infoValue}>{booking?.petName || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={styles.infoLabel}>{role === 'walker' ? 'Cliente' : 'Paseador'}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {role === 'walker' ? booking?.client?.name : booking?.walker?.name || 'N/A'}
                </Text>
              </View>
              {!isStatic && (
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.infoLabel}>Horario</Text>
                  <Text style={styles.infoValue}>
                    {booking?.startTime
                      ? new Date(booking.startTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                      : 'N/A'}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.addressRow, isStatic && styles.addressRowStatic]}>
              <Ionicons name="navigate" size={14} color={isStatic ? '#ef4444' : '#10b981'} />
              <Text style={styles.addressText} numberOfLines={2}>
                {booking?.location?.address || 'Sin direccion registrada'}
              </Text>
            </View>

            {!isStatic && tracking?.current && (
              <View style={styles.locationRow}>
                <Ionicons name="navigate" size={14} color="#10b981" />
                <Text style={styles.locationText}>
                  {tracking.current.latitude?.toFixed(5)}, {tracking.current.longitude?.toFixed(5)}
                </Text>
                <Text style={styles.locationTime}>
                  {tracking.current.timestamp ? new Date(tracking.current.timestamp).toLocaleTimeString('es') : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(17,35,29,0.92)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 18,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(26,48,37,0.7)',
    gap: 10,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#d8f1da',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSheet: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoItem: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 14,
    flex: 1,
    gap: 4,
    paddingVertical: 10,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  locationTime: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  waitingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  addressRow: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addressRowStatic: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  addressText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
