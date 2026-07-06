import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../styles/theme';

const DEFAULT_LAT = 8.9824;
const DEFAULT_LNG = -79.5199;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://gall.openstreetmap.de/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function fetchFromOverpass(query, timeoutMs = 10000) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchNearbyParks(lat, lng, radiusMeters = 2000) {
  const query = `
    [out:json][timeout:10];
    (
      node["leisure"~"^(park|garden|recreation_ground)$"](around:${radiusMeters},${lat},${lng});
      way["leisure"~"^(park|garden|recreation_ground)$"](around:${radiusMeters},${lat},${lng});
      node["name"~"parque",i](around:${radiusMeters},${lat},${lng});
      way["name"~"parque",i](around:${radiusMeters},${lat},${lng});
    );
    out center 15;
  `;
  const data = await fetchFromOverpass(query);
  if (!data) return [];
  const seen = new Set();
  return data.elements
    .map((el) => ({
      name: el.tags?.name || 'Parque cercano',
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lng,
    }))
    .filter((p) => {
      if (!p.lat || !p.lng) return false;
      const key = `${p.name}-${p.lat.toFixed(4)}-${p.lng.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        haversineDistance(lat, lng, a.lat, a.lng) -
        haversineDistance(lat, lng, b.lat, b.lng),
    );
}

function buildMapHtml(initialLat, initialLng, markerLat, markerLng) {
  const hasMarker = markerLat != null && markerLng != null;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#1a3025}
  .leaflet-control-attribution{display:none!important}
  .leaflet-control-zoom{border:none!important}
  .leaflet-control-zoom a{
    background:#1a3025!important;
    color:#d8f1da!important;
    border:1px solid rgba(83,128,93,0.3)!important;
    width:32px!important;
    height:32px!important;
    line-height:32px!important;
    font-size:16px!important;
  }
  .leaflet-control-zoom a:hover{background:#243d30!important}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{
    zoomControl:true,
    attributionControl:false
  }).setView([${initialLat},${initialLng}],15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19
  }).addTo(map);

  var marker=null;

  function setMarker(lat,lng){
    if(marker){marker.setLatLng([lat,lng])}
    else{marker=L.marker([lat,lng]).addTo(map)}
  }

  function recenter(lat,lng){
    map.setView([lat,lng],16);
  }

  map.on('click',function(e){
    var lat=e.latlng.lat;
    var lng=e.latlng.lng;
    setMarker(lat,lng);
    recenter(lat,lng);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'pin',lat:lat,lng:lng}));
  });

  ${hasMarker ? `setMarker(${markerLat},${markerLng});map.setView([${markerLat},${markerLng}],16);` : ''}
</script>
</body>
</html>`;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=0&accept-language=es`,
      { headers: { 'User-Agent': 'WalkwiApp/1.0' } }
    );
    const data = await res.json();
    return data.display_name || '';
  } catch {
    return '';
  }
}

export default function MapPicker({ visible, initialLatitude, initialLongitude, initialAddress, onConfirm, onCancel }) {
  const webViewRef = useRef(null);
  const [pinLat, setPinLat] = useState(initialLatitude || null);
  const [pinLng, setPinLng] = useState(initialLongitude || null);
  const [address, setAddress] = useState(initialAddress || '');
  const [geocoding, setGeocoding] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [parks, setParks] = useState([]);
  const [selectedPark, setSelectedPark] = useState(null);
  const [loadingParks, setLoadingParks] = useState(false);

  const centerLat = initialLatitude || DEFAULT_LAT;
  const centerLng = initialLongitude || DEFAULT_LNG;

  useEffect(() => {
    if (!visible) return;
    setPinLat(initialLatitude || null);
    setPinLng(initialLongitude || null);
    setAddress(initialAddress || '');
  }, [visible, initialLatitude, initialLongitude, initialAddress]);

  useEffect(() => {
    if (pinLat == null || pinLng == null) return;
    let cancelled = false;
    (async () => {
      setGeocoding(true);
      const addr = await reverseGeocode(pinLat, pinLng);
      if (!cancelled) {
        setAddress(addr);
        setGeocoding(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pinLat, pinLng]);

  useEffect(() => {
    if (pinLat == null || pinLng == null) {
      setParks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingParks(true);
      try {
        let results = await fetchNearbyParks(pinLat, pinLng, 5000);
        if (!cancelled && results.length === 0) {
          results = await fetchNearbyParks(pinLat, pinLng, 10000);
        }
        if (!cancelled) {
          setParks(results);
        }
      } catch {
        if (!cancelled) setParks([]);
      } finally {
        if (!cancelled) setLoadingParks(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pinLat, pinLng]);

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pin') {
        setPinLat(data.lat);
        setPinLng(data.lng);
        setSelectedPark(null);
      }
    } catch {}
  };

  const handleUseMyLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGettingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setPinLat(lat);
      setPinLng(lng);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`(function(){setMarker(${lat},${lng});recenter(${lat},${lng});})()`);
      }
    } catch {
    } finally {
      setGettingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (pinLat == null || pinLng == null) return;
    onConfirm({ latitude: pinLat, longitude: pinLng, address: address.trim() });
  };

  const handleSelectPark = (park) => {
    setSelectedPark(park.name);
    setPinLat(park.lat);
    setPinLng(park.lng);
    setAddress(park.name);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`(function(){setMarker(${park.lat},${park.lng});recenter(${park.lat},${park.lng});})()`);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ubicacion</Text>
            <Pressable onPress={onCancel}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.mapWrapper}>
            <WebView
              ref={webViewRef}
              source={{ html: buildMapHtml(centerLat, centerLng, pinLat, pinLng) }}
              style={styles.webview}
              onMessage={handleWebViewMessage}
              originWhitelist={['*']}
            />
            {gettingLocation ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Obteniendo ubicacion...</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomSection}>
            <Pressable
              onPress={handleUseMyLocation}
              disabled={gettingLocation}
              style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed]}
            >
              <Ionicons name="locate" size={18} color={colors.primary} />
              <Text style={styles.gpsButtonText}>Usar mi ubicacion actual</Text>
            </Pressable>

            {(parks.length > 0 || loadingParks) && (
              <View style={styles.parksSection}>
                <Text style={styles.parksLabel}>Parques cercanos</Text>
                {loadingParks ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 6 }} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parksRow}>
                    {parks.map((park) => {
                      const active = selectedPark === park.name && pinLat === park.lat && pinLng === park.lng;
                      return (
                        <Pressable
                          key={`${park.name}-${park.lat}`}
                          onPress={() => handleSelectPark(park)}
                          style={[styles.parkChip, active && styles.parkChipActive]}
                        >
                          <Ionicons name="leaf-outline" size={14} color={active ? '#fff' : colors.primary} />
                          <Text style={[styles.parkChipText, active && styles.parkChipTextActive]} numberOfLines={1}>
                            {park.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            <Text style={styles.addressLabel}>Direccion</Text>
            <TextInput
              onChangeText={setAddress}
              placeholder="Toca el mapa o usa tu ubicacion"
              placeholderTextColor="#8fa899"
              style={styles.addressInput}
              value={address}
            />
            {geocoding ? (
              <Text style={styles.geocodingText}>Buscando direccion...</Text>
            ) : null}

            {pinLat != null && pinLng != null ? (
              <Text style={styles.coordsText}>
                {pinLat.toFixed(5)}, {pinLng.toFixed(5)}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={pinLat == null || pinLng == null}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  (pinLat == null || pinLng == null) && styles.confirmBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmText}>Confirmar</Text>
              </Pressable>
            </View>
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
  bottomSection: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 14,
  },
  gpsButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  gpsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  parksSection: {
    gap: 6,
  },
  parksLabel: {
    color: '#324036',
    fontSize: 13,
    fontWeight: '800',
  },
  parksRow: {
    gap: 8,
    paddingBottom: 4,
  },
  parkChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  parkChipActive: {
    backgroundColor: colors.primary,
  },
  parkChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    maxWidth: 140,
  },
  parkChipTextActive: {
    color: '#fff',
  },
  addressLabel: {
    color: '#324036',
    fontSize: 14,
    fontWeight: '800',
  },
  addressInput: {
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geocodingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  coordsText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 18,
    flex: 1,
    paddingVertical: 14,
  },
  cancelText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flex: 2,
    paddingVertical: 14,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
});
