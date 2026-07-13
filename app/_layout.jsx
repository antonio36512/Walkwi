import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, StatusBar, Text, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/styles/theme';
import { apiRequest } from '../src/services/api';
import { saveSession } from '../src/storage/session';

async function restoreSystemBars() {
  StatusBar.setHidden(false, 'fade');
  StatusBar.setBarStyle('dark-content');

  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(colors.background);
    StatusBar.setTranslucent(false);

    try {
      await NavigationBar.setVisibilityAsync('visible');
      await NavigationBar.setPositionAsync('relative');
      await NavigationBar.setBehaviorAsync('inset-touch');
      await NavigationBar.setBackgroundColorAsync(colors.background);
      await NavigationBar.setButtonStyleAsync('dark');
    } catch {}
  }
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { user, checkingSession, accountRestriction, handleClearRestriction, handleAccountRestriction, handleLogout, handleAuth } = useAuth();
  const [restrictionChecking, setRestrictionChecking] = useState(false);
  const [restrictionError, setRestrictionError] = useState('');

  const checkAccountStatus = async () => {
    setRestrictionChecking(true);
    setRestrictionError('');
    try {
      await apiRequest('/api/auth/me');
      await handleClearRestriction();
    } catch (error) {
      setRestrictionError(error.message);
    } finally {
      setRestrictionChecking(false);
    }
  };

  useEffect(() => {
    restoreSystemBars();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') restoreSystemBars();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url || !url.includes('/--/auth')) return;
      try {
        const params = new URLSearchParams(url.split('?')[1] || '');
        const restrictionData = params.get('restriction');
        if (restrictionData) return handleAccountRestriction(JSON.parse(decodeURIComponent(restrictionData)));
        const token = params.get('token'); const userData = params.get('user');
        if (token && userData) { const userObj = JSON.parse(decodeURIComponent(userData)); await saveSession(token, userObj); handleAuth(userObj); }
      } catch (error) { console.error('Error procesando enlace de autenticación:', error); }
    };
    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    return () => subscription.remove();
  }, [handleAccountRestriction, handleAuth]);

  useEffect(() => {
    if (checkingSession) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
      router.replace('/(tabs)/home');
      }
    } else if (user && !inAuthGroup && !inAdminGroup && user.role === 'admin') {
      router.replace('/admin');
    } else if (user && inAdminGroup && user.role !== 'admin') {
      router.replace('/(tabs)/home');
    }
  }, [user, checkingSession, segments]);

  if (checkingSession) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ExpoStatusBar backgroundColor={colors.background} style="dark" translucent={false} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (accountRestriction) {
    const suspended = accountRestriction.code === 'ACCOUNT_SUSPENDED';
    const until = accountRestriction.until
      ? new Date(accountRestriction.until).toLocaleString()
      : null;
    return (
      <View style={[styles.restrictionScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }] }>
        <View style={styles.restrictionIcon}><Text style={styles.restrictionIconText}>!</Text></View>
        <Text style={styles.restrictionTitle}>
          {suspended ? 'Cuenta suspendida' : 'Cuenta bloqueada'}
        </Text>
        <Text style={styles.restrictionMessage}>
          {suspended
            ? 'Tu acceso a Walkwi fue suspendido temporalmente.'
            : 'Tu acceso a Walkwi fue bloqueado por el equipo administrativo.'}
        </Text>
        {!!accountRestriction.reason && (
          <View style={styles.restrictionDetail}>
            <Text style={styles.restrictionLabel}>Motivo</Text>
            <Text style={styles.restrictionValue}>{accountRestriction.reason}</Text>
          </View>
        )}
        {!!until && (
          <View style={styles.restrictionDetail}>
            <Text style={styles.restrictionLabel}>Suspensión hasta</Text>
            <Text style={styles.restrictionValue}>{until}</Text>
          </View>
        )}
        <Text style={styles.restrictionHelp}>
          No podrás utilizar las funciones de la aplicación mientras esta medida esté activa.
        </Text>
        {!!restrictionError && <Text style={styles.restrictionError}>{restrictionError}</Text>}
        {user && <Pressable style={styles.restrictionButton} onPress={checkAccountStatus} disabled={restrictionChecking}>
          <Text style={styles.restrictionButtonText}>{restrictionChecking ? 'Comprobando...' : 'Comprobar estado nuevamente'}</Text>
        </Pressable>}
        <Pressable style={styles.restrictionLogout} onPress={handleLogout}>
          <Text style={styles.restrictionLogoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ExpoStatusBar backgroundColor={colors.background} style="dark" translucent={false} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = {
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  restrictionScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  restrictionIcon: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 38,
    height: 76,
    justifyContent: 'center',
    marginBottom: 20,
    width: 76,
  },
  restrictionIconText: { color: colors.danger, fontSize: 40, fontWeight: '800' },
  restrictionTitle: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  restrictionMessage: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  restrictionDetail: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 14, borderWidth: 1, marginTop: 14, padding: 16, width: '100%' },
  restrictionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  restrictionValue: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 5 },
  restrictionHelp: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 20, textAlign: 'center' },
  restrictionButton: { backgroundColor: colors.primary, borderRadius: 12, marginTop: 24, paddingHorizontal: 22, paddingVertical: 14 },
  restrictionButtonText: { color: colors.card, fontSize: 15, fontWeight: '700' },
  restrictionError: { color: colors.danger, fontSize: 13, marginTop: 14, textAlign: 'center' },
  restrictionLogout: { marginTop: 14, paddingHorizontal: 22, paddingVertical: 12 },
  restrictionLogoutText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
};
