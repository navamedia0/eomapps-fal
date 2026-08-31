import { Fragment, useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, type NavigationState, type SceneRendererProps } from 'react-native-tab-view';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import HomeScreen from '@/screens/HomeScreen';
import KesfetScreen from '@/screens/KesfetScreen';
import SohbetScreen from '@/screens/SohbetScreen';
import MagazaScreen from '@/screens/MagazaScreen';
import ProfilScreen from '@/screens/ProfilScreen';
import WalletBadge from '@/components/WalletBadge';
import { NAV_ICONS } from '@/assets/icons';
import { GOLD, GOLD_SOFT, NIGHT_MID, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type TabKey = keyof MainTabParamList;
type TabRoute = { key: TabKey; title: string };

// Oyun Merkezi burada YOK — TabView'ın navigationState.routes'una girseydi
// (renderScene null döndürse bile) yatay kaydırma onu boş bir sekme olarak
// yine de gösterirdi. Ayrı, tam ekran bir ekran olduğu için sekme
// çubuğunda ayrı, statik bir buton olarak render ediliyor (aşağıda).
const ROUTES: TabRoute[] = [
  { key: 'AnaSayfa', title: 'Ana Sayfa' },
  { key: 'Kesfet', title: 'Keşfet' },
  { key: 'Sohbet', title: 'Sohbet' },
  { key: 'Magaza', title: 'Mağaza' },
  { key: 'Profil', title: 'Profil' },
];

// Sohbet için henüz özel sanat üretilmedi (Kader Atölyesi belgesindeki
// görsel üretim hattını bekliyor) — o güne kadar Ionicons üzerinden tutarlı
// bir geçici simge gösteriyoruz.
const FALLBACK_TAB_ICONS: Partial<Record<TabKey, keyof typeof Ionicons.glyphMap>> = {
  Sohbet: 'chatbubbles-outline',
};

export default function MainTabs({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom + 6, 14);

  return (
    <View style={styles.flex}>
      {/* Floating wallet badge (Coin + Kristal) */}
      <View style={[styles.floatingCoinWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <WalletBadge navigation={navigation} />
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
            case 'Sohbet':
              return <SohbetScreen navigation={navigation} />;
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
                <Fragment key={route.key}>
                  <Pressable onPress={() => jumpTo(route.key)} style={styles.tabItem} hitSlop={4}>
                    {/* Dış siyah kareleri kırparak sadece mor yuvarlak çerçeveyi ve büyütülmüş simgeyi gösterir */}
                    <View style={[styles.tabIconClip, focused && styles.tabIconClipActive]}>
                      {NAV_ICONS[route.key as keyof typeof NAV_ICONS] ? (
                        <Image
                          source={NAV_ICONS[route.key as keyof typeof NAV_ICONS]}
                          style={[styles.tabIcon, { opacity: focused ? 1 : 0.65 }]}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name={FALLBACK_TAB_ICONS[route.key] ?? 'ellipse-outline'}
                          size={26}
                          color={focused ? GOLD : TEXT_MUTED}
                        />
                      )}
                    </View>
                    <Text style={[styles.tabLabel, { color: focused ? GOLD : TEXT_MUTED }]} numberOfLines={1}>
                      {route.title}
                    </Text>
                  </Pressable>
                  {route.key === 'Sohbet' && (
                    // Oyun Merkezi: TabView'ın navigationState.routes'unun
                    // DIŞINDA, bağımsız statik bir buton — bu yüzden yatay
                    // kaydırmayla asla ulaşılamaz, sadece dokunarak stack
                    // üzerinden tam ekran ayrı bir ekran olarak açılır.
                    <Pressable
                      onPress={() => navigation.navigate('OyunMerkezi')}
                      style={styles.tabItem}
                      hitSlop={4}
                    >
                      <View style={styles.tabIconClip}>
                        <Ionicons name="game-controller-outline" size={26} color={TEXT_MUTED} />
                      </View>
                      <Text style={[styles.tabLabel, { color: TEXT_MUTED }]} numberOfLines={1}>
                        Oyun Mer...
                      </Text>
                    </Pressable>
                  )}
                </Fragment>
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
