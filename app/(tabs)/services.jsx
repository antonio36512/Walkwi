import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, shadows } from '../../src/styles/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';
import FilterSheet from '../../src/components/FilterSheet';

const initialRequests = [
  {
    id: 1,
    client: 'Ana Perez',
    date: 'Hoy, 4:30 p.m.',
    duration: '45 minutos',
    location: 'Via Argentina',
    pet: 'Luna',
    service: 'Paseo',
    type: 'walker',
    notes: 'Luna es tranquila, pero se asusta con motos.',
  },
  {
    id: 2,
    client: 'Miguel Santos',
    date: 'Mañana, 9:00 a.m.',
    duration: '2 horas',
    location: 'El Cangrejo',
    pet: 'Rocky',
    service: 'Paseo',
    type: 'walker',
    notes: 'Rocky es muy enérgico, necesita correr bastante.',
  },
  {
    id: 3,
    client: 'Carolina Diaz',
    date: 'Viernes, 6:00 p.m.',
    duration: '30 minutos',
    location: 'Obarrio',
    pet: 'Milo',
    service: 'Paseo',
    type: 'walker',
    notes: 'Milo convive bien con otros perros.',
  },
];

function Services() {
  const { user } = useAuth();
  const role = user?.role || 'user';

  if (role === 'walker') {
    return <ProviderRequests role={role} />;
  }

  return <UserServices />;
}

function ProviderRequests({ role }) {
  const [requests, setRequests] = useState(
    initialRequests
      .filter((request) => request.type === role)
      .map((request) => ({ ...request, status: 'pending' })),
  );

  const handleDecision = (id, status) => {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    );
  };

  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const decidedRequests = requests.filter((request) => request.status !== 'pending');

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Solicitudes</Text>
        <Text style={styles.title}>Solicitudes por revisar</Text>
        <Text style={styles.heroCopy}>
          Acepta o deniega solicitudes de clientes según tu disponibilidad.
        </Text>
      </View>

      <View style={styles.requestsGrid}>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={28} color={colors.primary} />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{request.client}</Text>
                  <Text style={styles.requestMeta}>
                    {request.service} para {request.pet}
                  </Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pendiente</Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.detailText}>{request.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.detailText}>{request.duration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={colors.primary} />
                  <Text style={styles.detailText}>{request.location}</Text>
                </View>
              </View>

              <Text style={styles.experience}>{request.notes}</Text>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleDecision(request.id, 'denied')}
                  style={({ pressed }) => [styles.denyButton, pressed && styles.cardPressed]}
                >
                  <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.denyButtonText}>Denegar</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDecision(request.id, 'accepted')}
                  style={({ pressed }) => [styles.acceptButton, pressed && styles.cardPressed]}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.acceptButtonText}>Aceptar</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>No hay solicitudes pendientes</Text>
            <Text style={styles.emptyCopy}>Cuando recibas nuevas solicitudes aparecerán aquí.</Text>
          </View>
        )}
      </View>

      {decidedRequests.length > 0 ? (
        <View style={styles.historyBlock}>
          <Text style={styles.sectionTitle}>Historial reciente</Text>
          {decidedRequests.map((request) => {
            const accepted = request.status === 'accepted';

            return (
              <View key={request.id} style={styles.historyItem}>
                <View style={styles.historyTitleRow}>
                  <Ionicons
                    name={accepted ? 'checkmark-circle-outline' : 'close-circle-outline'}
                    size={20}
                    color={accepted ? colors.primary : colors.danger}
                  />
                  <Text style={styles.historyTitle}>
                    {request.client} - {request.pet}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyStatus,
                    accepted ? styles.acceptedText : styles.deniedText,
                  ]}
                >
                  {accepted ? 'Aceptada' : 'Denegada'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const priceRanges = [
  { key: 'all', label: 'Todos', min: null, max: null },
  { key: '0-12', label: '$0 - $12', min: 0, max: 12 },
  { key: '12-15', label: '$12 - $15', min: 12, max: 15 },
  { key: '15-20', label: '$15 - $20', min: 15, max: 20 },
  { key: '20+', label: '$20+', min: 20, max: null },
];

const ratingOptions = [
  { key: 'all', label: 'Todos', value: null },
  { key: '4.5', label: '4.5+', value: 4.5 },
  { key: '4.7', label: '4.7+', value: 4.7 },
  { key: '4.9', label: '4.9+', value: 4.9 },
];

function UserServices() {
  const router = useRouter();
  const [walkers, setWalkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Todas');
  const [selectedPrice, setSelectedPrice] = useState(priceRanges[0]);
  const [selectedRating, setSelectedRating] = useState(ratingOptions[0]);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWalkers() {
      try {
        const data = await apiRequest('/api/walkers');
        if (mounted) setWalkers(data);
      } catch (err) {
        if (mounted) setError(err.message || 'Error al cargar paseadores.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchWalkers();
    return () => { mounted = false; };
  }, []);

  const locations = useMemo(() => {
    const fromWalkers = walkers.map((w) => w.location).filter(Boolean);
    const unique = [...new Set(fromWalkers)];
    return [{ key: 'all', label: 'Todas' }, ...unique.map((l) => ({ key: l, label: l }))];
  }, [walkers]);

  const filteredWalkers = useMemo(() => {
    return walkers.filter((w) => {
      const matchesLocation = selectedLocation === 'Todas' || w.location === selectedLocation;
      const matchesPrice =
        (selectedPrice.min === null || w.pricePerHour >= selectedPrice.min) &&
        (selectedPrice.max === null || w.pricePerHour <= selectedPrice.max);
      const matchesRating = selectedRating.value === null || w.rating >= selectedRating.value;
      return matchesLocation && matchesPrice && matchesRating;
    });
  }, [walkers, selectedLocation, selectedPrice, selectedRating]);

  const locationOptions = locations;
  const activeLocationKey = locations.find((l) => l.label === selectedLocation)?.key || 'all';

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Nuestros servicios</Text>
        <Text style={styles.title}>Paseadores</Text>
        <Text style={styles.heroCopy}>
          Encuentra paseadores de confianza para pasear a tu mascota cuando lo necesites.
        </Text>
      </View>

      <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterTrigger, selectedLocation !== 'Todas' && styles.filterTriggerActive]}
          onPress={() => setActiveFilter('location')}
        >
          <Ionicons name="location-outline" size={16} color={selectedLocation !== 'Todas' ? '#fff' : colors.primary} />
          <Text style={[styles.filterTriggerText, selectedLocation !== 'Todas' && styles.filterTriggerTextActive]}>
            {selectedLocation}
          </Text>
          <Ionicons name="chevron-down" size={14} color={selectedLocation !== 'Todas' ? '#fff' : colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.filterTrigger, selectedPrice.key !== 'all' && styles.filterTriggerActive]}
          onPress={() => setActiveFilter('price')}
        >
          <Ionicons name="cash-outline" size={16} color={selectedPrice.key !== 'all' ? '#fff' : colors.primary} />
          <Text style={[styles.filterTriggerText, selectedPrice.key !== 'all' && styles.filterTriggerTextActive]}>
            {selectedPrice.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color={selectedPrice.key !== 'all' ? '#fff' : colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.filterTrigger, selectedRating.key !== 'all' && styles.filterTriggerActive]}
          onPress={() => setActiveFilter('rating')}
        >
          <Ionicons name="star-outline" size={16} color={selectedRating.key !== 'all' ? '#fff' : colors.primary} />
          <Text style={[styles.filterTriggerText, selectedRating.key !== 'all' && styles.filterTriggerTextActive]}>
            {selectedRating.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color={selectedRating.key !== 'all' ? '#fff' : colors.textMuted} />
        </Pressable>
      </View>

      <FilterSheet
        visible={activeFilter === 'location'}
        title="Ubicación"
        options={locationOptions}
        selectedKey={activeLocationKey}
        onSelect={(opt) => setSelectedLocation(opt.label)}
        onClose={() => setActiveFilter(null)}
      />

      <FilterSheet
        visible={activeFilter === 'price'}
        title="Precio por hora"
        options={priceRanges}
        selectedKey={selectedPrice.key}
        onSelect={(opt) => setSelectedPrice(opt)}
        onClose={() => setActiveFilter(null)}
      />

      <FilterSheet
        visible={activeFilter === 'rating'}
        title="Calificación"
        options={ratingOptions}
        selectedKey={selectedRating.key}
        onSelect={(opt) => setSelectedRating(opt)}
        onClose={() => setActiveFilter(null)}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando paseadores...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyCopy}>{error}</Text>
        </View>
      ) : (
        <View style={styles.providersGrid}>
          {filteredWalkers.length > 0 ? (
            filteredWalkers.map((walker) => (
              <View key={walker._id} style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  <View style={styles.avatar}>
                    {walker.profilePhotoUri ? (
                      <Image source={{ uri: walker.profilePhotoUri }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person-outline" size={28} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{walker.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={15} color={colors.primary} />
                      <Text style={styles.rating}>{Number(walker.rating || 0).toFixed(1)}</Text>
                      <Text style={styles.reviews}>({walker.reviewCount} reseñas)</Text>
                    </View>
                  </View>

                  {walker.verified ? (
                    <View style={styles.badgeVerified}>
                      <Text style={styles.badgeVerifiedText}>Verificado</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.experience}>{walker.experience}</Text>

                <View style={styles.cardFooter}>
                  <View style={styles.footerDetails}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                      <Text numberOfLines={2} ellipsizeMode="tail" style={styles.location}>
                        {walker.location || 'Ubicación no registrada'}
                      </Text>
                    </View>
                    <Text style={styles.price}>${walker.pricePerHour}/hora</Text>
                  </View>

                  <Pressable
                    onPress={() => router.push(`/walker/${walker._id}`)}
                    style={styles.contactButton}
                  >
                    <Ionicons name="eye-outline" size={17} color="#ffffff" />
                    <Text style={styles.contactButtonText}>Ver perfil</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={colors.primary} />
              <Text style={styles.emptyTitle}>No hay paseadores</Text>
              <Text style={styles.emptyCopy}>No se encontraron paseadores en esta ubicación.</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 112,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroBlock: {
    alignSelf: 'center',
    maxWidth: 720,
    width: '100%',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 37,
  },
  heroCopy: {
    color: '#4c6053',
    fontSize: 16,
    lineHeight: 27,
    marginTop: 14,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    maxWidth: 720,
    width: '100%',
  },
  filterTrigger: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.2)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    flex: 1,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filterTriggerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTriggerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  filterTriggerTextActive: {
    color: '#ffffff',
  },
  centered: {
    alignItems: 'center',
    gap: 12,
    marginTop: 60,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  providersGrid: {
    alignSelf: 'center',
    gap: 16,
    marginTop: 22,
    maxWidth: 920,
    width: '100%',
  },
  providerCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  providerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 58,
  },
  avatarImage: {
    height: 58,
    width: 58,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  rating: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  reviews: {
    color: '#6b7b6f',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeVerified: {
    backgroundColor: '#d4f1d8',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeVerifiedText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  experience: {
    color: '#4c6053',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },
  cardFooter: {
    alignItems: 'flex-end',
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
  },
  footerDetails: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  locationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  location: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    minWidth: 0,
  },
  price: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  contactButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  requestsGrid: {
    alignSelf: 'center',
    gap: 16,
    marginTop: 24,
    maxWidth: 820,
    width: '100%',
  },
  requestCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  requestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  requestMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  requestDetails: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 18,
    gap: 8,
    marginTop: 16,
    padding: 14,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  detailText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  denyButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  denyButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 22,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  historyBlock: {
    alignSelf: 'center',
    gap: 10,
    marginTop: 24,
    maxWidth: 820,
    width: '100%',
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 16,
  },
  historyTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  historyTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '900',
  },
  acceptedText: {
    color: colors.primary,
  },
  deniedText: {
    color: colors.danger,
  },
  cardPressed: {
    opacity: 0.75,
  },
});

export default Services;
