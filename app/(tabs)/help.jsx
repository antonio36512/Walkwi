import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/styles/theme';

async function openPhone(url) {
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No disponible', 'No se puede realizar llamadas desde este dispositivo.');
    }
  } catch {
    Alert.alert('Error', 'No se pudo abrir la aplicacion de llamadas.');
  }
}

const faqs = [
  {
    q: 'Como reservo un paseo?',
    a: 'Ve a la pestana Servicios, selecciona un paseador, elige tu mascota, fecha, hora y duracion, confirma la direccion y lista. Recibiras una confirmacion cuando el paseador acepte.',
  },
  {
    q: 'Como cancelo una reserva?',
    a: 'En tu Agenda, selecciona la reserva y toca "Cancelar". Debes indicar un motivo. Si el paseo ya esta en curso, no se podra cancelar.',
  },
  {
    q: 'Como califico al paseador?',
    a: 'Despues de que el paseo se marca como completado, aparece un boton "Calificar" en tu Agenda. Selecciona de 1 a 5 estrellas y deja un comentario opcional.',
  },
  {
    q: 'Como cambio mi contrasena?',
    a: 'Ve a tu Perfil, selecciona "Cambiar contrasena", ingresa tu contrasena actual y la nueva. Debe tener al menos 6 caracteres.',
  },
  {
    q: 'Como reporto un problema con un paseo?',
    a: 'En tu Agenda, en la reserva completada, toca "Reportar". Selecciona el motivo, describe lo sucedido (minimo 10 caracteres) y envia. Nuestro equipo lo revisara.',
  },
  {
    q: 'Puedo reservar si ya tengo un paseo activo?',
    a: 'No. Debes completar o cancelar tu paseo activo antes de reservar otro. Esto garantiza la seguridad de tu mascota.',
  },
  {
    q: 'Como funciona el seguimiento en vivo?',
    a: 'Cuando el paseador inicia el paseo, puedes ver su ubicacion en tiempo real desde tu Agenda, en la pestana "En progreso". Tocando "Ver paseo en vivo" accedes al mapa.',
  },
  {
    q: 'Que hago si olvide mi contrasena?',
    a: 'En la pantalla de inicio de sesion, toca "Olvidaste tu contrasena?". Ingresa tu correo, recibiras un codigo de verificacion para crear una nueva contrasena.',
  },
];

export default function Help() {
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
        <Text style={styles.eyebrow}>Soporte</Text>
        <Text style={styles.title}>Ayuda y soporte</Text>
        <Text style={styles.heroCopy}>
          Encuentra respuestas a las preguntas mas frecuentes o contacta a nuestro equipo.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Preguntas frecuentes</Text>
      <View style={styles.faqs}>
        {faqs.map((faq, i) => (
          <Pressable
            key={i}
            onPress={() => toggle(i)}
            style={({ pressed }) => [styles.faqCard, pressed && styles.pressed]}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </View>
            {expanded === i && (
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Contacto</Text>
      <View style={styles.contactCards}>
        <Pressable
          onPress={() => Linking.openURL('mailto:soporte@walkwi.com')}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
        >
          <View style={styles.contactIconWrap}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Correo de soporte</Text>
            <Text style={styles.contactValue}>soporte@walkwi.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => openPhone('tel:+50760001234')}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
        >
          <View style={styles.contactIconWrap}>
            <Ionicons name="call-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Telefono</Text>
            <Text style={styles.contactValue}>+507 6000-1234</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.contactCard}>
          <View style={styles.contactIconWrap}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Horario de atencion</Text>
            <Text style={styles.contactValue}>Lun - Vie: 8:00 a.m. - 6:00 p.m.</Text>
          </View>
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
  sectionLabel: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  faqs: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  faqHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    color: '#4c6053',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  contactCards: {
    gap: 10,
  },
  contactCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  contactIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  contactTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  contactValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
