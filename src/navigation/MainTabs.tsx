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

  const bottomPadding = Math.max(insets.bottom + 6, 14);

  return (
    <View style={styles.flex}>
      {/* Floating coin badge */}
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
          <View style={[styles.tabBar, { paddingBottom: bottomPadding }]}>
            {navigationState.routes.map((route, routeIndex) => {
              const focused = navigationState.index === routeIndex;
              return (
                <Pressable key={route.key} onPress={() => jumpTo(route.key)} style={styles.tabItem} hitSlop={4}>
                  {/* Dış siyah kareleri kırparak sadece mor yuvarlak çerçeveyi ve büyütülmüş simgeyi gösterir */}
                  <View style={[styles.tabIconClip, focused && styles.tabIconClipActive]}>
                    <Image
                      source={NAV_ICONS[route.key]}
                      style={[styles.tabIcon, { opacity: focused ? 1 : 0.65 }]}
                      resizeMode="cover"
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
    minHeight: 88,
    paddingTop: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconClip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  tabIconClipActive: {
    borderWidth: 1.5,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  tabIcon: {
    width: 56,
    height: 56,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
});
