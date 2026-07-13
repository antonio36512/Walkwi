import { useEffect } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, StatusBar, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { saveSession } from '../src/storage/session';
import { colors } from '../src/styles/theme';

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
  const { user, checkingSession, handleAuth } = useAuth();

  useEffect(() => {
    restoreSystemBars();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') restoreSystemBars();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;

      const authIndex = url.indexOf('/--/auth');
      if (authIndex === -1) return;

      try {
        const queryString = url.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const token = params.get('token');
        const userData = params.get('user');
        const error = params.get('error');

        if (error) return;

        if (token && userData) {
          const userObj = JSON.parse(decodeURIComponent(userData));
          await saveSession(token, userObj);
          handleAuth(userObj);
        }
      } catch (e) {
        console.error('Error parsing deep link:', e);
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });
    return () => subscription.remove();
  }, [handleAuth]);

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
};
