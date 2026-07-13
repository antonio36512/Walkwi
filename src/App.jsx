import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StatusBar, StyleSheet, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavbar from './components/BottomNavbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Services from './pages/Services';
import { getStoredUser, saveStoredUser } from './storage/session';
import { colors } from './styles/theme';

const publicRoutes = ['login', 'register'];

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
    } catch {
      // Some Android surfaces do not expose navigation bar controls in Expo Go.
    }
  }
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState('login');
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    restoreSystemBars();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        restoreSystemBars();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let mounted = true;

    getStoredUser()
      .then((storedUser) => {
        if (!mounted) return;
        if (storedUser) {
          setUser(storedUser);
          setRoute('home');
        }
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const navigate = (nextRoute) => setRoute(nextRoute);

  const handleAuth = (nextUser) => {
    setUser(nextUser);
    setRoute('home');
  };

  const handleLogout = () => {
    setUser(null);
    setRoute('login');
  };

  const handleUserUpdate = async (nextUser) => {
    setUser(nextUser);
    await saveStoredUser(nextUser);
  };

  if (checkingSession) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ExpoStatusBar backgroundColor={colors.background} style="dark" translucent={false} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const screens = {
    login: <Login navigate={navigate} onLogin={handleAuth} />,
    register: <Register navigate={navigate} />,
    home: <Home navigate={navigate} user={user} />,
    services: <Services user={user} />,
    profile: (
      <Profile
        navigate={navigate}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
        user={user}
      />
    ),
  };

  const showNavbar = !publicRoutes.includes(route);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ExpoStatusBar backgroundColor={colors.background} style="dark" translucent={false} />
      <View
        style={[
          styles.appShell,
          {
            paddingBottom: showNavbar ? 0 : insets.bottom,
          },
        ]}
      >
        {screens[route] ?? screens.login}
      </View>
      {showNavbar ? (
        <BottomNavbar activeRoute={route} bottomInset={insets.bottom} navigate={navigate} />
      ) : null}
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  appShell: {
    flex: 1,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});

export default App;
