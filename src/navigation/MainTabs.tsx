import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { TabView, type NavigationState, type SceneRendererProps } from 'react-native-tab-view';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import HomeScreen from '@/screens/HomeScreen';
import KesfetScreen from '@/screens/KesfetScreen';
import BilgiKosesiScreen from '@/screens/BilgiKosesiScreen';
import MagazaScreen from '@/screens/MagazaScreen';
import ProfilScreen from '@/screens/ProfilScreen';
import { GOLD, GOLD_SOFT, NIGHT_MID, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type TabKey = keyof MainTabParamList;
type TabRoute = { key: TabKey; title: string };

const ROUTES: TabRoute[] = [
  { key: 'AnaSayfa', title: 'Ana Sayfa' },
  { key: 'Kesfet', title: 'Keşfet' },
  { key: 'BilgiKosesi', title: 'Bilgi Köşesi' },
  { key: 'Magaza', title: 'Mağaza' },
  { key: 'Profil', title: 'Profil' },
];

const ICONS: Record<TabKey, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  AnaSayfa: { active: 'home', inactive: 'home-outline' },
  Kesfet: { active: 'compass', inactive: 'compass-outline' },
  BilgiKosesi: { active: 'bulb', inactive: 'bulb-outline' },
  Magaza: { active: 'storefront', inactive: 'storefront-outline' },
  Profil: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function MainTabs({ navigation }: Props) {
  const [index, setIndex] = useState(0);

  return (
    <TabView<TabRoute>
      navigationState={{ index, routes: ROUTES }}
      onIndexChange={setIndex}
      tabBarPosition="bottom"
      lazy
      renderScene={({ route }) => {
        switch (route.key) {
          case 'AnaSayfa':
            return <HomeScreen navigation={navigation} />;
          case 'Kesfet':
            return <KesfetScreen navigation={navigation} />;
          case 'BilgiKosesi':
            return <BilgiKosesiScreen navigation={navigation} />;
          case 'Magaza':
            return <MagazaScreen navigation={navigation} />;
          case 'Profil':
            return <ProfilScreen navigation={navigation} />;
          default:
            return null;
        }
      }}
      renderTabBar={({ navigationState, jumpTo }: SceneRendererProps & { navigationState: NavigationState<TabRoute> }) => (
        <View style={styles.tabBar}>
          {navigationState.routes.map((route, routeIndex) => {
            const focused = navigationState.index === routeIndex;
            const icon = ICONS[route.key];
            return (
              <Pressable key={route.key} onPress={() => jumpTo(route.key)} style={styles.tabItem} hitSlop={4}>
                <Ionicons name={focused ? icon.active : icon.inactive} size={22} color={focused ? GOLD : TEXT_MUTED} />
                <Text style={[styles.tabLabel, { color: focused ? GOLD : TEXT_MUTED }]} numberOfLines={1}>
                  {route.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: NIGHT_MID,
    borderTopWidth: 1,
    borderTopColor: GOLD_SOFT,
    height: 66,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
});
