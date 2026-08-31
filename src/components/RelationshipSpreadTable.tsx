import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CornerTicks from '@/components/CornerTicks';
import ShareButton from '@/components/ShareButton';
import {
  analyzeRelationshipSpread,
  getCardElement,
} from '@/utils/relationshipCompatibilityEngine';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

interface CardItem {
  id: string;
  name: string;
  image?: any;
  orientation?: 'upright' | 'reversed';
  keywords?: string[];
  story?: string;
}

interface Props {
  p1Name: string;
  p2Name: string;
  p1Cards: CardItem[];
  p2Cards: CardItem[];
  bridgeCard?: CardItem;
  accentColor?: string;
  onNewReading: () => void;
  onRequestDetailedAI: () => void;
}

export default function RelationshipSpreadTable({
  p1Name,
  p2Name,
  p1Cards,
  p2Cards,
  bridgeCard,
  accentColor = GOLD,
  onNewReading,
  onRequestDetailedAI,
}: Props) {
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const cleanP1 = p1Name.trim() || '1. Kişi (Sen)';
  const cleanP2 = p2Name.trim() || '2. Kişi (Partner)';

  const analysis = analyzeRelationshipSpread(
    cleanP1,
    cleanP2,
    p1Cards,
    p2Cards,
    bridgeCard
  );

  // Uyum Skoru Animasyonu (0'dan hedefe doğru artan görsel şölen)
  const animatedScore = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    animatedScore.setValue(0);
    const listenerId = animatedScore.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    Animated.timing(animatedScore, {
      toValue: analysis.overallScore,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animatedScore.removeListener(listenerId);
    };
  }, [analysis.overallScore]);

  // Skora göre dinamik parlak başarı rengi
  const scoreColor =
    analysis.overallScore >= 85
      ? '#10B981' // Zümrüt Yeşili (Yüksek Başarı)
      : analysis.overallScore >= 70
      ? '#F59E0B' // Altın Sarısı
      : '#F43F5E'; // Manyetik Gül / Mercan

  const posLabels = [
    '1. Zihin',
    '2. Kalp',
    '3. Gelecek',
    '4. Bilinçaltı',
    '5. Tutku',
    '6. İletişim',
    '7. Ders',
    '8. Dış Etken',
    '9. Umut',
    '10. Birlik',
  ];

  return (
    <View style={styles.container}>
      {/* 1. ÜST GENEL UYUM SKORU KARTI (GÖRSEL ŞÖLEN & ANİMASYONLU SAYAÇ) */}
      <View style={[styles.scoreHeroCard, { borderColor: scoreColor + '88' }]}>
        <CornerTicks />
        <LinearGradient
          colors={[scoreColor + '22', 'rgba(15, 10, 30, 0.9)']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
        />
        <View style={styles.scoreHeroContent}>
          {/* Animasyonlu Dairesel Skor Halkası */}
          <View style={[styles.scoreCircle, { borderColor: scoreColor, backgroundColor: scoreColor + '15' }]}>
            <Text style={[styles.scorePercentText, { color: scoreColor }]}>
              %{displayScore}
            </Text>
            <Text style={styles.scoreLabelText}>Uyum Skoru</Text>
          </View>

          <View style={styles.scoreInfo}>
            <View style={[styles.badgeRow, { backgroundColor: scoreColor + '20', borderColor: scoreColor + '50' }]}>
              <MaterialCommunityIcons name="heart-flash" size={18} color={scoreColor} />
              <Text style={[styles.statusBadgeText, { color: scoreColor }]}>
                {analysis.overallStatus}
              </Text>
            </View>
            <Text style={styles.summaryText}>{analysis.overallSummary}</Text>
          </View>
        </View>
      </View>

      {/* 2. DİKEY KARŞILIKLI MİSTİK MASA (ORTADA KÖPRÜ KARTI BULUNAN DÜZEN) */}
      <View style={styles.tableWrapper}>
        <CornerTicks />
        <Text style={[styles.tableMainTitle, { color: accentColor }]}>
          🎴 KARŞILIKLI İLİŞKİ AYNASI DİZİLİMİ
        </Text>
        <Text style={styles.tableSubtitle}>
          Karşılıklı kartlar aynı hizadaki kadersel boyutlarıyla birbirini yansıtır
        </Text>

        {/* --- ÜST SIRA: 1. KİŞİ (SEN) --- */}
        <View style={styles.personRowSection}>
          <View style={styles.personHeader}>
            <View style={[styles.personDot, { backgroundColor: '#38BDF8' }]} />
            <Text style={[styles.personNameText, { color: '#38BDF8' }]}>
              {cleanP1}
            </Text>
            <Text style={[styles.personRoleBadge, { color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
              1. Kişi (Üst Enerji)
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollRow}>
            {p1Cards.map((card, idx) => {
              const el = getCardElement(card.id);
              return (
                <Pressable
                  key={`p1_${card.id}_${idx}`}
                  onPress={() => setSelectedCard(card)}
                  style={({ pressed }) => [styles.tableCardItem, pressed && styles.cardPressed]}
                >
                  <View style={styles.posPill}>
                    <Text style={styles.posPillText}>{posLabels[idx] || `${idx + 1}. Kart`}</Text>
                  </View>
                  <View style={[styles.cardImageFrame, { borderColor: 'rgba(56, 189, 248, 0.8)' }]}>
                    {card.image ? (
                      <Image source={card.image} style={styles.cardThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderCard}>
                        <MaterialCommunityIcons name="cards-outline" size={24} color="#38BDF8" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardNameLabel} numberOfLines={2}>
                    {card.name}
                  </Text>
                  <View style={styles.elementChip}>
                    <Text style={[styles.elementChipText, { color: '#38BDF8' }]}>{el.elementName}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* --- ORTA REZONANS HATTI & ORTAK KÖPRÜ KARTI (TAM ORTAYA KONULAN DÜZEN) --- */}
        {bridgeCard ? (
          <View style={styles.centerBridgeSection}>
            <View style={styles.bridgeHeaderPill}>
              <Ionicons name="sparkles" size={14} color={GOLD} />
              <Text style={styles.bridgePillTitle}>ORTAK KADERSEL KÖPRÜ KARTI</Text>
              <Ionicons name="sparkles" size={14} color={GOLD} />
            </View>

            <Pressable
              onPress={() => setSelectedCard(bridgeCard)}
              style={({ pressed }) => [styles.centerBridgeCardWrap, pressed && styles.cardPressed]}
            >
              <View style={[styles.bridgeCardImageFrame, { borderColor: GOLD }]}>
                {bridgeCard.image ? (
                  <Image source={bridgeCard.image} style={styles.cardThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderCard}>
                    <MaterialCommunityIcons name="cards" size={28} color={GOLD} />
                  </View>
                )}
              </View>
              <View style={styles.centerBridgeInfo}>
                <Text style={styles.bridgeCardTitleText}>{bridgeCard.name}</Text>
                <Text style={styles.bridgeCardSubText}>
                  {analysis.bridgeAnalysis?.meaning ||
                    'İki tarafın aurasının ve geleceğinin birleştiği ana rezonans kapısı.'}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resonanceBridge}>
            <View style={styles.resonanceLine} />
            <View style={[styles.resonanceCenterBadge, { borderColor: accentColor }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color={accentColor} />
              <Text style={[styles.resonanceText, { color: accentColor }]}>
                Karşılıklı Rezonans & Enerji Aynası
              </Text>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color={accentColor} />
            </View>
            <View style={styles.resonanceLine} />
          </View>
        )}

        {/* --- ALT SIRA: 2. KİŞİ (PARTNER) --- */}
        <View style={styles.personRowSection}>
          <View style={styles.personHeader}>
            <View style={[styles.personDot, { backgroundColor: '#F43F5E' }]} />
            <Text style={[styles.personNameText, { color: '#F43F5E' }]}>
              {cleanP2}
            </Text>
            <Text style={[styles.personRoleBadge, { color: '#F43F5E', borderColor: 'rgba(244, 63, 94, 0.4)' }]}>
              2. Kişi (Alt Enerji)
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollRow}>
            {p2Cards.map((card, idx) => {
              const el = getCardElement(card.id);
              return (
                <Pressable
                  key={`p2_${card.id}_${idx}`}
                  onPress={() => setSelectedCard(card)}
                  style={({ pressed }) => [styles.tableCardItem, pressed && styles.cardPressed]}
                >
                  <View style={styles.posPill}>
                    <Text style={[styles.posPillText, { color: '#F87171' }]}>
                      {posLabels[idx] || `${idx + 1}. Kart`}
                    </Text>
                  </View>
                  <View style={[styles.cardImageFrame, { borderColor: 'rgba(244, 63, 94, 0.8)' }]}>
                    {card.image ? (
                      <Image source={card.image} style={styles.cardThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderCard}>
                        <MaterialCommunityIcons name="cards-outline" size={24} color="#F43F5E" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardNameLabel} numberOfLines={2}>
                    {card.name}
                  </Text>
                  <View style={styles.elementChip}>
                    <Text style={[styles.elementChipText, { color: '#F43F5E' }]}>{el.elementName}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 3. SEVİYE SEVİYE DERİN UYUM KARŞILAŞTIRMASI (TABLO MANTIĞI & KESİNTİSİZ TAM METİNLER) */}
      <Text style={styles.sectionHeading}>⚜️ SEVİYE SEVİYE DERİN UYUM ANALİZİ</Text>

      {analysis.pairs.map((pair, idx) => (
        <View key={idx} style={[styles.pairBlockCard, { borderColor: accentColor + '66' }]}>
          <CornerTicks />

          {/* Seviye Başlığı ve Uyum Skoru */}
          <View style={styles.pairBlockHeader}>
            <View style={styles.pairLevelBadge}>
              <Text style={styles.pairLevelNumber}>#{idx + 1}</Text>
            </View>
            <View style={styles.pairHeaderTextWrap}>
              <Text style={[styles.pairTitle, { color: accentColor }]}>{pair.title}</Text>
              <Text style={styles.pairPosSubtitle}>{pair.posLabel}</Text>
            </View>
            <View
              style={[
                styles.pairScorePill,
                {
                  backgroundColor: pair.score >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 201, 60, 0.15)',
                  borderColor: pair.score >= 85 ? '#10B981' : accentColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.pairScoreText,
                  { color: pair.score >= 85 ? '#10B981' : accentColor },
                ]}
              >
                %{pair.score} Uyum
              </Text>
            </View>
          </View>

          {/* 📊 TABLO KARŞILAŞTIRMA ŞEBEKESİ (COMPARISON TABLE) */}
          <View style={styles.gridTableContainer}>
            {/* Tablo Başlık Satırı */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.tableHeaderColLeft}>
                <MaterialCommunityIcons name="account" size={14} color="#38BDF8" />
                <Text style={styles.tableHeaderColTextLeft}>{cleanP1}</Text>
              </View>
              <View style={styles.tableHeaderColMid}>
                <Text style={styles.tableVsText}>⚡ REZONANS</Text>
              </View>
              <View style={styles.tableHeaderColRight}>
                <MaterialCommunityIcons name="account-heart" size={14} color="#F43F5E" />
                <Text style={styles.tableHeaderColTextRight}>{cleanP2}</Text>
              </View>
            </View>

            {/* Tablo Kart Adı Satırı */}
            <View style={styles.tableDataRow}>
              <View style={styles.tableDataColLeft}>
                <Text style={styles.tableCardNameLeft}>{pair.p1CardName}</Text>
                <View style={[styles.tableElementBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Text style={styles.tableElementTextLeft}>{pair.p1Element} Elementi</Text>
                </View>
              </View>
              <View style={styles.tableDataColMid}>
                <View style={[styles.tableMatchCircle, { borderColor: accentColor }]}>
                  <Text style={[styles.tableMatchPercent, { color: accentColor }]}>%{pair.score}</Text>
                </View>
              </View>
              <View style={styles.tableDataColRight}>
                <Text style={styles.tableCardNameRight}>{pair.p2CardName}</Text>
                <View style={[styles.tableElementBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <Text style={styles.tableElementTextRight}>{pair.p2Element} Elementi</Text>
                </View>
              </View>
            </View>

            {/* Tablo Arketip ve Enerji Satırı */}
            <View style={styles.tableArchetypeRow}>
              <View style={styles.tableArchetypeColLeft}>
                <Text style={styles.tableArchetypeLabel}>Enerji & Niyet:</Text>
                <Text style={styles.tableArchetypeText}>{pair.p1Archetype}</Text>
              </View>
              <View style={styles.tableArchetypeColDivider} />
              <View style={styles.tableArchetypeColRight}>
                <Text style={styles.tableArchetypeLabel}>Enerji & Niyet:</Text>
                <Text style={styles.tableArchetypeText}>{pair.p2Archetype}</Text>
              </View>
            </View>
          </View>

          {/* Element Sinerjisi & Uyum Barı */}
          <View style={styles.elementSynergyBanner}>
            <View style={styles.synergyTitleRow}>
              <Ionicons name="git-compare" size={15} color={GOLD} />
              <Text style={styles.synergyBannerTitle}>
                {pair.synergyBadge || pair.elementSynergy}
              </Text>
            </View>
            <View style={styles.synergyTrack}>
              <LinearGradient
                colors={['#D97706', '#F59E0B', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.synergyFill, { width: `${Math.min(100, Math.max(10, pair.score))}%` }]}
              />
            </View>
          </View>

          {/* Derin Sentez Metni (Kesintisiz, Büyük & Okunaklı) */}
          <View style={styles.synthesisBox}>
            <Text style={styles.synthesisHeading}>🔮 Kadersel Sentez & Dinamik</Text>
            <Text style={styles.pairSynthesisText}>{pair.synthesis}</Text>
          </View>

          {/* İlişki Tavsiyesi & Rehberlik (Kesintisiz) */}
          <View style={styles.pairAdviceBox}>
            <View style={styles.adviceHeaderRow}>
              <Ionicons name="bulb" size={16} color={GOLD} />
              <Text style={styles.adviceHeadingText}>İlişki Tavsiyesi & Rehberlik</Text>
            </View>
            <Text style={styles.pairAdviceText}>{pair.advice}</Text>
          </View>
        </View>
      ))}

      {/* 4. DAHA DETAYLI YAPAY ZEKA ANALİZİ BUTONU */}
      <Pressable
        onPress={onRequestDetailedAI}
        style={({ pressed }) => [styles.aiUpgradeButton, pressed && styles.btnPressed]}
      >
        <LinearGradient
          colors={['#C9A86A', '#9B6A1A', '#5A3807']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiUpgradeGradient}
        >
          <View style={styles.aiUpgradeIconCircle}>
            <MaterialCommunityIcons name="star-shooting" size={22} color={NIGHT_CARD} />
          </View>
          <View style={styles.aiUpgradeTextWrap}>
            <Text style={styles.aiUpgradeTitle}>Daha Detaylı Analiz Al</Text>
            <Text style={styles.aiUpgradeSubtitle}>
              Seçtiğiniz kartların size özel derin, kapsamlı analizi ve genel yorumu.
            </Text>
          </View>
          <View style={styles.aiCoinTag}>
            <Text style={styles.aiCoinTagText}>50 Coin</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* 5. ALT AKSİYONLAR */}
      <View style={styles.bottomActionsRow}>
        <ShareButton
          text={`Mistik Rehber - ${cleanP1} & ${cleanP2} Karşılıklı Uyum Açılımı\n\nUyum Skoru: %${analysis.overallScore}\nDurum: ${analysis.overallStatus}\n\n${analysis.overallSummary}`}
        />
        <Pressable
          onPress={onNewReading}
          style={({ pressed }) => [styles.newReadingBtn, pressed && styles.btnPressed]}
        >
          <MaterialCommunityIcons name="cards" size={18} color={accentColor} />
          <Text style={[styles.newReadingBtnText, { color: accentColor }]}>Yeni Açılım Yap</Text>
        </Pressable>
      </View>

      {/* KART HİKAYESİ VE ANLAMI MODALI */}
      <Modal
        visible={!!selectedCard}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <CornerTicks />
            <Pressable onPress={() => setSelectedCard(null)} style={styles.modalCloseBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>

            {selectedCard && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  {selectedCard.image && (
                    <Image source={selectedCard.image} style={styles.modalThumb} resizeMode="contain" />
                  )}
                  <Text style={[styles.modalTitle, { color: accentColor }]}>{selectedCard.name}</Text>
                  <Text style={styles.modalElement}>
                    {getCardElement(selectedCard.id).elementName} Elementi • {getCardElement(selectedCard.id).loveArchetype}
                  </Text>
                </View>

                <View style={styles.modalKeywordsRow}>
                  {getCardElement(selectedCard.id).keywords.map((kw, i) => (
                    <View key={i} style={[styles.keywordChip, { borderColor: accentColor + '66' }]}>
                      <Text style={[styles.keywordChipText, { color: accentColor }]}>{kw}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalDivider} />
                <Text style={styles.modalSectionLabel}>KARTIN İLİŞKİ VE KADER MESAJI</Text>
                <Text style={styles.modalBodyText}>
                  {selectedCard.story ||
                    'Bu kart, karşılıklı çekim alanında derin bir ruhsal yansımayı temsil eder. Partnerinizle aranızdaki dinamikte önemli bir dönüm noktasına ve içsel farkındalığa işaret etmektedir.'}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    gap: 16,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // 1. Hero Score Card
  scoreHeroCard: {
    backgroundColor: 'rgba(20, 14, 38, 0.92)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  scoreHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  scorePercentText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreLabelText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '800',
    marginTop: -2,
    textTransform: 'uppercase',
  },
  scoreInfo: {
    flex: 1,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  summaryText: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 19,
  },

  // 2. Spread Table (Masa)
  tableWrapper: {
    backgroundColor: 'rgba(14, 10, 30, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.4)',
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  tableMainTitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tableSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 4,
  },
  personRowSection: {
    gap: 8,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personNameText: {
    fontSize: 14,
    fontWeight: '900',
  },
  personRoleBadge: {
    fontSize: 10.5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
    fontWeight: '700',
  },
  cardsScrollRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  tableCardItem: {
    width: 90,
    alignItems: 'center',
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  posPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  posPillText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '800',
  },
  cardImageFrame: {
    width: 84,
    height: 128,
    borderRadius: 10,
    borderWidth: 1.8,
    overflow: 'hidden',
    backgroundColor: '#0A0817',
  },
  cardThumb: {
    width: '100%',
    height: '100%',
  },
  placeholderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNameLabel: {
    fontSize: 11,
    color: TEXT_PRIMARY,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  elementChip: {
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  elementChipText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Ortak Köprü Bölümü
  centerBridgeSection: {
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  bridgeHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.4)',
  },
  bridgePillTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.6,
  },
  centerBridgeCardWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingHorizontal: 4,
  },
  bridgeCardImageFrame: {
    width: 74,
    height: 112,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
  },
  centerBridgeInfo: {
    flex: 1,
    gap: 3,
  },
  bridgeCardTitleText: {
    fontSize: 14,
    fontWeight: '900',
    color: GOLD,
  },
  bridgeCardSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },

  resonanceBridge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 6,
  },
  resonanceLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 201, 60, 0.3)',
  },
  resonanceCenterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 14, 38, 0.95)',
    borderWidth: 1,
  },
  resonanceText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // 3. Tablo Mantığında Seviye Karşılaştırması
  sectionHeading: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  pairBlockCard: {
    backgroundColor: 'rgba(16, 12, 34, 0.95)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  pairBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pairLevelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 201, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.4)',
  },
  pairLevelNumber: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '900',
  },
  pairHeaderTextWrap: {
    flex: 1,
  },
  pairTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  pairPosSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  pairScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  pairScoreText: {
    fontSize: 13,
    fontWeight: '900',
  },

  // 📊 TABLO ŞEBEKESİ (COMPARISON TABLE)
  gridTableContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginVertical: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableHeaderColLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderColTextLeft: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  tableHeaderColMid: {
    paddingHorizontal: 6,
  },
  tableVsText: {
    fontSize: 10,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
  },
  tableHeaderColRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  tableHeaderColTextRight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F43F5E',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableDataColLeft: {
    flex: 1,
    gap: 4,
  },
  tableCardNameLeft: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tableElementBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tableElementTextLeft: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  tableDataColMid: {
    paddingHorizontal: 6,
  },
  tableMatchCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    backgroundColor: 'rgba(20, 12, 35, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableMatchPercent: {
    fontSize: 12,
    fontWeight: '900',
  },
  tableDataColRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  tableCardNameRight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  tableElementTextRight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F5E',
  },
  tableArchetypeRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 8,
  },
  tableArchetypeColLeft: {
    flex: 1,
    gap: 2,
  },
  tableArchetypeColDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableArchetypeColRight: {
    flex: 1,
    gap: 2,
  },
  tableArchetypeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tableArchetypeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },

  elementSynergyBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 10,
    marginVertical: 8,
  },
  synergyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  synergyBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
    flex: 1,
  },
  synergyTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  synergyFill: {
    height: '100%',
    borderRadius: 3,
  },
  synthesisBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  synthesisHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
    marginBottom: 6,
  },
  pairSynthesisText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  pairAdviceBox: {
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceHeadingText: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
  },
  pairAdviceText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 19,
  },

  // 4. Detaylı AI Yorumu Butonu
  aiUpgradeButton: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    marginTop: 4,
  },
  aiUpgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  aiUpgradeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiUpgradeTextWrap: {
    flex: 1,
  },
  aiUpgradeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  aiUpgradeSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    lineHeight: 15,
  },
  aiCoinTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aiCoinTagText: {
    fontSize: 12,
    fontWeight: '900',
    color: GOLD,
  },

  // 5. Alt Aksiyonlar
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 40,
  },
  newReadingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 16, 42, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  newReadingBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: '#120D24',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalThumb: {
    width: 90,
    height: 140,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalElement: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  modalKeywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 10,
  },
  keywordChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  keywordChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalBodyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 20,
  },
});
