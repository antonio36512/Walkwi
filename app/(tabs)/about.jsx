import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/styles/theme';
import { Image } from 'react-native';

export default function About() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </Pressable>

      <View style={styles.logoSection}>
        <View style={styles.logoWrap}>
          <Image source={require('../../src/assets/LogoNombre.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Que es Walkwi?</Text>
        <Text style={styles.cardText}>
          Walkwi es la plataforma que conecta duenos de mascotas con paseadores de confianza en Panama. Encuentra paseadores verificados, agenda paseos seguros y sigue en tiempo real el paseo de tu mascota.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nuestra mision</Text>
        <Text style={styles.cardText}>
          Brindar tranquilidad a los duenos de mascotas ofreciendo un servicio de paseo seguro, confiable y transparente. Cada paseador esta verificado y calificado por la comunidad.
        </Text>
      </View>

      <View style={styles.featuresGrid}>
        <View style={styles.featureItem}>
          <View style={styles.featureIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Seguro</Text>
          <Text style={styles.featureText}>Paseadores verificados y seguimiento en vivo</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIconWrap}>
            <Ionicons name="star-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Confiable</Text>
          <Text style={styles.featureText}>Calificaciones reales de la comunidad</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIconWrap}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Flexible</Text>
          <Text style={styles.featureText}>Agenda cuando lo necesites</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIconWrap}>
            <Ionicons name="heart-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Cuidado</Text>
          <Text style={styles.featureText}>Tu mascota en las mejores manos</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Desarrollado por</Text>
        <Text style={styles.cardText}>Walkwi Team</Text>
        <Text style={[styles.cardText, { marginTop: 4, color: colors.textMuted }]}>Panama, 2026</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/privacy')}
        style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={styles.linkText}>Politica de privacidad</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 60,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  logo: {
    height: 70,
    width: 70,
  },
  version: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  cardText: {
    color: '#4c6053',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  featureItem: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    width: '48%',
  },
  featureIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
    marginBottom: 10,
  },
  featureTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  featureText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  linkCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
