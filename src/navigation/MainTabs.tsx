import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/navigation/types';
import HomeScreen from '@/screens/HomeScreen';
import KesfetScreen from '@/screens/KesfetScreen';
import MagazaScreen from '@/screens/MagazaScreen';
import ProfilScreen from '@/screens/ProfilScreen';
import { GOLD, GOLD_SOFT, NIGHT_MID, TEXT_MUTED } from '@/theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  AnaSayfa: { active: 'home', inactive: 'home-outline' },
  Kesfet: { active: 'compass', inactive: 'compass-outline' },
  Magaza: { active: 'storefront', inactive: 'storefront-outline' },
  Profil: { active: 'person-circle', inactive: 'person-circle-outline' },
};

const TITLES: Record<keyof MainTabParamList, string> = {
  AnaSayfa: 'Ana Sayfa',
  Kesfet: 'Keşfet',
  Magaza: 'Mağaza',
  Profil: 'Profil',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: TEXT_MUTED,
        tabBarStyle: { backgroundColor: NIGHT_MID, borderTopColor: GOLD_SOFT, borderTopWidth: 1 },
        tabBarLabel: TITLES[route.name],
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? ICONS[route.name].active : ICONS[route.name].inactive} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="AnaSayfa" component={HomeScreen} />
      <Tab.Screen name="Kesfet" component={KesfetScreen} />
      <Tab.Screen name="Magaza" component={MagazaScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}
