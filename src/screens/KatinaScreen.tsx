import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { shuffleKatinaDeck, type KatinaCard } from '@/services/katina';
import { interpretKatinaSpread } from '@/services/readings-ai';
import { ApiRequestError } from '@/services/http';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import { saveReadingHistory } from '@/services/readingHistory';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { turkishUpperCase } from '@/utils/turkishCase';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import type { ReadingSection } from '@/utils/parseNumberedSections';
import PlayingCardFace from '@/components/PlayingCardFace';
import PlayingCardBack, { type PlayingCardBackVariant } from '@/components/PlayingCardBack';
import CornerTicks from '@/components/CornerTicks';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import ReadingCooldownNotice from '@/components/ReadingCooldownNotice';
import { useReadingCooldown } from '@/hooks/useReadingCooldown';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Katina'>;
type ReadingPhase = 'deck' | 'draw' | 'element' | 'loading' | 'result' | 'error' | 'blocked';
type DeckStyle = { id: string; label: string; desc: string; variant: PlayingCardBackVariant; toneHint?: string };
type ElementCard = { id: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap };

const POSITIONS = ['Geçmiş', 'Şimdi', 'Gelecek'];
const DISPLAY_POSITIONS = ['Geçmiş', 'Şimdi', 'Gelecek', 'Genel Yorum'];

// Deste Kartları — deste seçimi sadece görünüm/ton içindir, açılımın
// rastgeleliğini etkilemez; ilişkiye dair yorumun vurgusunu hafifçe kaydırır.
const DECK_STYLES: DeckStyle[] = [
  { id: 'klasik', label: 'Klasik Deste', desc: 'Dengeli, nötr enerji', variant: 'gold' },
  {
    id: 'ask',
    label: 'Aşk Destesi',
    desc: 'Tutku ve ilişki enerjisi',
    variant: 'ruby',
    toneHint: 'Bu okumada özellikle aşk, tutku ve ilişki dinamiklerine daha fazla vurgu yap.',
  },
  {
    id: 'kader',
    label: 'Kader Destesi',
    desc: 'Kader ve yaşam yolu enerjisi',
    variant: 'amethyst',
    toneHint: 'Bu okumada özellikle kader, hayat yolu ve ruhsal büyüme temalarına daha fazla vurgu yap.',
  },
];

// Elementlerin Ruhu — dekoratif bir ritüel katmanı, seçilen kart yorum
// metnine dahil edilmez.
const ELEMENT_CARDS: ElementCard[] = [
  { id: 'ates', label: 'Ateş', icon: 'fire' },
  { id: 'su', label: 'Su', icon: 'water' },
  { id: 'toprak', label: 'Toprak', icon: 'terrain' },
  { id: 'hava', label: 'Hava', icon: 'weather-windy' },
  { id: 'ruh', label: 'Ruh', icon: 'star-four-points-outline' },
];

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function CardFace({ card, position }: { card: KatinaCard; position: string }) {
  const rankSlug = card.id.slice(card.suit.length + 1);
  return (
    <View style={styles.cardFace}>
      <Text style={styles.cardPositionHeader}>{turkishUpperCase(position)}</Text>
      <PlayingCardFace suit={card.suit} rankSlug={rankSlug} size={98} />
      <Text style={styles.cardFaceName}>{card.name}</Text>
    </View>
  );
}

export default function KatinaScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<ReadingPhase>('deck');
  const [deckStyleId, setDeckStyleId] = useState<string>(DECK_STYLES[0].id);
  const [shuffledDrawDeck, setShuffledDrawDeck] = useState<KatinaCard[]>([]);
  const [cards, setCards] = useState<KatinaCard[]>([]);
  const [elementOrder, setElementOrder] = useState<ElementCard[]>([]);
  const [revealedElementIndex, setRevealedElementIndex] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  const pulse = useRef(new Animated.Value(0)).current;
  const { remaining: cooldownRemaining, checked: cooldownChecked, notifyCongested } = useReadingCooldown('katina');

  const selectedDeckStyle = useMemo(
    () => DECK_STYLES.find((style) => style.id === deckStyleId) ?? DECK_STYLES[0],
    [deckStyleId],
  );

  const handleProceedToDraw = useCallback(() => {
    setShuffledDrawDeck(shuffleKatinaDeck());
    setCards([]);
    setPhase('draw');
  }, []);

  const handleCardTap = useCallback((card: KatinaCard) => {
    setCards((prev) => {
      if (prev.length >= 3 || prev.some((c) => c.id === card.id)) return prev;
      const next = [...prev, card];
      if (next.length === 3) {
        setTimeout(() => {
          setElementOrder(shuffleArray(ELEMENT_CARDS));
          setRevealedElementIndex(null);
          setPhase('element');
        }, 550);
      }
      return next;
    });
  }, []);

  const handleElementTap = useCallback((idx: number) => {
    setRevealedElementIndex((prev) => (prev === null ? idx : prev));
  }, []);

  const startReading = useCallback(
    async (payWithCoins = false) => {
      if (cooldownRemaining > 0 || cards.length < 3) return;

      setPhase('loading');
      setError(null);
      setBlocked(null);
      setCoinFallback(null);

      try {
        if (payWithCoins) {
          const spent = await spendCoins(READING_COIN_COST);
          if (!spent) {
            setCoinFallback({ coins: await getCoins() });
            setPhase('blocked');
            return;
          }
        } else {
          const remaining = await getCredits();
          if (remaining < 1) {
            setCoinFallback({ coins: await getCoins() });
            setPhase('blocked');
            return;
          }
        }

        const interpretation = await interpretKatinaSpread(cards, POSITIONS, payWithCoins, selectedDeckStyle.toneHint);

        if (!payWithCoins) {
          await spendCredit();
        }

        setResult(interpretation);
        setPhase('result');
        await saveReadingHistory({ type: 'katina', title: 'Katina Falı', result: interpretation });
      } catch (err) {
        if (err instanceof ApiRequestError && err.congestion) {
          notifyCongested(err.retryAfterSeconds ?? 30);
        }
        let message = err instanceof Error ? err.message : 'Kartlar okunurken bir sorun oluştu.';
        if (payWithCoins) {
          // Ücret alındı ama sonuç gelmediyse iade et — ücretsiz hak
          // (spendCredit) zaten sadece başarıdan SONRA düşülüyor, oradan
          // kayıp yok.
          await addCoins(READING_COIN_COST);
          message += ` (${READING_COIN_COST} coin iade edildi.)`;
        }
        setError(message);
        setPhase('error');
      }
    },
    [cooldownRemaining, notifyCongested, cards, selectedDeckStyle],
  );

  const resetToReady = useCallback(() => {
    setPhase('deck');
    setDeckStyleId(DECK_STYLES[0].id);
    setShuffledDrawDeck([]);
    setCards([]);
    setElementOrder([]);
    setRevealedElementIndex(null);
    setResult(null);
    setError(null);
    setBlocked(null);
    setCoinFallback(null);
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const sections = useMemo(() => (result ? parseSpreadReading(result, DISPLAY_POSITIONS) : null), [result]);
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const nextPositionLabel = cards.length < 3 ? POSITIONS[cards.length] : null;

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.katina.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Üst Başlık */}
        <View style={styles.header}>
          <FeatureIcon
            source={FEATURE_ICONS.katina}
            fallback={<MaterialCommunityIcons name="cards-playing-outline" size={32} color={GOLD} />}
            size={68}
          />
          <Text style={styles.headerTitle}>Katina Falı</Text>
          <Text style={styles.headerSubtitle}>İzmir Deste Falı & Aşk Kehaneti</Text>
        </View>

        {/* 1. AŞAMA: DESTE KARTLARI */}
        {phase === 'deck' && (
          <View style={styles.readyContainer}>
            <View style={styles.introCard}>
              <CornerTicks />
              <View style={styles.introHeader}>
                <MaterialCommunityIcons name="star-crescent" size={18} color={GOLD} />
                <Text style={styles.introTitle}>Katina Destesi Seni Dinliyor</Text>
              </View>
              <Text style={styles.introText}>
                Katina falı; özellikle aşk, tutku, sırlar ve ikili ilişkilerin kadim kehanet aynasıdır. Zihnini niyetine
                veya merak ettiğin kişiye odakla, ardından sana uygun desteyi seç ve ritüele başla.
              </Text>
            </View>

            {cooldownChecked && cooldownRemaining > 0 ? (
              <View style={styles.cooldownWrap}>
                <Ionicons name="hourglass-outline" size={24} color={GOLD} />
                <Text style={styles.cooldownText}>Yeni bir fal için bekleme süresi:</Text>
                <ReadingCooldownNotice remaining={cooldownRemaining} />
              </View>
            ) : (
              <>
                <Text style={styles.stageTitle}>Deste Kartları</Text>
                <Text style={styles.stageSubtitle}>Sana en çok hitap eden enerjiyi taşıyan desteyi seç.</Text>

                <View style={styles.deckChoiceRow}>
                  {DECK_STYLES.map((style) => {
                    const selected = style.id === deckStyleId;
                    return (
                      <Pressable
                        key={style.id}
                        onPress={() => setDeckStyleId(style.id)}
                        style={[styles.deckChoiceCard, selected && styles.deckChoiceCardActive]}
                      >
                        {selected && (
                          <View style={styles.deckChoiceCheck}>
                            <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                          </View>
                        )}
                        <PlayingCardBack width={56} variant={style.variant} />
                        <Text style={styles.deckChoiceLabel}>{style.label}</Text>
                        <Text style={styles.deckChoiceDesc}>{style.desc}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.deckPreviewRow}>
                  <Ionicons name="arrow-forward" size={18} color={GOLD_SOFT} />
                  <PlayingCardBack width={72} variant={selectedDeckStyle.variant} />
                </View>

                <Pressable
                  onPress={handleProceedToDraw}
                  style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
                >
                  <MaterialCommunityIcons name="star-crescent" size={20} color="#1a0d33" />
                  <Text style={styles.startButtonText}>Devam Et</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* 2. AŞAMA: KART AÇILIMI (ELLE SEÇİM) */}
        {phase === 'draw' && (
          <View style={styles.readyContainer}>
            <View style={styles.spreadHeaderRow}>
              <Text style={styles.stageTitle}>3 Kart Açılımı</Text>
              <Ionicons name="chevron-down" size={16} color={GOLD_SOFT} />
            </View>
            <Text style={styles.stageSubtitle}>
              {nextPositionLabel ? `Sırada: ${turkishUpperCase(nextPositionLabel)} kartını seç` : 'Kartların açılıyor...'}
            </Text>

            <View style={styles.progressRow}>
              {POSITIONS.map((pos, idx) => {
                const picked = cards[idx];
                const isActiveSlot = idx === cards.length;
                return (
                  <View key={pos} style={styles.progressSlot}>
                    <Text style={styles.closedCardLabel}>{turkishUpperCase(pos)}</Text>
                    {picked ? (
                      <View style={styles.progressSlotFilled}>
                        <PlayingCardBack width={50} variant={selectedDeckStyle.variant} />
                        <View style={styles.progressCheck}>
                          <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.progressSlotEmpty, isActiveSlot && styles.progressSlotEmptyActive]} />
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.drawGrid}>
              {shuffledDrawDeck.map((card) => {
                const pickedIndex = cards.findIndex((c) => c.id === card.id);
                const isPicked = pickedIndex !== -1;
                return (
                  <Pressable
                    key={card.id}
                    onPress={() => handleCardTap(card)}
                    disabled={isPicked || cards.length >= 3}
                    style={styles.drawGridItem}
                  >
                    <View style={isPicked ? styles.drawGridItemPicked : undefined}>
                      <PlayingCardBack width={32} variant={selectedDeckStyle.variant} />
                    </View>
                    {isPicked && (
                      <View style={styles.drawGridBadge}>
                        <Text style={styles.drawGridBadgeText}>{pickedIndex + 1}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 3. AŞAMA: ELEMENTLERİN RUHU (DEKORATİF RİTÜEL) */}
        {phase === 'element' && (
          <View style={styles.readyContainer}>
            <Text style={styles.stageTitle}>Elementlerin Ruhu</Text>
            <Text style={styles.stageSubtitle}>Sezgine güven ve seni çağıran kartı seç.</Text>

            <View style={styles.elementRow}>
              {elementOrder.map((el, idx) => {
                const isRevealed = revealedElementIndex === idx;
                return (
                  <Pressable
                    key={el.id}
                    onPress={() => handleElementTap(idx)}
                    disabled={revealedElementIndex !== null}
                    style={styles.elementCardWrap}
                  >
                    {isRevealed ? (
                      <View style={styles.elementCardFace}>
                        <MaterialCommunityIcons name={el.icon} size={22} color={GOLD} />
                      </View>
                    ) : (
                      <PlayingCardBack width={44} variant="amethyst" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {revealedElementIndex !== null && (
              <View style={styles.elementRevealWrap}>
                <Ionicons name="arrow-down" size={18} color={GOLD_SOFT} />
                <View style={styles.elementRevealBig}>
                  <MaterialCommunityIcons name={elementOrder[revealedElementIndex].icon} size={38} color={GOLD} />
                  <Text style={styles.elementRevealLabel}>{elementOrder[revealedElementIndex].label} Ruhu</Text>
                </View>

                <Pressable
                  onPress={() => startReading()}
                  style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
                >
                  <MaterialCommunityIcons name="star-crescent" size={20} color="#1a0d33" />
                  <Text style={styles.startButtonText}>Falımı Yorumla</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* YÜKLENİYOR */}
        {phase === 'loading' && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <MaterialCommunityIcons name="star-crescent" size={44} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>
              Katina kartları açılıyor ve yorumlanıyor...
            </Animated.Text>
          </View>
        )}

        {/* HATA VEYA ENGEL DURUMLARI */}
        {phase === 'error' && error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => startReading()} style={styles.retryButton}>
              <MaterialCommunityIcons name="refresh" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {phase === 'blocked' && blocked && (
          <View style={styles.blockedBox}>
            <Ionicons name="moon" size={24} color={GOLD} />
            <Text style={styles.blockedText}>{blocked}</Text>
            <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
              <Ionicons name="home-outline" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
            </Pressable>
          </View>
        )}

        {coinFallback && (
          <CoinFallbackBox
            cost={READING_COIN_COST}
            coins={coinFallback.coins}
            onContinue={() => startReading(true)}
            onBuyCoins={() => navigation.navigate('CoinShop')}
            onDismiss={() => navigation.navigate('Home')}
          />
        )}

        {/* SONUÇ GÖSTERİMİ */}
        {phase === 'result' && result && (
          <View style={styles.resultContainer}>
            {/* Açılan 3 Kartın Sıralanması */}
            <View style={styles.cardsRow}>
              {cards.map((card, idx) => (
                <CardFace key={card.id} card={card} position={POSITIONS[idx]} />
              ))}
            </View>

            {/* Yorum Blokları */}
            <View style={styles.resultList}>
              {DISPLAY_POSITIONS.map((position, index) => (
                <View
                  key={position}
                  style={[styles.resultBlock, position === 'Genel Yorum' && styles.overallBlock]}
                >
                  <CornerTicks />
                  <View style={styles.resultBlockHeader}>
                    <MaterialCommunityIcons name="star-crescent" size={14} color={GOLD} />
                    <Text style={[styles.positionLabel, position === 'Genel Yorum' && styles.overallLabel]}>
                      {position === 'Genel Yorum' ? 'GENEL YORUM & HAYAT ÇIKARIMI' : turkishUpperCase(position)}
                    </Text>
                  </View>
                  <Text style={styles.interpretationText}>{sections ? sections[index] : result}</Text>
                </View>
              ))}

              {/* Alt Butonlar: Paylaş & Yeni Fal */}
              <View style={styles.actionsRow}>
                <ShareButton text={`Mistik Rehber - Katina Falım\n\n${result}`} />
                <Pressable
                  onPress={resetToReady}
                  style={({ pressed }) => [styles.newReadingButton, pressed && styles.newReadingButtonPressed]}
                >
                  <MaterialCommunityIcons name="cards-playing-outline" size={18} color={GOLD} />
                  <Text style={styles.newReadingButtonText}>Yeni Fal Bak</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {phase === 'result' && sections ? (
        <ParchmentReadingResult
          visible={true}
          badge="Katina Aşk Falı Raporu"
          sections={DISPLAY_POSITIONS.map((pos, idx) => ({
            title: pos === 'Genel Yorum' ? 'Genel Yorum & İlişki Tavsiyesi' : `${pos} Kartı Yorumu`,
            body: sections[idx] || '',
          }))}
          shareTextPrefix="Mistik Rehber - Katina Aşk Falım"
          parchmentBg={FORTUNE_THEMES.katina.resultBg}
          accentColor={FORTUNE_THEMES.katina.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={resetToReady}
        />
      ) : null}
      {FORTUNE_THEMES.katina.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.katina.figure}
          title={FORTUNE_THEMES.katina.splashTitle}
          subtitle={FORTUNE_THEMES.katina.splashSubtitle}
          accentColor={FORTUNE_THEMES.katina.accentColor}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  readyContainer: {
    alignItems: 'center',
    width: '100%',
  },
  introCard: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'rgba(30, 30, 32, 0.85)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.32)',
    padding: 16,
    marginBottom: 24,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: GOLD,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  stageSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 4,
    marginBottom: 18,
    textAlign: 'center',
  },
  spreadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closedCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
    letterSpacing: 0.5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a0d33',
    letterSpacing: 0.3,
  },
  cooldownWrap: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  cooldownText: {
    fontSize: 13,
    color: GOLD_SOFT,
  },
  deckChoiceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 18,
  },
  deckChoiceCard: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    backgroundColor: 'rgba(30, 30, 32, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  deckChoiceCardActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
  },
  deckChoiceCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  deckChoiceLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 4,
  },
  deckChoiceDesc: {
    fontSize: 9.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  deckPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 20,
  },
  progressSlot: {
    alignItems: 'center',
    gap: 6,
  },
  progressSlotFilled: {
    position: 'relative',
  },
  progressCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: NIGHT_DEEP,
    borderRadius: 10,
  },
  progressSlotEmpty: {
    width: 50,
    height: 50 / 0.6,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    borderStyle: 'dashed',
  },
  progressSlotEmptyActive: {
    borderColor: GOLD,
  },
  drawGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  drawGridItem: {
    position: 'relative',
    padding: 2,
  },
  drawGridItemPicked: {
    opacity: 0.35,
  },
  drawGridBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawGridBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1a0d33',
  },
  elementRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  elementCardWrap: {
    alignItems: 'center',
  },
  elementCardFace: {
    width: 44,
    height: 44 / 0.6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  elementRevealWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  elementRevealBig: {
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.45)',
    backgroundColor: 'rgba(38, 22, 70, 0.94)',
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginBottom: 8,
  },
  elementRevealLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  resultContainer: {
    width: '100%',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  cardFace: {
    alignItems: 'center',
    gap: 6,
    width: 102,
  },
  cardPositionHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  cardFaceName: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: GOLD,
    letterSpacing: 0.5,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  blockedBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    borderColor: GOLD_SOFT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  blockedText: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  retryButtonText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },
  resultList: {
    gap: 16,
  },
  resultBlock: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 32, 0.88)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.32)',
    padding: 16,
  },
  overallBlock: {
    backgroundColor: 'rgba(38, 22, 70, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.45)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  overallLabel: {
    fontSize: 12.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 1,
  },
  resultBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.8,
  },
  interpretationText: {
    fontSize: 15.5,
    lineHeight: 25.5,
    color: TEXT_PRIMARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  newReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    flex: 1.5,
    flexBasis: 0,
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
  },
  newReadingButtonPressed: {
    opacity: 0.8,
  },
  newReadingButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
});
