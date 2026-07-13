import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, shadows } from '../../src/styles/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';

function getStatsForRole(role, rating = 0, counts = {}) {
  const baseStats = [
    { icon: 'calendar-outline', value: String(counts.upcoming || 0), label: 'Proximas reservas' },
    {
      icon: role === 'user' ? 'bookmark-outline' : 'clipboard-list-outline',
      value: String(role === 'walker' ? (counts.pending || 0) : 0),
      label: role === 'user' ? 'Servicios guardados' : 'Solicitudes pendientes',
      library: role === 'user' ? 'ion' : 'material',
    },
  ];

  if (role === 'walker') {
    baseStats.push({ icon: 'star-outline', value: Number(rating || 0).toFixed(1), label: 'Tu calificacion' });
  }

  return baseStats;
}

function getCardsForRole(role) {
  if (role === 'walker') {
    return [
      {
        icon: 'clipboard-list-outline',
        library: 'material',
        title: 'Solicitudes',
        text: 'Revisa nuevas solicitudes de servicio y decide cuales aceptar o denegar.',
        action: 'Ver solicitudes',
        route: '/(tabs)/services',
      },
      {
        icon: 'analytics-outline',
        title: 'Tu actividad',
        text: 'Consulta servicios aceptados, solicitudes recientes y tu historial.',
        action: 'Ver actividad',
        route: '/(tabs)/profile',
      },
      {
        icon: 'person-circle-outline',
        title: 'Tu perfil',
        text: 'Actualiza tus datos, experiencia y preferencias para recibir mejores solicitudes.',
        action: 'Ir al perfil',
        route: '/(tabs)/profile',
      },
    ];
  }

  return [
    {
      icon: 'paw-outline',
      library: 'material',
      title: 'Servicios destacados',
      text: 'Encuentra paseadores, cuidadores y las mejores opciones para tu mascota en tu zona.',
      action: 'Explorar',
      route: '/(tabs)/services',
    },
    {
      icon: 'time-outline',
      title: 'Tu actividad',
      text: 'Revisa tus proximas reservas, historial de servicios y manten todo bajo control.',
      action: 'Ver actividad',
      route: '/(tabs)/profile',
    },
    {
      icon: 'person-circle-outline',
      title: 'Tu perfil',
      text: 'Accede a tu informacion, mascotas registradas y preferencias.',
      action: 'Ir al perfil',
      route: '/(tabs)/profile',
    },
  ];
}

const benefits = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Seguridad garantizada',
    text: 'Todos nuestros cuidadores estan verificados y calificados.',
  },
  {
    icon: 'star-outline',
    title: 'Calificaciones reales',
    text: 'Lee opiniones de otros duenos y toma decisiones informadas.',
  },
  {
    icon: 'headset-outline',
    title: 'Soporte 24/7',
    text: 'Estamos aqui para ayudarte en cualquier momento.',
  },
];

function AppIcon({ library = 'ion', name, size = 24, color = colors.primary }) {
  if (library === 'material') {
    return <MaterialCommunityIcons color={color} name={name} size={size} />;
  }

  return <Ionicons color={color} name={name} size={size} />;
}

function Home() {
  const router = useRouter();
  const { user, handleUserUpdate } = useAuth();
  const displayName = user?.name || 'Usuario Walkwi';
  const role = user?.role || 'user';
  const [walkerCounts, setWalkerCounts] = useState({ upcoming: 0, pending: 0 });
  const stats = getStatsForRole(role, user?.rating, walkerCounts);
  const cards = getCardsForRole(role);
  const isProvider = role === 'walker';
  const [upcomingBooking, setUpcomingBooking] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUpcoming() {
      try {
        const profileData = await apiRequest('/api/auth/me');
        if (mounted && profileData.user) await handleUserUpdate(profileData.user);
        const data = await apiRequest('/api/bookings/me/upcoming');
        if (mounted) setUpcomingBooking(data);
        if (role === 'walker') {
          const [pending, accepted, inProgress] = await Promise.all([
            apiRequest('/api/bookings?status=pending'),
            apiRequest('/api/bookings?status=accepted'),
            apiRequest('/api/bookings?status=in_progress'),
          ]);
          const now = Date.now();
          const upcoming = [...accepted, ...inProgress].filter((booking) => new Date(booking.startTime).getTime() >= now).length;
          if (mounted) setWalkerCounts({ pending: pending.length, upcoming });
        }
      } catch (requestError) {
        console.error('No se pudo actualizar el resumen de inicio:', requestError);
      }
    }
    fetchUpcoming();
    return () => { mounted = false; };
  }, []);

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return `Hoy, ${time}`;
    if (diffDays === 1) return `Mañana, ${time}`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' }) + `, ${time}`;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Bienvenido a Walkwi</Text>
        <Text style={styles.title}>Hola, {displayName}</Text>
        <Text style={styles.heroCopy}>
          {isProvider
            ? 'Gestiona tus solicitudes, revisa tu actividad y mantente disponible para nuevos servicios.'
            : 'Conecta con paseadores y cuidadores de mascotas de confianza en tu zona.'}
        </Text>
      </View>

      {upcomingBooking && (
        <Pressable
          onPress={() => router.push('/(tabs)/agenda')}
          style={({ pressed }) => [styles.upcomingCard, pressed && styles.cardPressed]}
        >
          <View style={styles.upcomingHeader}>
            <Ionicons name="paw-outline" size={20} color={colors.primary} />
            <Text style={styles.upcomingLabel}>Próximo paseo</Text>
          </View>
          <Text style={styles.upcomingDate}>{formatDate(upcomingBooking.startTime)}</Text>
          <Text style={styles.upcomingPerson}>
            {role === 'user' ? upcomingBooking.walker?.name : upcomingBooking.client?.name}
          </Text>
          <Text style={styles.upcomingLocation}>{upcomingBooking.location?.address}</Text>
          <View style={styles.upcomingLinkRow}>
            <Text style={styles.upcomingLink}>Ver detalles</Text>
            <Ionicons color={colors.primary} name="arrow-forward" size={14} />
          </View>
        </Pressable>
      )}

      <View style={styles.statsContainer}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <AppIcon library={stat.library} name={stat.icon} size={22} />
            <Text style={styles.statNumber}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardsGrid}>
        {cards.map((card) => (
          <Pressable
            key={card.title}
            onPress={() => router.push(card.route)}
            style={({ pressed }) => [styles.dashboardCard, pressed && styles.cardPressed]}
          >
            <View style={styles.cardIconWrap}>
              <AppIcon library={card.library} name={card.icon} size={28} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardText}>{card.text}</Text>
            <View style={styles.cardLinkRow}>
              <Text style={styles.cardLink}>{card.action}</Text>
              <Ionicons color={colors.primary} name="arrow-forward" size={16} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Por que Walkwi?</Text>
        <View style={styles.benefitsList}>
          {benefits.map((benefit) => (
            <View key={benefit.title} style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <Ionicons color={colors.primary} name={benefit.icon} size={22} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
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
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 38,
  },
  heroCopy: {
    color: '#4c6053',
    fontSize: 16,
    lineHeight: 27,
    marginTop: 14,
  },
  upcomingCard: {
    ...shadows.card,
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(83, 128, 93, 0.15)',
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 720,
    marginTop: 20,
    padding: 18,
    width: '100%',
  },
  upcomingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  upcomingLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  upcomingDate: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  upcomingPerson: {
    color: '#15382d',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  upcomingLocation: {
    color: '#4c6053',
    fontSize: 14,
    marginTop: 2,
  },
  upcomingLinkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  upcomingLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  statsContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    maxWidth: 720,
    width: '100%',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  statNumber: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },
  statLabel: {
    color: '#4c6053',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  cardsGrid: {
    alignSelf: 'center',
    gap: 16,
    marginTop: 24,
    maxWidth: 720,
    width: '100%',
  },
  dashboardCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    marginBottom: 12,
    width: 52,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 8,
  },
  cardText: {
    color: '#4c6053',
    fontSize: 15,
    lineHeight: 24,
  },
  cardLinkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  cardLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  infoSection: {
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 107, 74, 0.04)',
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 28,
    maxWidth: 720,
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 18,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  benefitIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  benefitCopy: {
    flex: 1,
  },
  benefitTitle: {
    color: '#15382d',
    fontSize: 16,
    fontWeight: '900',
  },
  benefitText: {
    color: '#4c6053',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
});

export default Home;
