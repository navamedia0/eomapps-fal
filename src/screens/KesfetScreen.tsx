import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import FeatureIcon from '@/components/FeatureIcon';
import CornerTicks from '@/components/CornerTicks';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import quotes from '@/data/kesfet_sozleri.json';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Kesfet'>,
  NativeStackScreenProps<RootStackParamList>
>;

const QUOTES: string[] = quotes;

const FEATURES: Array<{
  key: keyof RootStackParamList;
  iconKey: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'Dice',
    iconKey: 'dice',
    title: 'Zar Falı',
    subtitle: 'Zarları at, şansına bak',
    icon: <MaterialCommunityIcons name="dice-multiple-outline" size={24} color={GOLD} />,
  },
  {
    key: 'Daisy',
    iconKey: 'daisy',
    title: 'Papatya Falı',
    subtitle: 'Seviyor mu, sevmiyor mu?',
    icon: <Ionicons name="flower-outline" size={22} color={GOLD} />,
  },
  {
    key: 'MagicBall',
    iconKey: 'magicBall',
    title: 'Sihirli Küre',
    subtitle: 'Evet ya da hayır? Küreye sor',
    icon: <MaterialCommunityIcons name="crystal-ball" size={24} color={GOLD} />,
  },
  {
    key: 'SuFal',
    iconKey: 'suFal',
    title: 'Su Falı',
    subtitle: 'Suya dokun, cevabını al',
    icon: <Ionicons name="water-outline" size={22} color={GOLD} />,
  },
  {
    key: 'AngelCard',
    iconKey: 'angelCard',
    title: 'Günün İlham Kartı',
    subtitle: 'Bugüne küçük bir mesaj',
    icon: <Ionicons name="rose-outline" size={22} color={GOLD} />,
  },
  {
    key: 'MoonCalendar',
    iconKey: 'moonCalendar',
    title: 'Ay Takvimi',
    subtitle: 'Bugün ayın hangi evresindeyiz?',
    icon: <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={GOLD} />,
  },
];

type FeedItem = { type: 'quote'; text: string } | { type: 'feature'; feature: (typeof FEATURES)[number] };

function buildFeed(): FeedItem[] {
  const feed: FeedItem[] = [];
  let featureCount = 0;
  for (let i = 0; i < QUOTES.length; i += 1) {
    feed.push({ type: 'quote', text: QUOTES[i] });
    if ((i + 1) % 3 === 0) {
      feed.push({ type: 'feature', feature: FEATURES[featureCount % FEATURES.length] });
      featureCount += 1;
    }
  }
  return feed;
}

const FEED = buildFeed();

export default function KesfetScreen({ navigation }: Props) {
  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="compass-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Keşfet</Text>
        </View>

        <View style={styles.feed}>
          {FEED.map((item, index) => {
            if (item.type === 'quote') {
              return (
                <View key={index} style={styles.quoteCard}>
                  <CornerTicks />
                  <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} style={styles.quoteIcon} />
                  <Text style={styles.quoteText}>{item.text}</Text>
                  <View style={styles.quoteShareRow}>
                    <ShareButton text={`Mistik Rehber\n\n"${item.text}"`} label="Paylaş" />
                    <ShareImageButton text={item.text} label="Görsel Paylaş" />
                  </View>
                </View>
              );
            }
            const { feature } = item;
            return (
              <Pressable
                key={index}
                onPress={() => navigation.navigate(feature.key as any)}
                style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
              >
                <FeatureIcon source={FEATURE_ICONS[feature.iconKey]} fallback={feature.icon} size={44} />
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={GOLD} />
              </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  feed: {
    gap: 14,
  },
  quoteCard: {
    position: 'relative',
    backgroundColor: NIGHT_CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 20,
    alignItems: 'center',
  },
  quoteIcon: {
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteShareRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  featureCardPressed: {
    opacity: 0.85,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
});
