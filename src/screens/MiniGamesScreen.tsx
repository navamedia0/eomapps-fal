import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const UPCOMING_GAMES = [
  { key: 'wheel', title: 'Şans Çarkı', subtitle: 'Günde bir kez çevir, coin kazan', icon: 'sync-outline' as const },
  { key: 'match', title: 'Kart Eşleştirme', subtitle: 'Tarot kartlarını eşleştir, hafızanı test et', icon: 'grid-outline' as const },
  { key: 'quiz', title: 'Fal Bilgi Yarışması', subtitle: 'Sorulara doğru cevap ver, coin kazan', icon: 'help-circle-outline' as const },
];

export default function MiniGamesScreen() {
  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Ionicons name="game-controller-outline" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Mini Oyunlar</Text>
          <Text style={styles.headerSubtitle}>Oynayarak coin kazanacağın oyunlar yakında burada</Text>
        </View>

        <View style={styles.list}>
          {UPCOMING_GAMES.map((game) => (
            <View key={game.key} style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={game.icon} size={22} color={GOLD} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{game.title}</Text>
                <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
              </View>
              <Text style={styles.cardBadge}>Yakında</Text>
            </View>
          ))}
        </View>
      </View>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 16,
    opacity: 0.75,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  cardBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
  },
});
