import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/styles/theme';

const sections = [
  {
    title: 'Informacion que recopilamos',
    icon: 'document-text-outline',
    content:
      'Recopilamos informacion que proporcionas directamente al crear tu cuenta, como nombre, correo electronico, telefono, fotos de perfil y datos de tus mascotas. Tambien recopilamos ubicacion GPS durante los paseos activos para rastreo en tiempo real, y datos de uso de la aplicacion para mejorar el servicio.',
  },
  {
    title: 'Como usamos tu informacion',
    icon: 'settings-outline',
    content:
      'Usamos tu informacion para: conectar clientes con paseadores, procesar reservas y pagos, enviar notificaciones locales sobre tus paseos (recordatorios, estados de reserva), mejorar la experiencia en la plataforma, garantizar la seguridad de mascotas durante el servicio, y comunicarnos contigo sobre actualizaciones importantes.',
  },
  {
    title: 'Comparticion de datos',
    icon: 'people-outline',
    content:
      'Tu informacion se comparte solo con las necesarias para prestar el servicio: el paseador asignado recibe tu nombre, ubicacion de recogida y datos de la mascota. No vendemos tu informacion a terceros. Podemos compartir datos anonimos y agregados para fines estadisticos.',
  },
  {
    title: 'Seguridad de los datos',
    icon: 'lock-closed-outline',
    content:
      'Tus datos se almacenan de forma segura en servidores protegidos con encriptacion. Utilizamos protocolos de seguridad estandar de la industria para proteger tu informacion personal y de pago.',
  },
  {
    title: 'Tus derechos',
    icon: 'finger-print-outline',
    content:
      'Puedes acceder, actualizar o eliminar tu informacion personal en cualquier momento desde tu perfil. Puedes solicitar una copia de todos tus datos o solicitar la eliminacion completa de tu cuenta y datos asociados.',
  },
  {
    title: 'Eliminar mi cuenta',
    icon: 'trash-outline',
    content:
      'Para eliminar tu cuenta, contacta a nuestro equipo de soporte a traves de la seccion Ayuda y soporte. Se eliminaran todos tus datos personales, historial de reservas y mascotas registradas dentro de los 30 dias habiles siguientes a la solicitud.',
  },
];

export default function Privacy() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(null);

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
        <Text style={styles.backButtonText}>Volver</Text>
      </Pressable>

      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>Legal</Text>
        <Text style={styles.title}>Politica de privacidad</Text>
        <Text style={styles.heroCopy}>
          Tu privacidad es importante. Conoce como Walkwi recopila, usa y protege tu informacion personal.
        </Text>
        <Text style={styles.lastUpdated}>Ultima actualizacion: Julio 2026</Text>
      </View>

      <View style={styles.sections}>
        {sections.map((section, i) => (
          <Pressable
            key={i}
            onPress={() => toggle(i)}
            style={({ pressed }) => [styles.sectionCard, pressed && styles.pressed]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name={section.icon} size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </View>
            {expanded === i && (
              <Text style={styles.sectionContent}>{section.content}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.contactBlock}>
        <Text style={styles.contactTitle}>Tienes preguntas?</Text>
        <Text style={styles.contactCopy}>
          Si tienes dudas sobre esta politica, contactanos a traves de Ayuda y soporte.
        </Text>
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
  heroBlock: {
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  heroCopy: {
    color: '#4c6053',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
  },
  lastUpdated: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  sections: {
    gap: 10,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  sectionContent: {
    color: '#4c6053',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  contactBlock: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 20,
    padding: 20,
  },
  contactTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  contactCopy: {
    color: '#4c6053',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.75,
  },
});
