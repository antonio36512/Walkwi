import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../styles/theme';

const providers = [
  {
    id: 1,
    name: 'Carlos Rodriguez',
    rating: 4.9,
    reviews: 127,
    experience:
      'Experiencia de 5 anos paseando perros de todas las razas. Especializado en perros grandes y activos.',
    location: 'Via Argentina',
    price: '$15/paseo',
    badge: 'Verificado',
  },
  {
    id: 2,
    name: 'Maria Lopez',
    rating: 4.8,
    reviews: 98,
    experience:
      'Paseadora con 3 anos de experiencia. Adoro caminar y socializar perros pequenos.',
    location: 'El Cangrejo',
    price: '$12/paseo',
    badge: 'Verificado',
  },
  {
    id: 3,
    name: 'Juan Garcia',
    rating: 4.7,
    reviews: 84,
    experience:
      'Paseador profesional. Ofrezco paseos diarios, adiestramiento basico y cuidado personalizado.',
    location: 'Obarrio',
    price: '$14/paseo',
    badge: 'Superanfitrion',
  },
  {
    id: 4,
    name: 'Sofia Martin',
    rating: 4.9,
    reviews: 156,
    experience:
      'Especialista en paseos para mascotas con necesidades especiales. Entrenamiento positivo y mucho amor.',
    location: 'San Francisco',
    price: '$16/paseo',
    badge: 'Verificado',
  },
];

const initialRequests = [
  {
    id: 1,
    client: 'Ana Perez',
    date: 'Hoy, 4:30 p.m.',
    duration: '45 minutos',
    location: 'Via Argentina',
    pet: 'Luna',
    service: 'Paseo',
    notes: 'Luna es tranquila, pero se asusta con motos.',
  },
  {
    id: 2,
    client: 'Miguel Santos',
    date: 'Manana, 9:00 a.m.',
    duration: '1 hora',
    location: 'El Cangrejo',
    pet: 'Rocky',
    service: 'Paseo',
    notes: 'Necesita agua fresca y una caminata corta.',
  },
  {
    id: 3,
    client: 'Carolina Diaz',
    date: 'Viernes, 6:00 p.m.',
    duration: '30 minutos',
    location: 'Obarrio',
    pet: 'Milo',
    service: 'Paseo',
    notes: 'Milo convive bien con otros perros.',
  },
];

const locations = ['Todas', 'Via Argentina', 'El Cangrejo', 'Obarrio', 'San Francisco'];

function Services({ user }) {
  const role = user?.role || 'user';

  if (role === 'walker') {
    return <ProviderRequests />;
  }

  return <UserServices />;
}

function ProviderRequests() {
  const [requests, setRequests] = useState(
    initialRequests.map((request) => ({ ...request, status: 'pending' })),
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
        <Text style={styles.eyebrow}>Solicitudes de paseo</Text>
        <Text style={styles.title}>Solicitudes por revisar</Text>
        <Text style={styles.heroCopy}>
          Acepta o deniega solicitudes de paseo segun tu disponibilidad.
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
            <Text style={styles.emptyCopy}>Cuando recibas nuevas solicitudes apareceran aqui.</Text>
          </View>
        )}
      </View>

      {decidedRequests.length > 0 && (
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
      )}
    </ScrollView>
  );
}

function UserServices() {
  const [selectedLocation, setSelectedLocation] = useState('Todas');

  const filteredProviders = useMemo(
    () =>
      providers.filter((provider) =>
        selectedLocation === 'Todas' ? true : provider.location === selectedLocation,
      ),
    [selectedLocation],
  );

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Paseadores</Text>
        <Text style={styles.title}>Encuentra tu paseador ideal</Text>
        <Text style={styles.heroCopy}>
          Conecta con paseadores verificados cerca de ti para paseos diarios seguros y divertidos.
        </Text>
      </View>

      <View style={styles.filterBlock}>
        <View style={styles.filterLabelRow}>
          <Ionicons name="location-outline" size={17} color={colors.primary} />
          <Text style={styles.filterLabel}>Ubicacion</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {locations.map((location) => {
              const active = selectedLocation === location;
              return (
                <Pressable
                  key={location}
                  onPress={() => setSelectedLocation(location)}
                  style={[styles.chip, active && styles.activeChip]}
                >
                  <Text style={[styles.chipText, active && styles.activeChipText]}>
                    {location}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.providersGrid}>
        {filteredProviders.length > 0 ? (
          filteredProviders.map((provider) => (
            <View key={provider.id} style={styles.providerCard}>
              <View style={styles.providerHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={28} color={colors.primary} />
                </View>

                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={15} color={colors.primary} />
                    <Text style={styles.rating}>{provider.rating}</Text>
                    <Text style={styles.reviews}>({provider.reviews} resenas)</Text>
                  </View>
                </View>

                <View style={[styles.badge, badgeStyle(provider.badge)]}>
                  <Text style={[styles.badgeText, badgeTextStyle(provider.badge)]}>
                    {provider.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.experience}>{provider.experience}</Text>

              <View style={styles.cardFooter}>
                <View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                    <Text style={styles.location}>{provider.location}</Text>
                  </View>
                  <Text style={styles.price}>{provider.price}</Text>
                </View>

                <Pressable style={styles.contactButton}>
                  <Ionicons name="chatbubble-outline" size={17} color="#ffffff" />
                  <Text style={styles.contactButtonText}>Contactar</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="dog-side" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>Sin paseadores en esta zona</Text>
            <Text style={styles.emptyCopy}>Prueba con otra ubicacion para ver mas opciones.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function badgeStyle(badge) {
  if (badge === 'Nuevo') return styles.badgeNew;
  if (badge === 'Superanfitrion') return styles.badgeSuper;
  return styles.badgeVerified;
}

function badgeTextStyle(badge) {
  if (badge === 'Nuevo') return styles.badgeNewText;
  if (badge === 'Superanfitrion') return styles.badgeSuperText;
  return styles.badgeVerifiedText;
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
  cardPressed: {
    opacity: 0.75,
  },
  filterBlock: {
    alignSelf: 'center',
    marginTop: 24,
    maxWidth: 720,
    width: '100%',
  },
  filterLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterLabel: {
    color: '#3f4f46',
    fontSize: 15,
    fontWeight: '900',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  chip: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  activeChipText: {
    color: '#ffffff',
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
  badge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  badgeVerified: {
    backgroundColor: '#d4f1d8',
  },
  badgeVerifiedText: {
    color: colors.primary,
  },
  badgeNew: {
    backgroundColor: colors.warningSoft,
  },
  badgeNewText: {
    color: colors.warning,
  },
  badgeSuper: {
    backgroundColor: '#fce7f3',
  },
  badgeSuperText: {
    color: '#be185d',
  },
  experience: {
    color: '#4c6053',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },
  cardFooter: {
    alignItems: 'center',
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  location: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
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
});

export default Services;
