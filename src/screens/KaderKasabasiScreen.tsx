import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, Image, ScrollView, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList, TabScreenProps } from '@/navigation/types';
import GameEntryGate from '@/components/GameEntryGate';
import WalletBadge from '@/components/WalletBadge';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY } from '@/theme/colors';

const LOADING_LINES = ['Kasaba ışıklandırılıyor…', 'Fenerler yakılıyor…', 'Sokaklar temizleniyor…', 'Ay yükseliyor…'];

const HUB_BG = require('@/assets/kasaba/tiered_terrace_hub.png');
const PATH_TEXTURE = require('@/assets/kasaba/sandy_cobblestone_path.png');
// Kaynak görsel 1152x2048 (9:16'ya yakın dikey) — arkaplanı ekranı yatayda tam
// dolduracak, doğal en-boy oranını koruyacak şekilde ölçekliyoruz.
const HUB_BG_RATIO = 2048 / 1152;

// Hem alt sekme sahnesi (MainTabs) hem de Mağaza'dan stack ile açılan bir
// ekran olarak kullanılıyor — ikisi de aynı kök navigation nesnesini geçtiği
// için TabScreenProps yeterli, ayrı 'route' parametresine ihtiyaç yok.
type Props = TabScreenProps;

type Building =
  | {
      key: string;
      title: string;
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      accentColor: string;
      topPct: number;
      leftPct: number;
      kind: 'route';
      route: keyof RootStackParamList;
    }
  | {
      key: string;
      title: string;
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      accentColor: string;
      topPct: number;
      leftPct: number;
      kind: 'soon';
      soonSubtitle: string;
    };

// topPct/leftPct: tiered_terrace_hub.png üzerindeki boş, altın çerçeveli
// parsellerin gözle kestirilen konumu (yol aşağıdan yukarı: giriş en altta,
// Onur Listesi en tepede ay'ın yanında). Cihazda görüp birlikte ince ayar
// yapacağız — bu ilk tahmin.
const BUILDINGS: Building[] = [
  { key: 'karakter', title: 'Karakterim', icon: 'account-star-outline', accentColor: '#8FD8F2', topPct: 90, leftPct: 8, kind: 'soon', soonSubtitle: 'Karakterini giydireceğin, herkesin görebileceği profilin burada olacak. Yakında.' },
  { key: 'oyun-salonu', title: 'Oyun Salonu', icon: 'gamepad-variant-outline', accentColor: '#A855F7', topPct: 79, leftPct: 62, kind: 'route', route: 'MiniGames' },
  { key: 'ciftlik', title: 'Çiftlik', icon: 'flower-tulip-outline', accentColor: '#10B981', topPct: 68, leftPct: 8, kind: 'route', route: 'Garden' },
  { key: 'kesif-salonu', title: 'Keşif Salonu', icon: 'compass-outline', accentColor: '#38BDF8', topPct: 57, leftPct: 62, kind: 'route', route: 'KesifSalonu' },
  { key: 'klan', title: 'Klan', icon: 'shield-account-outline', accentColor: '#F59E0B', topPct: 46, leftPct: 8, kind: 'soon', soonSubtitle: 'Görev yaparak klan seviyesi kazanacağınız, birlikte güçleneceğiniz sistem yakında.' },
  { key: 'nikah-salonu', title: 'Nikah Salonu', icon: 'ring', accentColor: '#F472B6', topPct: 35, leftPct: 62, kind: 'soon', soonSubtitle: 'Birini bulup nişanlanabileceğin, düğün töreni yapabileceğin salon yakında açılıyor.' },
  { key: 'onur-listesi', title: 'Onur Listesi', icon: 'trophy-outline', accentColor: GOLD, topPct: 17, leftPct: 8, kind: 'route', route: 'Popularity' },
];

const { width: CANVAS_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_HEIGHT = CANVAS_WIDTH * HUB_BG_RATIO;
// Sabit sanat eserinin oranı bazı cihazlarda ekran yüksekliğinden kısa kalıyor
// (koyu, boş bir şerit bırakıyor) — altına aynı sokağın taş dokusunu döşeyerek
// kasabanın "bittiği" hissini engelliyoruz, cihaz ne kadar uzun olursa olsun.
const EXTRA_GROUND_HEIGHT = Math.max(0, SCREEN_HEIGHT - CANVAS_HEIGHT + 40);
const NODE_WIDTH_PCT = 30;

export default function KaderKasabasiScreen({ navigation }: Props) {
  return (
    <GameEntryGate
      title="Kader Kasabası"
      subtitle="Sokakta dolaş, binalara gir — kasaba büyüdükçe içi de dolacak."
      icon="city-variant-outline"
      buttonLabel="Kasabaya Gir"
      loadingLines={LOADING_LINES}
      onExit={() => navigation.goBack()}
    >
      <KaderKasabasiHub navigation={navigation} />
    </GameEntryGate>
  );
}

function KaderKasabasiHub({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={HUB_BG}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          resizeMode="cover"
        >
          {BUILDINGS.map((building) => (
            <View
              key={building.key}
              style={[
                styles.node,
                { top: `${building.topPct}%`, left: `${building.leftPct}%`, width: `${NODE_WIDTH_PCT}%` },
              ]}
            >
              <Pressable
                onPress={() =>
                  building.kind === 'route'
                    ? navigation.navigate(building.route as never)
                    : navigation.navigate('KaderKasabasiOda', {
                        title: building.title,
                        subtitle: building.soonSubtitle,
                        icon: building.icon,
                      })
                }
                style={({ pressed }) => [styles.building, pressed && styles.buildingPressed]}
              >
                <View style={[styles.buildingIcon, { backgroundColor: `${building.accentColor}33`, borderColor: building.accentColor }]}>
                  <MaterialCommunityIcons name={building.icon} size={26} color={building.accentColor} />
                </View>
                <Text style={styles.buildingTitle}>{building.title}</Text>
                {building.kind === 'soon' && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>Yakında</Text>
                  </View>
                )}
              </Pressable>
            </View>
          ))}
        </ImageBackground>

        {EXTRA_GROUND_HEIGHT > 0 && (
          <View style={{ width: CANVAS_WIDTH, height: EXTRA_GROUND_HEIGHT }}>
            <Image source={PATH_TEXTURE} resizeMode="repeat" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={['rgba(11, 10, 31, 0.85)', 'rgba(11, 10, 31, 0)']}
              style={styles.groundSeam}
            />
          </View>
        )}
      </ScrollView>

      {/* Tam ekran — üstte HUD olarak geri dön + bakiye rozeti */}
      <View style={[styles.hud, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} style={styles.exitButton} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={GOLD} />
        </Pressable>
        <WalletBadge navigation={navigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0A1F',
  },
  scrollContent: {
    flexGrow: 1,
  },
  groundSeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  hud: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exitButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 17, 64, 0.8)',
    borderWidth: 1.4,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
  },
  building: {
    width: '100%',
    backgroundColor: 'rgba(30, 17, 64, 0.72)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buildingPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  buildingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  buildingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  soonBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  soonBadgeText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: GOLD,
  },
});
