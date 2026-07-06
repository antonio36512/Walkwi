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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiRequest } from '../../src/services/api';
import { colors, shadows } from '../../src/styles/theme';

const roles = [
  { value: 'user', title: 'Usuario', icon: 'person-outline', family: 'ion' },
  { value: 'walker', title: 'Paseador', icon: 'dog-side', family: 'material' },
];

function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState('');
  const [profilePhotoMenuVisible, setProfilePhotoMenuVisible] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const showProviderFields = role === 'walker';

  const renderRoleIcon = (item, active) => {
    const iconColor = active ? colors.primary : colors.textMuted;

    if (item.family === 'material') {
      return <MaterialCommunityIcons name={item.icon} size={28} color={iconColor} />;
    }

    return <Ionicons name={item.icon} size={28} color={iconColor} />;
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setLocation('');
    setExperience('');
    setProfilePhotoUri('');
    setProfilePhotoMenuVisible(false);
    setRole('user');
  };

  const pickProfilePhoto = async (source) => {
    setError('');
    setProfilePhotoMenuVisible(false);

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(
        source === 'camera'
          ? 'Necesitas permitir acceso a la camara.'
          : 'Necesitas permitir acceso a la galeria.',
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          });

    if (!result.canceled) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const body = {
      email: email.trim(),
      name: name.trim(),
      password,
      profilePhotoUri,
      role,
    };

    if (showProviderFields) {
      body.location = location.trim();
      body.experience = experience.trim();
    }

    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setMessage(data.message || 'Cuenta creada con exito. Ya puedes iniciar sesion.');
      resetForm();
    } catch (requestError) {
      setError(requestError.message || 'Error de conexion. Intenta de nuevo.');
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
          <Image source={require("../../src/assets/LogoNombre.png")} style={styles.logo} />

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Registrate como usuario o paseador de mascotas en Walkwi.
          </Text>

          <View style={styles.form}>
            <View style={styles.profilePhotoBlock}>
              <Pressable
                onPress={() => setProfilePhotoMenuVisible((current) => !current)}
                style={({ pressed }) => [styles.profilePhotoButton, pressed && styles.buttonPressed]}
              >
                {profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.profilePhotoPreview} />
                ) : (
                  <View style={styles.profilePhotoDefault}>
                    <Ionicons name="person-outline" size={38} color={colors.primary} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.profilePhotoTitle}>Foto de perfil</Text>
              <Text style={styles.profilePhotoHint}>
                Toca la imagen para tomar una foto o elegir desde galeria.
              </Text>

              {profilePhotoMenuVisible ? (
                <View style={styles.profilePhotoMenu}>
                  <Pressable
                    onPress={() => pickProfilePhoto('camera')}
                    style={styles.profilePhotoMenuButton}
                  >
                    <Ionicons name="camera-outline" size={18} color={colors.primary} />
                    <Text style={styles.profilePhotoMenuText}>Tomar foto con camara</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => pickProfilePhoto('gallery')}
                    style={styles.profilePhotoMenuButton}
                  >
                    <Ionicons name="image-outline" size={18} color={colors.primary} />
                    <Text style={styles.profilePhotoMenuText}>Seleccionar desde galeria</Text>
                  </Pressable>
                  {profilePhotoUri ? (
                    <Pressable
                      onPress={() => {
                        setProfilePhotoUri('');
                        setProfilePhotoMenuVisible(false);
                      }}
                      style={styles.profilePhotoRemoveButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      <Text style={styles.profilePhotoRemoveText}>Eliminar foto</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#8fa899"
              style={styles.input}
              value={name}
            />

            <Text style={styles.label}>Correo electronico</Text>
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

            <Text style={styles.label}>Que tipo de usuario eres?</Text>
            <View style={styles.roles}>
              {roles.map((item) => {
                const active = role === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setRole(item.value)}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                  >
                    {renderRoleIcon(item, active)}
                    <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
                      {item.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {showProviderFields ? (
              <>
                <Text style={styles.label}>Ubicacion</Text>
                <TextInput
                  onChangeText={setLocation}
                  placeholder="Tu ciudad o zona"
                  placeholderTextColor="#8fa899"
                  style={styles.input}
                  value={location}
                />

                <Text style={styles.label}>Experiencia y descripcion</Text>
                <TextInput
                  multiline
                  onChangeText={setExperience}
                  placeholder="Cuentanos sobre tu experiencia cuidando mascotas..."
                  placeholderTextColor="#8fa899"
                  style={[styles.input, styles.textarea]}
                  textAlignVertical="top"
                  value={experience}
                />
              </>
            ) : null}

            <Text style={styles.label}>Contrasena</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor="#8fa899"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <Pressable
              disabled={loading}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || loading) && styles.buttonPressed,
              ]}
            >
              <Ionicons name="person-add-outline" size={19} color="#ffffff" />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Text>
            </Pressable>

            {message ? <Text style={styles.successMessage}>{message}</Text> : null}
            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.mutedText}>Ya tienes cuenta?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.registerLink}>Iniciar sesion</Text>
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
    maxWidth: 500,
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
  title: {
    color: '#11231d',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 40,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 26,
    marginTop: 14,
  },
  form: {
    gap: 12,
    marginTop: 24,
  },
  profilePhotoBlock: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: 'rgba(83, 128, 93, 0.14)',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  profilePhotoButton: {
    borderRadius: 44,
    overflow: 'hidden',
  },
  profilePhotoPreview: {
    backgroundColor: colors.primarySoft,
    borderRadius: 44,
    height: 88,
    resizeMode: 'cover',
    width: 88,
  },
  profilePhotoDefault: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 88,
  },
  profilePhotoTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  profilePhotoHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: 'center',
  },
  profilePhotoMenu: {
    gap: 8,
    marginTop: 14,
    width: '100%',
  },
  profilePhotoMenuButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  profilePhotoMenuText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  profilePhotoRemoveButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  profilePhotoRemoveText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
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
  textarea: {
    minHeight: 110,
  },
  roles: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: '#f8fbf7',
    borderColor: '#dce4dc',
    borderRadius: 18,
    borderWidth: 2,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 96,
    padding: 12,
  },
  roleCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  roleTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  roleTitleActive: {
    color: colors.primary,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
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
});

export default Register;
