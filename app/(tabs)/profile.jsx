import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapPicker from '../../src/components/MapPicker';
import { apiRequest } from '../../src/services/api';
import { clearSession, getStoredToken } from '../../src/storage/session';
import { colors, shadows } from '../../src/styles/theme';
import { useAuth } from '../../src/contexts/AuthContext';

const options = [
  { label: 'Editar perfil', icon: 'create-outline' },
  { label: 'Cambiar contrasena', icon: 'lock-closed-outline' },
  { label: 'Notificaciones', icon: 'notifications-outline' },
  { label: 'Privacidad', icon: 'shield-checkmark-outline' },
  { label: 'Ayuda y soporte', icon: 'help-circle-outline' },
  { label: 'Acerca de', icon: 'information-circle-outline' },
];

const createEmptyPet = () => ({
  age: '',
  breed: '',
  careNotes: '',
  insured: false,
  name: '',
  photoUri: '',
  weight: '',
});

function normalizePets(profile) {
  if (Array.isArray(profile.pets) && profile.pets.length > 0) return profile.pets;
  if (profile.pet?.name) return [profile.pet];
  return [];
}

function Profile() {
  const router = useRouter();
  const { user, handleLogout: authLogout, handleUserUpdate } = useAuth();

  const profile = user || { name: 'Usuario Walkwi', email: 'usuario@walkwi.com' };
  const pets = normalizePets(profile);
  const canManagePets = profile.role === 'user';
  const [draftPet, setDraftPet] = useState(createEmptyPet());
  const [editingIndex, setEditingIndex] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [petPhotoMenuVisible, setPetPhotoMenuVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState({
    experience: profile.experience || '',
    latitude: profile.latitude || null,
    location: profile.location || '',
    longitude: profile.longitude || null,
    name: profile.name || '',
    phone: profile.phone || '',
    profilePhotoUri: profile.profilePhotoUri || '',
  });
  const [petError, setPetError] = useState('');
  const [petMessage, setPetMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = async () => {
    await clearSession();
    authLogout();
  };

  const openAddForm = () => {
    setDraftPet(createEmptyPet());
    setEditingIndex(null);
    setPetError('');
    setPetMessage('');
    setPetPhotoMenuVisible(false);
    setFormVisible(true);
  };

  const openEditForm = (pet, index) => {
    setDraftPet({
      age: pet.age || '',
      breed: pet.breed || '',
      careNotes: pet.careNotes || '',
      insured: Boolean(pet.insured),
      name: pet.name || '',
      photoUri: pet.photoUri || '',
      weight: pet.weight || '',
    });
    setEditingIndex(index);
    setPetError('');
    setPetMessage('');
    setPetPhotoMenuVisible(false);
    setFormVisible(true);
  };

  const updateDraftPet = (field, value) => {
    setDraftPet((currentPet) => ({ ...currentPet, [field]: value }));
  };

  const openProfileEditor = () => {
    setDraftProfile({
      experience: profile.experience || '',
      latitude: profile.latitude || null,
      location: profile.location || '',
      longitude: profile.longitude || null,
      name: profile.name || '',
      phone: profile.phone || '',
      profilePhotoUri: profile.profilePhotoUri || '',
    });
    setProfileError('');
    setProfileMessage('');
    setEditMode(true);
  };

  const cancelProfileEditor = () => {
    setDraftProfile({
      experience: profile.experience || '',
      latitude: profile.latitude || null,
      location: profile.location || '',
      longitude: profile.longitude || null,
      name: profile.name || '',
      phone: profile.phone || '',
      profilePhotoUri: profile.profilePhotoUri || '',
    });
    setProfileError('');
    setEditMode(false);
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordMessage('');
    setChangePasswordVisible(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setSavingPassword(true);

    try {
      await apiRequest('/api/auth/me/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setPasswordMessage('Contraseña actualizada con éxito.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setPasswordError(requestError.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  };

  const updateDraftProfile = (field, value) => {
    setDraftProfile((currentProfile) => ({ ...currentProfile, [field]: value }));
  };

  const pickDraftProfilePhoto = async (source) => {
    setProfileError('');

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setProfileError(
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
      updateDraftProfile('profilePhotoUri', result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    setProfileError('');
    setProfileMessage('');

    if (!draftProfile.name.trim()) {
      setProfileError('El nombre es obligatorio.');
      return;
    }

    setSavingProfile(true);

    try {
      const token = await getStoredToken();
      const data = await apiRequest('/api/auth/me/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          experience: draftProfile.experience.trim(),
          latitude: draftProfile.latitude,
          location: draftProfile.location.trim(),
          longitude: draftProfile.longitude,
          name: draftProfile.name.trim(),
          phone: draftProfile.phone.trim(),
          profilePhotoUri: draftProfile.profilePhotoUri,
        }),
      });

      await handleUserUpdate(data.user);
      setEditMode(false);
      setProfileMessage(data.message || 'Perfil actualizado.');
    } catch (requestError) {
      setProfileError(requestError.message || 'No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const pickPetPhoto = async (source) => {
    setPetError('');
    setPetPhotoMenuVisible(false);

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPetError(
        source === 'camera'
          ? 'Necesitas permitir acceso a la camara para agregar la foto.'
          : 'Necesitas permitir acceso a la galeria para agregar la foto.',
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
      updateDraftPet('photoUri', result.assets[0].uri);
    }
  };

  const savePets = async () => {
    setPetError('');
    setPetMessage('');

    const cleanedPet = {
      age: draftPet.age.trim(),
      breed: draftPet.breed.trim(),
      careNotes: draftPet.careNotes.trim(),
      insured: draftPet.insured,
      name: draftPet.name.trim(),
      photoUri: draftPet.photoUri,
      weight: draftPet.weight.trim(),
    };

    const requiredFields = [
      cleanedPet.photoUri,
      cleanedPet.name,
      cleanedPet.breed,
      cleanedPet.weight,
      cleanedPet.age,
    ];

    if (requiredFields.some((field) => !field)) {
      setPetError('Completa foto, nombre, raza, peso y edad de la mascota.');
      return;
    }

    const nextPets =
      editingIndex === null
        ? [...pets, cleanedPet]
        : pets.map((pet, index) => (index === editingIndex ? cleanedPet : pet));

    setSaving(true);
    try {
      const token = await getStoredToken();
      const data = await apiRequest('/api/auth/me/pets', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pets: nextPets }),
      });

      await handleUserUpdate(data.user);
      setDraftPet(createEmptyPet());
      setEditingIndex(null);
      setFormVisible(false);
      setPetMessage(data.message || 'Mascotas actualizadas.');
    } catch (requestError) {
      setPetError(requestError.message || 'No se pudo guardar la mascota.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.profileHeader}>
        {profile.profilePhotoUri ? (
          <Image source={{ uri: profile.profilePhotoUri }} style={styles.profileAvatarImage} />
        ) : (
          <View style={styles.profileAvatar}>
            <Ionicons name="person-outline" size={34} color="#1f6039" />
          </View>
        )}
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Perfil</Text>
          <Text style={styles.title}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telefono</Text>
          <Text style={styles.infoValue}>{profile.phone || 'No indicado'}</Text>
        </View>
        <View style={[styles.infoRow, styles.lastInfoRow]}>
          <Text style={styles.infoLabel}>Ubicacion</Text>
          <Text style={styles.infoValue}>{profile.location || 'No indicada'}</Text>
        </View>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={cancelProfileEditor}
        transparent
        visible={editMode}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop} contentContainerStyle={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
        <View style={styles.editProfileCard}>
          <View style={styles.petFormHeader}>
            <Text style={styles.petFormTitle}>Editar perfil</Text>
            <Pressable onPress={cancelProfileEditor}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>

          <View style={styles.editPhotoRow}>
            {draftProfile.profilePhotoUri ? (
              <Image source={{ uri: draftProfile.profilePhotoUri }} style={styles.editProfilePhoto} />
            ) : (
              <View style={styles.editProfilePhotoFallback}>
                <Ionicons name="person-outline" size={34} color="#1f6039" />
              </View>
            )}
            <View style={styles.editPhotoActions}>
              <Pressable
                onPress={() => pickDraftProfilePhoto('camera')}
                style={styles.photoActionButton}
              >
                <Ionicons name="camera-outline" size={17} color={colors.primary} />
                <Text style={styles.photoActionText}>Camara</Text>
              </Pressable>
              <Pressable
                onPress={() => pickDraftProfilePhoto('gallery')}
                style={styles.photoActionButton}
              >
                <Ionicons name="image-outline" size={17} color={colors.primary} />
                <Text style={styles.photoActionText}>Galeria</Text>
              </Pressable>
              {draftProfile.profilePhotoUri ? (
                <Pressable
                  onPress={() => updateDraftProfile('profilePhotoUri', '')}
                  style={styles.removePhotoButton}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  <Text style={styles.removePhotoText}>Eliminar foto</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            onChangeText={(value) => updateDraftProfile('name', value)}
            placeholder="Tu nombre"
            placeholderTextColor="#8fa899"
            style={styles.input}
            value={draftProfile.name}
          />

          <Text style={styles.label}>Telefono</Text>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(value) => updateDraftProfile('phone', value)}
            placeholder="+507 6000 0000"
            placeholderTextColor="#8fa899"
            style={styles.input}
            value={draftProfile.phone}
          />

          <Text style={styles.label}>Ubicacion</Text>
          <Pressable
            onPress={() => setMapPickerVisible(true)}
            style={styles.locationCard}
          >
            <Ionicons name="map-outline" size={20} color={colors.primary} />
            <View style={styles.locationCardCopy}>
              <Text style={styles.locationCardText} numberOfLines={1}>
                {draftProfile.location || 'Toca para seleccionar ubicacion'}
              </Text>
              {draftProfile.latitude != null ? (
                <Text style={styles.locationCardCoords}>
                  {draftProfile.latitude.toFixed(4)}, {draftProfile.longitude.toFixed(4)}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>

          {profile.role === 'walker' ? (
            <>
              <Text style={styles.label}>Experiencia</Text>
              <TextInput
                multiline
                onChangeText={(value) => updateDraftProfile('experience', value)}
                placeholder="Cuenta tu experiencia con mascotas"
                placeholderTextColor="#8fa899"
                style={[styles.input, styles.textarea]}
                textAlignVertical="top"
                value={draftProfile.experience}
              />
            </>
          ) : null}

          <View style={styles.editButtonsRow}>
            <Pressable onPress={cancelProfileEditor} style={styles.cancelButton}>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              disabled={savingProfile}
              onPress={saveProfile}
              style={({ pressed }) => [
                styles.saveProfileButton,
                (pressed || savingProfile) && styles.pressed,
              ]}
            >
              <Ionicons name="save-outline" size={18} color="#ffffff" />
              <Text style={styles.saveProfileButtonText}>
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </Text>
            </Pressable>
          </View>

          {profileError ? <Text style={styles.errorMessage}>{profileError}</Text> : null}
        </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setChangePasswordVisible(false)}
        transparent
        visible={changePasswordVisible}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop} contentContainerStyle={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.editProfileCard}>
                <View style={styles.petFormHeader}>
                  <Text style={styles.petFormTitle}>Cambiar contraseña</Text>
                  <Pressable onPress={() => setChangePasswordVisible(false)}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                </View>

                <Text style={styles.label}>Contraseña actual</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#8fa899"
                  secureTextEntry
                  style={styles.input}
                  value={currentPassword}
                />

                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#8fa899"
                  secureTextEntry
                  style={styles.input}
                  value={newPassword}
                />

                <Text style={styles.label}>Confirmar nueva contraseña</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#8fa899"
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                />

                <View style={styles.editButtonsRow}>
                  <Pressable onPress={() => setChangePasswordVisible(false)} style={styles.cancelButton}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    disabled={savingPassword}
                    onPress={handleChangePassword}
                    style={({ pressed }) => [
                      styles.saveProfileButton,
                      (pressed || savingPassword) && styles.pressed,
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
                    <Text style={styles.saveProfileButtonText}>
                      {savingPassword ? 'Guardando...' : 'Guardar contraseña'}
                    </Text>
                  </Pressable>
                </View>

                {passwordError ? <Text style={styles.errorMessage}>{passwordError}</Text> : null}
                {passwordMessage ? <Text style={styles.successMessage}>{passwordMessage}</Text> : null}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {profileMessage ? <Text style={styles.profilePhotoSuccess}>{profileMessage}</Text> : null}

      {canManagePets ? (
      <View style={styles.petCard}>
        <View style={styles.petCardHeader}>
          <View style={styles.petTitleBlock}>
            <Text style={styles.petTitle}>
              {pets.length === 1 ? 'Mascota registrada' : 'Mascotas registradas'}
            </Text>
            <Text style={styles.petSubtitle}>Desliza para ver todas tus mascotas.</Text>
          </View>
          <Pressable onPress={openAddForm} style={styles.addPetButton}>
            <Ionicons name="add" size={23} color="#ffffff" />
          </Pressable>
        </View>

        <Modal
          animationType="slide"
          onRequestClose={() => {
            setFormVisible(false);
            setEditingIndex(null);
            setDraftPet(createEmptyPet());
            setPetPhotoMenuVisible(false);
            setPetError('');
          }}
          transparent
          visible={formVisible}
        >
          <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop} contentContainerStyle={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
          <View style={styles.petFormModal}>
            <View style={styles.petFormHeader}>
              <Text style={styles.petFormTitle}>
                {editingIndex === null ? 'Agregar mascota' : 'Editar mascota'}
              </Text>
              <Pressable
                onPress={() => {
                  setFormVisible(false);
                  setEditingIndex(null);
                  setDraftPet(createEmptyPet());
                  setPetPhotoMenuVisible(false);
                  setPetError('');
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setPetPhotoMenuVisible((current) => !current)}
              style={styles.photoPicker}
            >
              {draftPet.photoUri ? (
                <Image source={{ uri: draftPet.photoUri }} style={styles.petPhotoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                </View>
              )}
              <Text style={styles.photoPickerText}>
                {draftPet.photoUri ? 'Cambiar foto' : 'Agregar foto de la mascota'}
              </Text>
            </Pressable>

            {petPhotoMenuVisible ? (
              <View style={styles.petPhotoMenu}>
                <Pressable
                  onPress={() => pickPetPhoto('camera')}
                  style={styles.petPhotoMenuButton}
                >
                  <Ionicons name="camera-outline" size={17} color={colors.primary} />
                  <Text style={styles.photoActionText}>Tomar foto con camara</Text>
                </Pressable>
                <Pressable
                  onPress={() => pickPetPhoto('gallery')}
                  style={styles.petPhotoMenuButton}
                >
                  <Ionicons name="image-outline" size={17} color={colors.primary} />
                  <Text style={styles.photoActionText}>Seleccionar desde galeria</Text>
                </Pressable>
                {draftPet.photoUri ? (
                  <Pressable
                    onPress={() => {
                      updateDraftPet('photoUri', '');
                      setPetPhotoMenuVisible(false);
                    }}
                    style={styles.removePhotoButton}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.danger} />
                    <Text style={styles.removePhotoText}>Eliminar foto</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              onChangeText={(value) => updateDraftPet('name', value)}
              placeholder="Ej. Max"
              placeholderTextColor="#8fa899"
              style={styles.input}
              value={draftPet.name}
            />

            <Text style={styles.label}>Raza</Text>
            <TextInput
              onChangeText={(value) => updateDraftPet('breed', value)}
              placeholder="Ej. Labrador, mestizo"
              placeholderTextColor="#8fa899"
              style={styles.input}
              value={draftPet.breed}
            />

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Peso</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateDraftPet('weight', value)}
                  placeholder="Ej. 12 kg"
                  placeholderTextColor="#8fa899"
                  style={styles.input}
                  value={draftPet.weight}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(value) => updateDraftPet('age', value)}
                  placeholder="Ej. 3 anos"
                  placeholderTextColor="#8fa899"
                  style={styles.input}
                  value={draftPet.age}
                />
              </View>
            </View>

            <View style={styles.insuredRow}>
              <View style={styles.petHeaderCopy}>
                <Text style={styles.petPromptTitle}>Esta asegurada?</Text>
                <Text style={styles.petSubtitle}>Marca si cuenta con seguro.</Text>
              </View>
              <Switch
                ios_backgroundColor="#d7ded6"
                onValueChange={(value) => updateDraftPet('insured', value)}
                thumbColor="#ffffff"
                trackColor={{ false: '#d7ded6', true: colors.primary }}
                value={draftPet.insured}
              />
            </View>

            <Text style={styles.label}>Notas medicas o cuidados especiales</Text>
            <TextInput
              multiline
              onChangeText={(value) => updateDraftPet('careNotes', value)}
              placeholder="Alergias, medicamentos, vacunas o comportamiento."
              placeholderTextColor="#8fa899"
              style={[styles.input, styles.textarea]}
              textAlignVertical="top"
              value={draftPet.careNotes}
            />

            {petError ? <Text style={styles.errorMessage}>{petError}</Text> : null}

            <Pressable
              disabled={saving}
              onPress={savePets}
              style={({ pressed }) => [
                styles.savePetButton,
                (pressed || saving) && styles.pressed,
              ]}
            >
              <Ionicons name="save-outline" size={18} color="#ffffff" />
              <Text style={styles.savePetButtonText}>
                {saving ? 'Guardando...' : 'Guardar mascota'}
              </Text>
            </Pressable>
          </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {pets.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalPetsRow}
          >
            {pets.map((pet, index) => (
              <View key={`${pet.name}-${index}`} style={styles.singlePetCard}>
                <View style={styles.petHeader}>
                  {pet.photoUri ? (
                    <Image source={{ uri: pet.photoUri }} style={styles.petPhoto} />
                  ) : (
                    <View style={styles.petPhotoFallback}>
                      <Text style={styles.petPhotoFallbackText}>
                        {(pet.name || 'M').charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.petHeaderCopy}>
                    <Text style={styles.singlePetTitle}>
                      {pet.name || `Mascota ${index + 1}`}
                    </Text>
                    <Text style={styles.petSubtitle}>{pet.breed || 'Raza no indicada'}</Text>
                  </View>
                </View>

                <View style={styles.petGrid}>
                  <View style={styles.petInfoItem}>
                    <Text style={styles.infoLabel}>Peso</Text>
                    <Text style={styles.infoValue}>{pet.weight || 'No indicado'}</Text>
                  </View>
                  <View style={styles.petInfoItem}>
                    <Text style={styles.infoLabel}>Edad</Text>
                    <Text style={styles.infoValue}>{pet.age || 'No indicada'}</Text>
                  </View>
                  <View style={styles.petInfoItem}>
                    <Text style={styles.infoLabel}>Asegurada</Text>
                    <Text style={styles.infoValue}>{pet.insured ? 'Si' : 'No'}</Text>
                  </View>
                </View>
                {pet.careNotes ? <Text style={styles.petNotes}>{pet.careNotes}</Text> : null}
                <Pressable onPress={() => openEditForm(pet, index)} style={styles.editPetButton}>
                  <Ionicons name="create-outline" size={15} color={colors.primary} />
                  <Text style={styles.editPetText}>Editar</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyPetsText}>Aun no tienes mascotas registradas.</Text>
        )}

        {petMessage ? <Text style={styles.successMessage}>{petMessage}</Text> : null}
      </View>
      ) : null}

      <View style={styles.optionsList}>
        {options.map((option) => (
          <Pressable
            key={option.label}
            onPress={
              option.label === 'Editar perfil' ? openProfileEditor
              : option.label === 'Cambiar contrasena' ? openChangePassword
              : option.label === 'Notificaciones' ? () => Alert.alert('Notificaciones', 'Recibe avisos cuando tus reservas cambien de estado. Puedes desactivarlas desde la configuracion de tu dispositivo.')
              : option.label === 'Privacidad' ? () => router.push('/(tabs)/privacy')
              : option.label === 'Ayuda y soporte' ? () => router.push('/(tabs)/help')
              : option.label === 'Acerca de' ? () => router.push('/(tabs)/about')
              : undefined
            }
            style={({ pressed }) => [styles.optionItem, pressed && styles.pressed]}
          >
            <View style={styles.optionLabelRow}>
              <Ionicons name={option.icon} size={21} color={colors.primary} />
              <Text style={styles.optionText}>{option.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={21} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
        <Ionicons name="log-out-outline" size={20} color="#ffffff" />
        <Text style={styles.logoutButtonText}>Cerrar sesion</Text>
      </Pressable>

      <MapPicker
        visible={mapPickerVisible}
        initialLatitude={draftProfile.latitude}
        initialLongitude={draftProfile.longitude}
        initialAddress={draftProfile.location}
        onConfirm={({ latitude, longitude, address }) => {
          setDraftProfile((prev) => ({
            ...prev,
            latitude,
            location: address,
            longitude,
          }));
          setMapPickerVisible(false);
        }}
        onCancel={() => setMapPickerVisible(false)}
      />
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
  profileHeader: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
    maxWidth: 720,
    width: '100%',
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: '#d8f1da',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  profileAvatarImage: {
    backgroundColor: '#d8f1da',
    borderRadius: 36,
    height: 72,
    resizeMode: 'cover',
    width: 72,
  },
  profileAvatarText: {
    color: '#1f6039',
    fontSize: 30,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
  },
  profileEmail: {
    color: '#516457',
    fontSize: 15,
    marginTop: 8,
  },
  photoActionButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  photoActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  profilePhotoSuccess: {
    alignSelf: 'center',
    color: '#1f6d4a',
    fontWeight: '700',
    marginTop: 10,
    maxWidth: 720,
    width: '100%',
  },
  profileCard: {
    ...shadows.card,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 22,
    maxWidth: 720,
    paddingHorizontal: 20,
    width: '100%',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(17, 35, 29, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
  },
  modalSheet: {
    alignSelf: 'center',
    maxHeight: '92%',
    maxWidth: 720,
    width: '100%',
  },
  modalContent: {
    paddingBottom: 22,
  },
  editProfileCard: {
    ...shadows.card,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    gap: 10,
    maxWidth: 720,
    padding: 20,
    width: '100%',
  },
  editPhotoRow: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: 'rgba(83, 128, 93, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  editProfilePhoto: {
    backgroundColor: colors.primarySoft,
    borderRadius: 42,
    height: 84,
    resizeMode: 'cover',
    width: 84,
  },
  editProfilePhotoFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 84,
  },
  editPhotoActions: {
    flex: 1,
    gap: 8,
  },
  removePhotoButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  removePhotoText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  saveProfileButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  saveProfileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(71, 98, 79, 0.12)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 17,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  infoValue: {
    color: '#1f3726',
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },
  petCard: {
    ...shadows.card,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    marginTop: 18,
    maxWidth: 720,
    padding: 20,
    width: '100%',
  },
  petCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  petTitleBlock: {
    flex: 1,
  },
  petTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  addPetButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addPetButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  horizontalPetsRow: {
    gap: 12,
    paddingRight: 20,
  },
  singlePetCard: {
    backgroundColor: '#fbfdfb',
    borderColor: 'rgba(83, 128, 93, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    minHeight: 330,
    padding: 14,
    width: 284,
  },
  petHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  petPhoto: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 76,
    width: 76,
  },
  petPhotoFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  petPhotoFallbackText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  petHeaderCopy: {
    flex: 1,
  },
  singlePetTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  petSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  editPetButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editPetText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  petGrid: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  petInfoItem: {
    alignItems: 'center',
    borderBottomColor: 'rgba(71, 98, 79, 0.12)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  petNotes: {
    backgroundColor: colors.input,
    borderRadius: 16,
    color: colors.textMuted,
    flexGrow: 1,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 58,
    padding: 14,
  },
  emptyPetsText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  petForm: {
    backgroundColor: '#fbfdfb',
    borderColor: 'rgba(83, 128, 93, 0.16)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
    padding: 14,
  },
  petFormModal: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 20,
    width: '100%',
  },
  petFormHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  petFormTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  cancelText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  photoPicker: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: 'rgba(83, 128, 93, 0.18)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  petPhotoPreview: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 72,
    width: 72,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 72,
  },
  photoPlaceholderText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  photoPickerText: {
    color: colors.primary,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  petPhotoMenu: {
    gap: 8,
  },
  petPhotoMenuButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 12,
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
  locationCard: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  locationCardCopy: {
    flex: 1,
  },
  locationCardText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  locationCardCoords: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  textarea: {
    minHeight: 110,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
  },
  insuredRow: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: 'rgba(83, 128, 93, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  petPromptTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  savePetButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 15,
  },
  savePetButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  successMessage: {
    color: '#1f6d4a',
    fontWeight: '700',
  },
  errorMessage: {
    color: '#aa3534',
    fontWeight: '700',
  },
  optionsList: {
    alignSelf: 'center',
    gap: 12,
    marginTop: 20,
    maxWidth: 720,
    width: '100%',
  },
  optionItem: {
    ...shadows.card,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 17,
  },
  pressed: {
    opacity: 0.75,
  },
  optionText: {
    color: '#2c4637',
    fontSize: 16,
    fontWeight: '800',
  },
  optionLabelRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.danger,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 28,
    maxWidth: 360,
    paddingVertical: 16,
    width: '100%',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});

export default Profile;
