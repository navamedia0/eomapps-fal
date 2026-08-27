import { useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, type NavigationState, type SceneRendererProps } from 'react-native-tab-view';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import HomeScreen from '@/screens/HomeScreen';
import KesfetScreen from '@/screens/KesfetScreen';
import BilgiKosesiScreen from '@/screens/BilgiKosesiScreen';
import MagazaScreen from '@/screens/MagazaScreen';
import ProfilScreen from '@/screens/ProfilScreen';
import CoinBadge from '@/components/CoinBadge';
import { NAV_ICONS } from '@/assets/icons';
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

export default function MainTabs({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      {/* Floating coin badge — sits above every tab's scroll content (not
          inside it) so the coin count stays visible no matter how far down
          the user scrolls, on every tab, not just Home. */}
      <View style={[styles.floatingCoinWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <CoinBadge navigation={navigation} />
      </View>
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
            return (
              <Pressable key={route.key} onPress={() => jumpTo(route.key)} style={styles.tabItem} hitSlop={4}>
                <View style={[styles.iconChip, focused && styles.iconChipActive]}>
                  <Image
                    source={NAV_ICONS[route.key]}
                    style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.tabLabel, { color: focused ? GOLD : TEXT_MUTED }]} numberOfLines={1}>
                  {route.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  floatingCoinWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
    elevation: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: NIGHT_MID,
    borderTopWidth: 1,
    borderTopColor: GOLD_SOFT,
    height: 82,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: 'rgba(242, 200, 121, 0.18)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  tabIcon: {
    width: 44,
    height: 44,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
});
