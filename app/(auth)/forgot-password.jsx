import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../src/services/api';
import { colors, shadows } from '../../src/styles/theme';

function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage('Correo enviado. Revisa tu bandeja de entrada.');
    } catch (requestError) {
      setError(requestError.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), token: token.trim(), newPassword }),
      });
      setMessage('Contraseña actualizada. Ahora puedes iniciar sesión.');
      setToken('');
      setNewPassword('');
    } catch (requestError) {
      setError(requestError.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Image source={require('../../src/assets/LogoNombre.png')} style={styles.logo} />
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo para recibir un token de recuperación y cambiar tu contraseña.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="alex@example.com"
              placeholderTextColor="#8fa899"
              style={styles.input}
              value={email}
            />

            <Pressable
              disabled={loading}
              onPress={handleRequestToken}
              style={({ pressed }) => [styles.secondaryButton, (pressed || loading) && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>{loading ? 'Generando token...' : 'Generar token'}</Text>
            </Pressable>

            <Text style={styles.label}>Token de recuperación</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setToken}
              placeholder="123456"
              placeholderTextColor="#8fa899"
              style={styles.input}
              value={token}
            />

            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              autoCapitalize="none"
              secureTextEntry
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor="#8fa899"
              style={styles.input}
              value={newPassword}
            />

            <Pressable
              disabled={loading}
              onPress={handleResetPassword}
              style={({ pressed }) => [styles.primaryButton, (pressed || loading) && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Restableciendo...' : 'Restablecer contraseña'}</Text>
            </Pressable>

            {message ? <Text style={styles.successMessage}>{message}</Text> : null}
            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.mutedText}>¿Ya recuerdas tu contraseña?</Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.registerLink}>Volver al login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    ...shadows.card,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(113, 146, 114, 0.16)',
    borderRadius: 28,
    borderWidth: 1,
    maxWidth: 460,
    padding: 28,
    width: '100%',
  },
  logo: {
    width: 220,
    height: 70,
    alignSelf: 'center',
    marginBottom: 15,
    resizeMode: 'contain',
  },
  title: {
    color: '#11231d',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 39,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
  },
  form: {
    gap: 12,
    marginTop: 24,
  },
  label: {
    color: '#324036',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginTop: 14,
    paddingVertical: 17,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 14,
    paddingVertical: 17,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  successMessage: {
    color: '#1f6d4a',
    fontWeight: '700',
    marginTop: 6,
  },
  errorMessage: {
    color: '#aa3534',
    fontWeight: '700',
    marginTop: 6,
  },
  registerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 24,
  },
  mutedText: {
    color: colors.textMuted,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '900',
  },
});

export default ForgotPassword;
