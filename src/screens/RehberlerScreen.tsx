import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

const UPCOMING = [
  { icon: 'person-circle-outline' as const, title: 'Rehber Profilleri', desc: 'Uzmanlık alanı, puan ve rozetleriyle vitrine çıkan profiller.' },
  { icon: 'call-outline' as const, title: 'Anlık Sesli Görüşme', desc: 'Müsait bir rehberi görünce hemen sesli sohbete başla.' },
  { icon: 'ribbon-outline' as const, title: 'Öne Çıkan Rehberler', desc: 'Aktiflik ve aldığı destekle sıralamada yükselen profiller.' },
];

export default function RehberlerScreen({ navigation }: Props) {
  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="sparkles-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Rehberler</Text>
        </View>

        <View style={styles.heroCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="star-crescent" size={22} color={GOLD} style={{ marginBottom: 10 }} />
          <Text style={styles.heroTitle}>Çok Yakında</Text>
          <Text style={styles.heroText}>
            Uzman yorumcuların profillerini gezip, seninle sesli sohbet edebileceği bu bölüm hazırlanıyor.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Gelecek Olanlar</Text>
        <View style={styles.list}>
          {UPCOMING.map((item) => (
            <View key={item.title} style={styles.card}>
              <View style={styles.cardIconWrap}>
                <Ionicons name={item.icon} size={22} color={GOLD} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: GOLD },
  heroCard: {
    position: 'relative',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    padding: 22,
    marginBottom: 28,
  },
  heroTitle: { fontSize: 16, fontWeight: '800', color: GOLD, marginBottom: 8 },
  heroText: { fontSize: 13, lineHeight: 20, color: TEXT_PRIMARY, textAlign: 'center' },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  list: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 14.5, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 2 },
  cardSubtitle: { fontSize: 11.5, color: TEXT_MUTED, lineHeight: 16 },
});
