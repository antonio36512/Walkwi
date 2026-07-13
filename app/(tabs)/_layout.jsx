import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../../src/styles/theme';
import { useAuth } from '../../src/contexts/AuthContext';

const allItems = [
  { route: 'home', label: 'Inicio', icon: 'home-outline', iconActive: 'home', library: 'ion' },
  { route: 'services', label: 'Servicios', icon: 'paw-outline', iconActive: 'paw', library: 'material', roles: ['user'] },
  { route: 'agenda', label: 'Agenda', icon: 'calendar-outline', iconActive: 'calendar', library: 'ion' },
  { route: 'profile', label: 'Perfil', icon: 'person-outline', iconActive: 'person', library: 'ion' },
];

function CustomTabBar({ state, navigation }) {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const items = allItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <View style={[styles.wrapper, { paddingBottom: 12 }]}>
      {items.map((item) => {
        const routeIndex = state.routes.findIndex((r) => r.name === item.route);
        const active = state.index === routeIndex;
        const iconColor = active ? colors.primary : colors.textMuted;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={[styles.item, active && styles.activeItem]}
          >
            {item.library === 'material' ? (
              <MaterialCommunityIcons
                color={iconColor}
                name={active ? item.iconActive : item.icon}
                size={22}
              />
            ) : (
              <Ionicons
                color={iconColor}
                name={active ? item.iconActive : item.icon}
                size={22}
              />
            )}
            <Text style={[styles.label, active && styles.activeText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="services" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...shadows.nav,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(31, 100, 54, 0.12)',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-around',
    left: 0,
    maxWidth: 640,
    paddingHorizontal: 16,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  item: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  activeItem: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  activeText: {
    color: colors.primary,
  },
});
