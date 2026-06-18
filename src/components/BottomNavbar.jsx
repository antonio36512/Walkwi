import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadows } from '../styles/theme';

const items = [
  { route: 'home', label: 'Inicio', icon: 'home-outline', library: 'ion' },
  { route: 'services', label: 'Servicios', icon: 'paw-outline', library: 'material' },
  { route: 'profile', label: 'Perfil', icon: 'person-outline', library: 'ion' },
];

function BottomNavbar({ activeRoute, bottomInset = 0, navigate }) {
  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(bottomInset, 12) }]}>
      {items.map((item) => {
        const active = activeRoute === item.route;
        const iconColor = active ? colors.primary : colors.textMuted;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={item.route}
            onPress={() => navigate(item.route)}
            style={[styles.item, active && styles.activeItem]}
          >
            {item.library === 'material' ? (
              <MaterialCommunityIcons color={iconColor} name={item.icon} size={22} />
            ) : (
              <Ionicons color={iconColor} name={item.icon} size={22} />
            )}
            <Text style={[styles.label, active && styles.activeText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
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

export default BottomNavbar;
