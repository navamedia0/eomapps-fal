import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import { getAllGameStatuses } from '@/services/miniGamesCooldown';
import { getCoins, subscribeCoins } from '@/services/coins';
import FortuneWheelGame from '@/components/games/FortuneWheelGame';
import TarotMemoryGame from '@/components/games/TarotMemoryGame';
import CosmicTriviaGame from '@/components/games/CosmicTriviaGame';
import FortuneCookieGame from '@/components/games/FortuneCookieGame';
import StarshipGame from '@/components/games/StarshipGame';
import CoffeeCupGame from '@/components/games/CoffeeCupGame';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type GameKey = 'wheel' | 'match' | 'quiz' | 'cookie' | 'starship' | 'cup';

type GameDef = {
  key: GameKey;
  title: string;
  subtitle: string;
  rewardLabel: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accentColor: string;
};

const GAMES: GameDef[] = [
  {
    key: 'wheel',
    title: 'Kozmik Şans Çarkı',
    subtitle: 'Zodyak çarkını çevir, büyük ödülü kap.',
    rewardLabel: '5 - 25 Coin',
    icon: 'rotate-right',
    accentColor: '#F59E0B',
  },
  {
    key: 'starship',
    title: 'Kozmik Yıldız Avcısı',
    subtitle: 'Meteorlardan kaç, yıldızları topla.',
    rewardLabel: '15 Coin',
    icon: 'rocket-launch',
    accentColor: '#FBBF24',
  },
  {
    key: 'match',
    title: 'Tarot Kart Eşleştirme',
    subtitle: '12 tarot kartını hafızanda tut, çiftleri bul.',
    rewardLabel: '10 Coin',
    icon: 'cards-playing-outline',
    accentColor: '#A855F7',
  },
  {
    key: 'quiz',
    title: 'Mistik Bilgi Yarışması',
    subtitle: 'Astroloji ve fal dünyası hakkında 5 soru.',
    rewardLabel: '15 Coin',
    icon: 'brain',
    accentColor: '#38BDF8',
  },
  {
    key: 'cup',
    title: 'Kader Fincanı & Sırrı Bul',
    subtitle: 'Fincanın dibindeki gizli sembolleri yakala.',
    rewardLabel: '10 Coin',
    icon: 'coffee',
    accentColor: '#10B981',
  },
  {
    key: 'cookie',
    title: 'Günün Fal Kurabiyesi',
    subtitle: 'Kader niyetini tut, kurabiyeyi kır ve kehaneti gör.',
    rewardLabel: '3 - 8 Coin',
    icon: 'cookie',
    accentColor: '#EC4899',
  },
];

export default function MiniGamesScreen() {
  const [coins, setCoins] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);

  const refresh = useCallback(() => {
    getCoins().then(setCoins);
    getAllGameStatuses().then(setStatuses);
  }, []);

  useFocusEffect(refresh);

  useEffect(() => {
    return subscribeCoins(setCoins);
  }, []);

  const handleCloseGame = () => {
    setActiveGame(null);
    refresh();
  };

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ÜST BAŞLIK VE COIN BAKİYESİ */}
        <View style={styles.topHeader}>
          <View style={styles.coinBadge}>
            <MaterialCommunityIcons name="star-circle" size={18} color={GOLD} />
            <Text style={styles.coinBadgeText}>{coins} Coin</Text>
          </View>
        </View>

        <View style={styles.mainTitleWrap}>
          <Ionicons name="game-controller-outline" size={32} color={GOLD} />
          <Text style={styles.headerTitle}>Mini Oyunlar & Görevler</Text>
          <Text style={styles.headerSubtitle}>
            Mistik oyunları oyna, sezgilerini test et ve her gün ücretsiz Coin kazan!
          </Text>
        </View>

        {/* GÜNLÜK ÖDÜL DURUM KARTI */}
        <View style={styles.summaryBanner}>
          <LinearGradient
            colors={['rgba(255, 201, 60, 0.18)', 'rgba(255, 138, 0, 0.22)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <CornerTicks />
          <View style={styles.summaryIconWrap}>
            <MaterialCommunityIcons name="gift-outline" size={24} color={GOLD} />
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>Günlük Kozmik Görevler</Text>
            <Text style={styles.summaryDesc}>
              Her oyun her gün 00:00'da yeni coin ödülleriyle yenilenir.
            </Text>
          </View>
        </View>

        {/* 4 OYUN KARTI LİSTESİ */}
        <View style={styles.gamesList}>
          {GAMES.map((game) => {
            const isReady = statuses[game.key] !== false; // true ise ödül hazır

            return (
              <Pressable
                key={game.key}
                onPress={() => setActiveGame(game.key)}
                style={({ pressed }) => [styles.gameCard, pressed && styles.gameCardPressed]}
              >
                <CornerTicks />
                <View style={[styles.gameIconCircle, { borderColor: game.accentColor }]}>
                  <MaterialCommunityIcons name={game.icon} size={26} color={game.accentColor} />
                </View>

                <View style={styles.gameInfoWrap}>
                  <View style={styles.gameTitleRow}>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isReady
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                          borderColor: isReady ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: isReady ? '#34D399' : TEXT_MUTED },
                        ]}
                      >
                        {isReady ? 'HAZIR' : 'OYNANDI'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.gameSubtitle}>{game.subtitle}</Text>

                  <View style={styles.gameRewardRow}>
                    <MaterialCommunityIcons name="star-circle" size={14} color={GOLD} />
                    <Text style={styles.gameRewardText}>{game.rewardLabel} Ödül</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={GOLD_SOFT} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* AKTİF OYUN MODALI */}
      <Modal
        visible={activeGame !== null}
        animationType="slide"
        transparent
        onRequestClose={handleCloseGame}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {activeGame === 'wheel' && <FortuneWheelGame onClose={handleCloseGame} />}
              {activeGame === 'starship' && <StarshipGame onClose={handleCloseGame} />}
              {activeGame === 'match' && <TarotMemoryGame onClose={handleCloseGame} />}
              {activeGame === 'quiz' && <CosmicTriviaGame onClose={handleCloseGame} />}
              {activeGame === 'cup' && <CoffeeCupGame onClose={handleCloseGame} />}
              {activeGame === 'cookie' && <FortuneCookieGame onClose={handleCloseGame} />}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 30, 32, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.4)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  coinBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
  },
  mainTitleWrap: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  summaryBanner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    padding: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 201, 60, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryDesc: {
    fontSize: 11.5,
    color: TEXT_PRIMARY,
    lineHeight: 16,
  },
  gamesList: {
    gap: 14,
  },
  gameCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(30, 30, 32, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  gameIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfoWrap: {
    flex: 1,
    gap: 3,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gameSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  gameRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  gameRewardText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
  },
  modalScroll: {
    paddingVertical: 12,
  },
});
