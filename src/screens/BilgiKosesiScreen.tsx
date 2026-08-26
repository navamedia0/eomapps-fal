import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, INFO_PURPLE, INFO_PURPLE_SOFT, INFO_CREAM, INFO_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

const ITEMS: Array<{
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: (navigation: Props['navigation']) => void;
}> = [
  {
    key: 'iskambil',
    title: 'İskambil Kartları ve Anlamları',
    subtitle: '52 kartın geleneksel fal anlamlarını keşfet',
    icon: <MaterialCommunityIcons name="cards-playing-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('KartAnlamlari', { deck: 'iskambil' }),
  },
  {
    key: 'tarot',
    title: 'Tarot Kartları ve Anlamları',
    subtitle: '78 kartlık Rider-Waite destesinin tam rehberi',
    icon: <MaterialCommunityIcons name="cards-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('KartAnlamlari', { deck: 'tarot' }),
  },
  {
    key: 'kahve',
    title: 'Kahve Falı Ne Zaman Bulundu?',
    subtitle: 'Osmanlı\'dan günümüze kahve falının hikayesi',
    icon: <MaterialCommunityIcons name="coffee-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'kahve_tarihi' }),
  },
  {
    key: 'katina',
    title: 'Katina Falı Nedir?',
    subtitle: 'İskambil kartlarıyla fal bakma geleneği',
    icon: <MaterialCommunityIcons name="cards-club-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'katina_nedir' }),
  },
  {
    key: 'burc',
    title: 'Burçların Kökeni ve 4 Element',
    subtitle: 'Zodyağın Babil\'den günümüze yolculuğu',
    icon: <MaterialCommunityIcons name="zodiac-leo" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'burc_kokeni' }),
  },
];

export default function BilgiKosesiScreen({ navigation }: Props) {
  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="star-crescent" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Bilgi Köşesi</Text>
          <Text style={styles.headerSubtitle}>Bunları biliyor muydunuz?</Text>
        </View>

        <View style={styles.list}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => item.onPress(navigation)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <CornerTicks />
              <View style={styles.iconWrap}>{item.icon}</View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={INFO_CREAM} />
            </Pressable>
          ))}
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
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: INFO_MUTED,
    fontStyle: 'italic',
  },
  list: {
    gap: 14,
  },
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: INFO_PURPLE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: INFO_PURPLE_SOFT,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(240, 234, 214, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: INFO_CREAM,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: INFO_MUTED,
    lineHeight: 16,
  },
});
