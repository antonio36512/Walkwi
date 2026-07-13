import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from '../services/api';
import { saveSession } from '../storage/session';
import { colors, shadows } from '../styles/theme';

function Login({ navigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      await saveSession(data.token, data.user);
      setMessage('Inicio de sesión correcto.');
      onLogin(data.user);
    } catch (requestError) {
      setError(requestError.message || 'Error de conexión. Intenta otra vez.');
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
          <Image source={require("../assets/LogoNombre.png")} style={styles.logo} />

          <View style={styles.hero}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Inicia sesión en tu cuenta o crea una nueva para continuar.
            </Text>
          </View>

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

            <View style={styles.passwordLabel}>
              <Text style={styles.label}>Contraseña</Text>
              <Pressable onPress={() => {}}>
                <Text style={styles.linkText}>¿Olvidaste?</Text>
              </Pressable>
            </View>
            <View style={styles.passwordInput}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#8fa899"
                secureTextEntry={!showPassword}
                style={styles.inputInline}
                value={password}
              />
              <Pressable onPress={() => setShowPassword((current) => !current)}>
                <Text style={styles.toggleText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
              </Pressable>
            </View>

            <Pressable
              disabled={loading}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || loading) && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Text>
            </Pressable>

            {message ? <Text style={styles.successMessage}>{message}</Text> : null}
            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.mutedText}>¿No tienes cuenta?</Text>
            <Pressable onPress={() => navigate('register')}>
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Política de privacidad</Text>
          <Text style={styles.footerText}>Términos del servicio</Text>
          <Text style={styles.footerText}>Centro de ayuda</Text>
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
    alignSelf: "center",
    marginBottom: 15,
    resizeMode: "contain",
  },
  hero: {
    gap: 14,
  },
  title: {
    color: '#11231d',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 42,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 26,
  },
  form: {
    gap: 12,
    marginTop: 28,
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
  passwordLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  passwordInput: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  inputInline: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
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
    color: '#4e5a50',
    fontSize: 15,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#7a8578',
    fontSize: 12,
  },
});

export default Login;