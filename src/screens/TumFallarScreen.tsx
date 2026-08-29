import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TumFallar'>;

type GridItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: (navigation: Props['navigation']) => void;
};

type Ekol = {
  key: string;
  title: string;
  sub: string;
  accent: string;
  bgImage?: any;
  buttonFrame?: any;
  items: GridItem[];
};

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

function EkolGridButton({
  item,
  accent,
  buttonFrame,
  navigation,
}: {
  item: GridItem;
  accent: string;
  buttonFrame?: any;
  navigation: Props['navigation'];
}) {
  return (
    <Pressable
      onPress={() => item.onPress(navigation)}
      style={({ pressed }) => [
        styles.gridButton,
        { borderColor: accent },
        buttonFrame && styles.gridButtonWithFrame,
        pressed && styles.gridButtonPressed,
      ]}
    >
      {buttonFrame && (
        <Image
          source={buttonFrame}
          resizeMode="stretch"
          style={styles.buttonFrameImage}
        />
      )}
      <View style={styles.buttonInnerContent}>
        {/* DO NOT TOUCH: FeatureIcon and symbols remain completely intact */}
        <FeatureIcon source={FEATURE_ICONS[item.key]} fallback={item.icon} size={50} />
        <View style={styles.gridTextWrap}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={accent} style={styles.gridChevron} />
      </View>
    </Pressable>
  );
}

export default function TumFallarScreen({ navigation }: Props) {
  const ekoller: Ekol[] = [
    {
      key: 'cin-ekolu',
      title: 'Çin Ekolü',
      sub: 'Lake kırmızısı & imparatorluk altını',
      accent: '#E11D48',
      bgImage: require('@/assets/ekoller/cin_section_bg.jpg'),
      buttonFrame: require('@/assets/ekoller/cin_btn_frame.png'),
      items: [
        {
          key: 'face',
          title: 'Yüz Falı',
          subtitle: 'Sima ilmiyle kaderini keşfet',
          icon: <MaterialCommunityIcons name="face-recognition" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('ImageReading', { kind: 'face' }),
        },
        {
          key: 'iching',
          title: 'Çin I Ching Falı',
          subtitle: '3 sikke ile 64 heksagram',
          icon: <MaterialCommunityIcons name="yin-yang" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('IChingReading'),
        },
      ],
    },
    {
      key: 'osmanli-ekolu',
      title: 'Osmanlı & Anadolu Ekolü',
      sub: 'İznik turkuazı & pirinç & lale motifi',
      accent: '#0EA5E9',
      bgImage: require('@/assets/ekoller/osmanli_section_bg.jpg'),
      buttonFrame: require('@/assets/ekoller/osmanli_btn_frame.png'),
      items: [
        {
          key: 'coffee',
          title: 'Kahve Falı',
          subtitle: 'Fincanındaki sırları çözelim',
          icon: <MaterialCommunityIcons name="coffee" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('ImageReading', { kind: 'coffee' }),
        },
        {
          key: 'bakla',
          title: '41 Bakla Falı',
          subtitle: '3 ocak remil kehaneti',
          icon: <MaterialCommunityIcons name="dots-hexagon" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('BaklaReading'),
        },
      ],
    },
    {
      key: 'nordik-kelt-ekolu',
      title: 'Nordik & Kelt Ekolü',
      sub: 'Kayrak grisi & yosun yeşili & bronz',
      accent: '#5B8266',
      items: [
        {
          key: 'rune',
          title: 'Nordik Rün Falı',
          subtitle: 'Vikinglerin kutsal taşları',
          icon: <MaterialCommunityIcons name="triangle-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('RuneReading'),
        },
        {
          key: 'celticTree',
          title: 'Kelt Ağaç Takvimi',
          subtitle: 'Druidlerin kutsal 13 ağaç burcu',
          icon: <MaterialCommunityIcons name="tree-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('CelticTreeReading'),
        },
      ],
    },
    {
      key: 'bati-ezoterik-ekolu',
      title: 'Evrensel Batı Ezoterik Ekolü',
      sub: 'Ametist moru & antika pirinç & mum ışığı',
      accent: '#7C5CBF',
      items: [
        {
          key: 'palm',
          title: 'El Falı',
          subtitle: 'Avucundaki çizgileri oku',
          icon: <MaterialCommunityIcons name="hand-back-right-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('ImageReading', { kind: 'palm' }),
        },
        {
          key: 'tea',
          title: 'Çay Falı',
          subtitle: 'Tasseografi yaprak desenleri',
          icon: <MaterialCommunityIcons name="leaf" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('ImageReading', { kind: 'tea' }),
        },
        {
          key: 'wax',
          title: 'Balmumu Falı',
          subtitle: 'Alevin ve balmumunun aşk dili',
          icon: <MaterialCommunityIcons name="candle" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('WaxReading'),
        },
        {
          key: 'scrying',
          title: 'Kara Ayna Durugörü',
          subtitle: 'Obsidyen ayna ile sezgisel vizyon',
          icon: <MaterialCommunityIcons name="mirror" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('ScryingReading'),
        },
        {
          key: 'aura',
          title: 'Aura & Çakra Falı',
          subtitle: '7 çakra ve ışıltılı aura analizi',
          icon: <MaterialCommunityIcons name="atom" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('AuraEnergy'),
        },
        {
          key: 'matrix',
          title: 'Kader Matrisi',
          subtitle: '22 Arkana ve sekizgen haritan',
          icon: <MaterialCommunityIcons name="octagram-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('MatrixOfDestiny'),
        },
      ],
    },
    {
      key: 'ruya-ekolu',
      title: 'Bilinçaltı & Rüya Ekolü',
      sub: 'Gece indigosu & aurora moru-turkuazı',
      accent: '#8B7CF6',
      items: [
        {
          key: 'dream',
          title: 'Rüya Yorumlama',
          subtitle: 'Rüyanın sembollerini birlikte çöz',
          icon: <Ionicons name="moon" size={24} color={GOLD} />,
          onPress: (nav) => nav.navigate('DreamChat'),
        },
        {
          key: 'dreamLibrary',
          title: 'Rüya Kitaplığı',
          subtitle: 'Geçmiş rüyalarını sakla, ara',
          icon: <Ionicons name="library-outline" size={24} color={GOLD} />,
          onPress: (nav) => nav.navigate('RuyaKitapligi'),
        },
      ],
    },
    {
      key: 'klasik-evrensel',
      title: 'Klasik & Evrensel Fallar',
      sub: 'Geleneksel kehanet çeşitleri',
      accent: GOLD,
      items: [
        {
          key: 'tarot',
          title: 'Tarot Falı',
          subtitle: '78 kart ile kadim arketip açılımı',
          icon: <MaterialCommunityIcons name="cards-playing-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('TarotSpread'),
        },
        {
          key: 'katina',
          title: 'Katina Aşk Falı',
          subtitle: 'Deste-i Katina 65 kartlık ilişki açılımı',
          icon: <MaterialCommunityIcons name="cards-heart-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('Katina'),
        },
        {
          key: 'solitaire',
          title: 'İskambil Falı',
          subtitle: '32 kartlık klasik kader açılımı',
          icon: <MaterialCommunityIcons name="cards-spade" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('Solitaire'),
        },
        {
          key: 'daisy',
          title: 'Papatya Falı',
          subtitle: 'Seviyor / sevmiyor interaktif fal',
          icon: <MaterialCommunityIcons name="flower-tulip-outline" size={26} color={GOLD} />,
          onPress: (nav) => nav.navigate('Daisy'),
        },
        {
          key: 'dice',
          title: 'Zar Falı',
          subtitle: '3 kutsal zarın kombinasyon yorumu',
          icon: <Ionicons name="dice-outline" size={24} color={GOLD} />,
          onPress: (nav) => nav.navigate('Dice'),
        },
        {
          key: 'voiceReading',
          title: 'Sesli Fal',
          subtitle: 'Anlat, yapay zeka yorumlasın',
          icon: <Ionicons name="mic-outline" size={24} color={GOLD} />,
          onPress: (nav) => nav.navigate('VoiceReading'),
        },
      ],
    },
  ];

  return (
    <MysticTableBackground variant="general">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="earth" size={22} color={GOLD} />
          <Text style={styles.headerTitle}>Tüm Fal Çeşitleri</Text>
        </View>
        <Text style={styles.headerCaption}>Dünyanın dört bir yanından kadim kehanet ekolleri</Text>

        <View style={styles.ekolList}>
          {ekoller.map((ekol) => {
            const hasThemedFrame = !!ekol.bgImage;

            const content = (
              <View style={[styles.ekolInnerPadding, hasThemedFrame && styles.ekolThemedPadding]}>
                <View style={[styles.ekolHeadBar, { backgroundColor: ekol.accent }]} />
                <Text style={[styles.ekolTitle, { color: ekol.accent }]}>{ekol.title}</Text>
                <Text style={styles.ekolSub}>{ekol.sub}</Text>
                <View style={styles.grid}>
                  {chunkPairs(ekol.items).map((pair, idx) => (
                    <View key={`${ekol.key}-${idx}`} style={styles.gridRow}>
                      <EkolGridButton
                        item={pair[0]}
                        accent={ekol.accent}
                        buttonFrame={ekol.buttonFrame}
                        navigation={navigation}
                      />
                      {pair[1] ? (
                        <EkolGridButton
                          item={pair[1]}
                          accent={ekol.accent}
                          buttonFrame={ekol.buttonFrame}
                          navigation={navigation}
                        />
                      ) : (
                        <View style={styles.gridPlaceholder} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );

            if (hasThemedFrame) {
              return (
                <View
                  key={ekol.key}
                  style={[styles.ekolThemedContainer, { borderColor: ekol.accent }]}
                >
                  <ImageBackground
                    source={ekol.bgImage}
                    resizeMode="cover"
                    style={StyleSheet.absoluteFillObject}
                  />
                  <LinearGradient
                    colors={['rgba(12, 6, 24, 0.82)', 'rgba(8, 4, 18, 0.92)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {content}
                </View>
              );
            }

            return (
              <View key={ekol.key} style={styles.ekolSection}>
                {content}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 48,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  headerCaption: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  ekolList: {
    width: '100%',
    gap: 20,
  },
  ekolSection: {
    width: '100%',
  },
  ekolThemedContainer: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  ekolInnerPadding: {
    width: '100%',
  },
  ekolThemedPadding: {
    padding: 14,
  },
  ekolHeadBar: {
    width: 36,
    height: 3.5,
    borderRadius: 2,
    marginBottom: 8,
  },
  ekolTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ekolSub: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 2,
    marginBottom: 12,
  },
  grid: {
    width: '100%',
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  gridButton: {
    flex: 1,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1.2,
    minHeight: 74,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  gridButtonWithFrame: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonFrameImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  buttonInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 8,
    zIndex: 2,
  },
  gridButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  gridPlaceholder: {
    flex: 1,
  },
  gridTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  gridChevron: {
    opacity: 0.85,
    marginRight: 2,
  },
});
