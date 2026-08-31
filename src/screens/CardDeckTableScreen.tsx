import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TarotLayoutId } from '@/navigation/types';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import DeckPurchaseModal from '@/components/DeckPurchaseModal';
import { POPULAR_CARD_DECKS, type CardDeckInfo, type DeckCardItem } from '@/constants/cardDecksData';
import { getDeckTier, purchaseDeckWithCoins, type DeckTier } from '@/services/deckOwnership';
import { getCoins, spendCoins, subscribeCoins } from '@/services/coins';
import { TAROT_CARD_IMAGES } from '@/assets/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import { getTarotKeywordList } from '@/services/tarotKeywords';
import { getModernTarotMeaning } from '@/services/tarotInterpretations';
import cardDecksLexicon from '@/data/card_decks_lexicon.json';
import angelCardsData from '@/data/angel_cards.json';
import runesData from '@/data/runes_futhark.json';
import iskambilData from '@/data/iskambil_card_details.json';
import katinaData from '@/data/katina_meanings.json';
import katinaCardDetails from '@/data/katina_card_details.json';
import katinaElementCards from '@/data/katina_element_cards.json';
import { getLenormandMeaning } from '@/services/lenormandMeanings';
import { LENORMAND_SPREADS } from '@/services/lenormandSpreads';
import { LENORMAND_IMAGES } from '@/assets/cards/lenormand';
import { getAllRunes, isSymmetricRune, RUNE_SPREAD_TYPES, RUNE_SPREAD_POSITIONS, RUNE_SPREAD_INFO, spreadTypeForCount } from '@/services/runeEngine';
import { RUNE_DETAILED_INSIGHTS } from '@/services/runeMeaningsDetails';
import RuneStoneItem from '@/components/runes/RuneStoneItem';
import RuneCastingClothExperience from '@/components/runes/RuneCastingClothExperience';
import RelationshipSpreadTable from '@/components/RelationshipSpreadTable';
import { analyzeRelationshipSpread, getCardElement } from '@/utils/relationshipCompatibilityEngine';
import CornerTicks from '@/components/CornerTicks';
import { showAlert } from '@/services/themedAlert';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'CardDeckTable'>;

type ReadingMode = 'self' | 'relationship';

type SpreadOption = {
  id: string;
  name: string;
  cardCount: number;
  desc: string;
  positions: string[];
};

const SPREAD_OPTIONS: SpreadOption[] = [
  {
    id: 'single',
    name: 'Günün Mesajı & Anlık Cevap',
    cardCount: 1,
    desc: 'Tek bir kartla günün enerjisi, rehberliği veya aklındaki soruya net bir cevap.',
    positions: ['Günün Ana Enerjisi / Rehberlik'],
  },
  {
    id: 'three',
    name: 'Geçmiş · Şimdi · Gelecek',
    cardCount: 3,
    desc: 'Zaman çizgisinde olayların kökeni, mevcut durum ve varacağı sonuç.',
    positions: ['1. Geçmişin Etkisi', '2. Şimdiki Durum & Enerji', '3. Yakın Gelecek & Sonuç'],
  },
  {
    id: 'five',
    name: 'Aşk & Çapraz Karar Açılımı',
    cardCount: 5,
    desc: 'İlişki dinamiği, aklındaki kişinin hisleri, engel ve nihai kader çizgisi.',
    positions: [
      '1. Senin / Danışanın Durumu (Merkez)',
      '2. Karşı Tarafın Hissi (Üst)',
      '3. Aradaki Bağ & Geçmiş (Sol)',
      '4. Gizli Engel / Korku (Sağ)',
      '5. Nihai Kadersel Sonuç (Alt)',
    ],
  },
  {
    id: 'seven',
    name: '7 Kart (At Nalı / Horseshoe Açılımı)',
    cardCount: 7,
    desc: 'Kadim U-şekli At Nalı açılımı; geçmiş, şimdi, gizli etkiler, engeller, çevre, tavsiye ve nihai sonuç.',
    positions: [
      '1. Geçmişin Kökleri',
      '2. Şimdiki Durum & Enerji',
      '3. Gizli Etkiler & Beklenmedik Olaylar',
      '4. Engeller & Odak Noktası',
      '5. Dış Çevre & İnsanlar',
      '6. Tavsiye & Yol Haritası',
      '7. Nihai Sonuç & Olası Gelecek',
    ],
  },
  {
    id: 'ten',
    name: 'Kelt Haçı Açılımı (Büyük Kehanet)',
    cardCount: 10,
    desc: 'Dünyanın en kadim ve en kapsamlı 10 kartlık Kelt Haçı kehanet dizilimi.',
    positions: [
      '1. Mevcut Durum (Merkez)',
      '2. Karşıt Güç / Engel (Çapraz)',
      '3. Bilinçaltı & Kök Temel (Alt)',
      '4. Yakın Geçmişin İzi (Sol)',
      '5. Taç / Olası En Yüksek Gelecek (Üst)',
      '6. Yaklaşan Yakın Gelecek (Sağ)',
      '7. Danışanın Kendi Enerjisi & Tutumu',
      '8. Dış Çevre, İnsanlar & Etkenler',
      '9. Gizli Umutlar ve Korkular',
      '10. Kadersel Nihai Sonuç (Kader Kapısı)',
    ],
  },
];

// Çift / 2 Kişilik Karşılıklı Uyum Açılımları
const RELATIONSHIP_SPREAD_OPTIONS: SpreadOption[] = [
  {
    id: 'rel_mirror_6',
    name: 'Karşılıklı İlişki Aynası',
    cardCount: 6,
    desc: '3+3 Temel Boyut: 1. Zihin & Niyet, 2. Kalp & Hisler, 3. Beklenti & Gelecek.',
    positions: ['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek'],
  },
  {
    id: 'rel_bridge_7',
    name: 'Kadersel Enerji Köprüsü',
    cardCount: 7,
    desc: '3+3 Karşılıklı Ayna + Ortak Kadersel Kesişim ve Çiftin Enerji Köprüsü Kartı.',
    positions: ['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek', 'Ortak Kadersel Köprü'],
  },
  {
    id: 'rel_mirror_10',
    name: 'Ruh Eşi & 5 Boyutlu Aşk Aynası',
    cardCount: 10,
    desc: '5+5 Derin Boyut: Zihin, Kalp, Bilinçaltı, Tutku & Kimya, Kadersel Gelecek.',
    positions: [
      '1. Zihin & Bakış Açısı',
      '2. Kalp & Duygusal Bağ',
      '3. Bilinçaltı & Gizli Korkular',
      '4. Tutku, Çekim & Kimya',
      '5. Kadersel Gelecek & Birlik',
    ],
  },
  {
    id: 'rel_cosmic_20',
    name: 'Kozmik Çift & İkiz Alev Kehaneti',
    cardCount: 20,
    desc: '10+10 Kademeli Sentez: 10 ayrı kadersel seviyede çiftin tam enerji haritası.',
    positions: [
      '1. Mevcut Durum & Ruh Hali',
      '2. Karşı Tarafın Hisleri & Tavrı',
      '3. Bilinçaltı & Kök Temel',
      '4. Geçmişin Kalıcı İzi',
      '5. Zihinsel Beklenti & Niyet',
      '6. Yaklaşan Adım & Eylem',
      '7. İçsel Korku & Çekinceler',
      '8. Dış Etkenler & Çevre',
      '9. Gizli Umutlar & Arzular',
      '10. Kadersel Nihai Bütünleşme',
    ],
  },
];

// Lenormand — Tarot'un Kelt Haçı gibi açılımlarını kopyalamak yerine, kendi
// otantik tekniklerinden (kombinasyon/cümle okuma, haftalık açılım, 3x3 kutu)
// türetilmiş kendine has açılım seçenekleri. LENORMAND_SPREADS ile birebir
// aynı pozisyon/teknik kaynağından besleniyor (bkz. services/lenormandSpreads.ts).
const LENORMAND_SPREAD_OPTIONS: SpreadOption[] = LENORMAND_SPREADS.map((spread) => ({
  id: `lenormand_${spread.id}`,
  name: spread.name,
  cardCount: spread.positions.length,
  desc: spread.description,
  positions: spread.positions,
}));

// Rün — Anasayfa'daki Rün Falı (RuneScreen.tsx) ile BİREBİR aynı katalog
// (services/runeEngine.ts) — Tarot'un Kelt Haçı'nı kopyalamaz, kendi otantik
// açılımlarını (Norn Üçlüsü, Norse Haçı) kullanır.
const RUNE_SPREAD_OPTIONS: SpreadOption[] = RUNE_SPREAD_TYPES.map((type) => ({
  id: `rune_${type}`,
  name: RUNE_SPREAD_INFO[type].label,
  cardCount: RUNE_SPREAD_POSITIONS[type].length,
  desc: RUNE_SPREAD_INFO[type].desc,
  positions: RUNE_SPREAD_POSITIONS[type],
}));

// 4 Kart Dizilim Seçeneği
const LAYOUT_OPTIONS: Array<{
  id: TarotLayoutId;
  title: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  {
    id: 'grid',
    title: 'Klasik Masa',
    desc: 'Standart ızgara masası',
    icon: 'view-grid-outline',
  },
  {
    id: 'fullgrid',
    title: 'Büyük Masa Izgarası',
    desc: 'Geniş ve ferah masa düzeni',
    icon: 'grid-large',
  },
  {
    id: 'fan',
    title: 'Dalga Şekli Dizilim',
    desc: 'Akıcı ve kıvrımlı dalga dizilimi',
    icon: 'view-carousel-outline',
  },
  {
    id: 'radial',
    title: 'Daire / Çember',
    desc: 'Mistik çember dizilimi',
    icon: 'circle-slice-8',
  },
];

// 36 Petit Lenormand Kart Listesi
const LENORMAND_FULL_CARDS = [
  { id: 'suvari', name: '1. Süvari', symbol: '🐎', desc: 'Hızlı gelen haberler, ziyaretçi ve hareketlilik' },
  { id: 'yonca', name: '2. Yonca', symbol: '🍀', desc: 'Küçük şanslar, anlık fırsatlar ve neşe' },
  { id: 'gemi', name: '3. Gemi', symbol: '⛵', desc: 'Yolculuklar, ticaret ve yeni ufuklar' },
  { id: 'ev', name: '4. Ev', symbol: '🏠', desc: 'Aile huzuru, güvenli sığınak ve sağlam temeller' },
  { id: 'agac', name: '5. Ağaç', symbol: '🌳', desc: 'Sağlık, köklenme, sabır ve uzun ömür' },
  { id: 'bulutlar', name: '6. Bulutlar', symbol: '☁️', desc: 'Geçici belirsizlik, kafa karışıklığı ve şüphe' },
  { id: 'yilan', name: '7. Yılan', symbol: '🐍', desc: 'Sinsi rakipler, kıskançlık veya zeka ile manevra' },
  { id: 'tabut', name: '8. Tabut', symbol: '⚰️', desc: 'Bir dönemin kapanışı, dönüşüm ve arınma' },
  { id: 'buket', name: '9. Buket', symbol: '💐', desc: 'İltifatlar, takdir, sevinç ve hediye' },
  { id: 'tirpan', name: '10. Tırpan', symbol: '🌾', desc: 'Ani karar, ani bitiş ve hasat zamanı' },
  { id: 'kirbac', name: '11. Kırbaç', symbol: '⚔️', desc: 'Fikir çatışması, hararetli tartışma ve arınma' },
  { id: 'kuslar', name: '12. Kuşlar', symbol: '🕊️', desc: 'Dedikodular, telefon konuşmaları ve sohbetler' },
  { id: 'cocuk', name: '13. Çocuk', symbol: '👶', desc: 'Taze başlangıçlar, masumiyet ve yeni heves' },
  { id: 'tilki', name: '14. Tilki', symbol: '🦊', desc: 'Kurnazlık, dikkatli olma ve stratejik zeka' },
  { id: 'ayi', name: '15. Ayı', symbol: '🐻', desc: 'Güçlü bir koruyucu, otorite ve maddi güç' },
  { id: 'yildizlar', name: '16. Yıldızlar', symbol: '✨', desc: 'İlham, umut, netlik ve dileklerin kabulü' },
  { id: 'leylek', name: '17. Leylek', symbol: '🪶', desc: 'Yer değişimi, taşınma ve olumlu değişimler' },
  { id: 'kopek', name: '18. Köpek', symbol: '🐕', desc: 'Sadık dost, güvenilir ortak ve bağlılık' },
  { id: 'kule', name: '19. Kule', symbol: '🏰', desc: 'Resmi kurumlar, yalnızlık, kariyerde yükseliş' },
  { id: 'bahce', name: '20. Bahçe', symbol: '🌷', desc: 'Sosyal çevre, davetler, kutlama ve toplum' },
  { id: 'dag', name: '21. Dağ', symbol: '⛰️', desc: 'Büyük engeller, gecikmeler ve sabır sınavı' },
  { id: 'yol_ayrimi', name: '22. Yol Ayrımı', symbol: '🛤️', desc: 'Kritik bir karar anı, seçenekler ve yön tayini' },
  { id: 'fareler', name: '23. Fareler', symbol: '🐀', desc: 'Küçük kayıplar, enerji sızıntısı ve stres' },
  { id: 'kalp', name: '24. Kalp', symbol: '❤️', desc: 'Büyük aşk, tutku, şefkat ve duygusal doyum' },
  { id: 'yuzuk', name: '25. Yüzük', symbol: '💍', desc: 'Evlilik, sözleşme, bağlılık ve kalıcı anlaşma' },
  { id: 'kitap', name: '26. Kitap', symbol: '📖', desc: 'Gizli sırlar, eğitim, bilgi ve açığa çıkacak sırlar' },
  { id: 'mektup', name: '27. Mektup', symbol: '✉️', desc: 'Yazılı belge, mesaj, evrak veya resmî yazı' },
  { id: 'beyefendi', name: '28. Beyefendi', symbol: '🎩', desc: 'Önemli bir erkek figürü, partner veya danışan' },
  { id: 'hanimefendi', name: '29. Hanımefendi', symbol: '👑', desc: 'Önemli bir kadın figürü, partner veya danışan' },
  { id: 'zambak', name: '30. Zambak', symbol: '⚜️', desc: 'Huzur, olgunluk, bilgelik ve saflık' },
  { id: 'gunes', name: '31. Güneş', symbol: '☀️', desc: 'Büyük başarı, zafer, aydınlanma ve enerji' },
  { id: 'ay', name: '32. Ay', symbol: '🌙', desc: 'Sezgiler, şöhret, duygular ve rüyalar' },
  { id: 'anahtar', name: '33. Anahtar', symbol: '🗝️', desc: 'Kesin çözüm, kilitlerin açılması ve başarı' },
  { id: 'baliklar', name: '34. Balıklar', symbol: '🐟', desc: 'Maddi bolluk, kazanç akışı ve bereket' },
  { id: 'capa', name: '35. Çapa', symbol: '⚓', desc: 'İstikrar, güvenli liman ve kalıcılık' },
  { id: 'hac', name: '36. Haç', symbol: '✝️', desc: 'Kadersel sınav, maneviyat ve fedakarlık' },
];

// Osho Zen Bilgelik Kartları
const OSHO_ZEN_FULL_CARDS = [
  { id: 'zen_bosluk', name: 'Sessizlik & Boşluk', symbol: '☯', desc: 'Zihnin durulması ve iç huzur' },
  { id: 'zen_donusum', name: 'Büyük Dönüşüm', symbol: '🦋', desc: 'Eski kalıpların ölümü ve aydınlanma' },
  { id: 'zen_kutlama', name: 'Kutlama & Dans', symbol: '🌸', desc: 'Hayatı bir şölen gibi yaşama coşkusu' },
  { id: 'zen_akis', name: 'Akışta Olmak', symbol: '🌊', desc: 'Direnmeyi bırakıp evrenle uyumlanma' },
  { id: 'zen_masumiyet', name: 'Masumiyet & Saflık', symbol: '🕊️', desc: 'Önyargısız, çocuksu merakla bakış' },
  { id: 'zen_isyan', name: 'Kutsal İsyan', symbol: '🔥', desc: 'Kendi doğrunu bulma ve tabuları yıkma' },
  { id: 'zen_ayrilik', name: 'Yalnızlık & Bütünlük', symbol: '🏔️', desc: 'Kendi başına tam ve yeterli olma' },
  { id: 'zen_ic_ses', name: 'İç Sesin Rehberliği', symbol: '🔔', desc: 'Kalbin derin fısıltılarına güven' },
  { id: 'zen_sabir', name: 'Olgunlaşma & Sabır', symbol: '🌱', desc: 'Tohumun doğru zamanda filizlenmesi' },
  { id: 'zen_cesaret', name: 'Cesaretin Çiçeği', symbol: '🌺', desc: 'Kayalardan fışkıran yaşam gücü' },
  { id: 'zen_farkindalik', name: 'Anın Farkındalığı', symbol: '👁️', desc: 'Geçmişi ve geleceği bırakıp şimdiye dön' },
  { id: 'zen_tamamlanma', name: 'Büyük Bütünlük', symbol: '🌌', desc: 'Evrenle tek bir nefes olma hali' },
];

// Hermetik Mısır & Thoth Kartları
const THOTH_FULL_CARDS = [
  { id: 'thoth_anubis', name: 'Anubis (Terazi)', symbol: '⚖️', desc: 'Hakikat, adalet ve kalp sınavı' },
  { id: 'thoth_isis', name: 'İsis (Büyü)', symbol: '𓋹', desc: 'Şefkat, birleştirici güç ve gizli simya' },
  { id: 'thoth_horus', name: 'Horus (Göz)', symbol: '𓂀', desc: 'Basiret, mutlak koruma ve aydınlık' },
  { id: 'thoth_ra', name: 'Ra (Güneş Diski)', symbol: '☀️', desc: 'Yaratım ateşi ve ilahi irade' },
  { id: 'thoth_osiris', name: 'Osiris (Yeniden Doğuş)', symbol: '🌾', desc: 'Döngülerin efendisi ve ebediyet' },
  { id: 'thoth_bastet', name: 'Bastet (Sezgi & Koruma)', symbol: '🐱', desc: 'Gizemli cazibe ve evin bereketi' },
  { id: 'thoth_thoth', name: 'Thoth (İlahi Yazman)', symbol: '📜', desc: 'Kadim bilim, geometri ve bilgelik' },
  { id: 'thoth_hathor', name: 'Hathor (Aşk & Müzik)', symbol: '🪕', desc: 'Güzellik, dans ve neşe' },
  { id: 'thoth_maat', name: 'Maat (Kozmik Düzen)', symbol: '🪶', desc: 'Evrenin kusursuz dengesi ve doğruluk' },
  { id: 'thoth_khepri', name: 'Khepri (Güneş Böceği)', symbol: '🪲', desc: 'Karanlıktan doğan yeni şafak' },
  { id: 'thoth_sekhmet', name: 'Sekhmet (Şifa Ateşi)', symbol: '🦁', desc: 'Düşmanları yakan adalet ve arınma' },
  { id: 'thoth_ptah', name: 'Ptah (Mimar)', symbol: '🏛️', desc: 'Sözü maddeye dönüştürme kudreti' },
];

type DrawnCard = {
  id: string;
  name: string;
  image?: any;
  suitSymbol?: string;
  rankLabel?: string;
  themeColor?: string;
  isReversed: boolean;
  positionName: string;
  isRevealed: boolean;
  flipAnim: Animated.Value;
  dealAnim: Animated.Value;
  rawItem?: any;
};

export default function CardDeckTableScreen({ route, navigation }: Props) {
  const { deckId, initialMode } = route.params;
  const deck: CardDeckInfo = useMemo(() => {
    return POPULAR_CARD_DECKS.find((d) => d.id === deckId) || POPULAR_CARD_DECKS[0];
  }, [deckId]);

  const [tier, setTier] = useState<DeckTier>('none');
  const [coins, setCoins] = useState(100);
  const [showSplash, setShowSplash] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>(initialMode || 'self');
  const [friendName, setFriendName] = useState('');
  const [friendTopic, setFriendTopic] = useState('');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [relFocus, setRelFocus] = useState('');
  const [relTurn, setRelTurn] = useState<'p1' | 'transition' | 'p2' | 'bridge' | 'completed'>('p1');
  const [showScoreSplashModal, setShowScoreSplashModal] = useState(false);
  const splashScoreAnim = useRef(new Animated.Value(0)).current;
  const [splashScoreDisplay, setSplashScoreDisplay] = useState(0);
  const [splashScoreTarget, setSplashScoreTarget] = useState(85);
  const [p1DrawnCards, setP1DrawnCards] = useState<DrawnCard[]>([]);
  const [p2DrawnCards, setP2DrawnCards] = useState<DrawnCard[]>([]);
  const [bridgeDrawnCard, setBridgeDrawnCard] = useState<DrawnCard | null>(null);
  // Lenormand kendi otantik açılım kataloğunu kullanır (Tarot'un Kelt Haçı vb.
  // isimlerini/pozisyonlarını taşımaz) — bkz. LENORMAND_SPREAD_OPTIONS.
  const [selectedSpread, setSelectedSpread] = useState<SpreadOption>(() =>
    initialMode === 'relationship'
      ? RELATIONSHIP_SPREAD_OPTIONS[0]
      : deck.id === 'lenormand'
      ? LENORMAND_SPREAD_OPTIONS[1]
      : deck.id === 'rune'
      ? RUNE_SPREAD_OPTIONS[1]
      : SPREAD_OPTIONS[1],
  );
  const [selectedLayout, setSelectedLayout] = useState<TarotLayoutId>('fullgrid');
  const [phase, setPhase] = useState<'setup' | 'shuffling' | 'picking' | 'table'>('setup');
  const [showRitualSpread, setShowRitualSpread] = useState(false);
  const [isFloatingExpanded, setIsFloatingExpanded] = useState(true);
  const [placedCount, setPlacedCount] = useState(0);
  const [p1PlacedCount, setP1PlacedCount] = useState(0);
  const [p2PlacedCount, setP2PlacedCount] = useState(0);
  const [isBridgePlaced, setIsBridgePlaced] = useState(false);
  const [activeDockTab, setActiveDockTab] = useState<'p1' | 'p2' | 'bridge'>('p1');
  const bottomDockRef = useRef<ScrollView>(null);
  const p1DockScrollRef = useRef<ScrollView>(null);
  const p2DockScrollRef = useRef<ScrollView>(null);
  const [deckPool, setDeckPool] = useState<DeckCardItem[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [inspectedCard, setInspectedCard] = useState<DrawnCard | null>(null);
  const [showStoryDetail, setShowStoryDetail] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [confirmAnalysisModalVisible, setConfirmAnalysisModalVisible] = useState(false);
  const [insufficientCoinModalVisible, setInsufficientCoinModalVisible] = useState(false);
  const [flippedLevels, setFlippedLevels] = useState<Record<number, boolean>>({});
  const [isPartnersSwapped, setIsPartnersSwapped] = useState(false);

  const p1Color = isPartnersSwapped ? '#F43F5E' : '#38BDF8';
  const p2Color = isPartnersSwapped ? '#38BDF8' : '#F43F5E';
  const p1RoleLabel = isPartnersSwapped ? '1. Kişi (Kadın)' : '1. Kişi (Erkek)';
  const p2RoleLabel = isPartnersSwapped ? '2. Kişi (Erkek)' : '2. Kişi (Kadın)';
  const p1Placeholder = isPartnersSwapped ? 'İsim (Örn: Ayşe)' : 'İsim (Örn: Hakan)';
  const p2Placeholder = isPartnersSwapped ? 'İsim (Örn: Hakan)' : 'İsim (Örn: Ayşe)';
  const p1GenderIcon = isPartnersSwapped ? 'gender-female' : 'gender-male';
  const p2GenderIcon = isPartnersSwapped ? 'gender-male' : 'gender-female';

  const handleSwapPartners = useCallback(() => {
    setIsPartnersSwapped((prev) => !prev);
    setP1Name((prevP1) => {
      setP2Name(prevP1);
      return p2Name;
    });
  }, [p2Name]);

  const toggleLevelFlip = useCallback((idx: number) => {
    setFlippedLevels((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  // Sayfa her odaklandığında bakiye ve kilit durumunu canlı senkronize et
  useFocusEffect(
    useCallback(() => {
      getCoins().then(setCoins);
      getDeckTier(deck.id).then(setTier);
    }, [deck.id])
  );

  // Canlı coin store aboneliği (CoinShop'tan satın alım yapıldığında anında güncellenir)
  useEffect(() => {
    const unsub = subscribeCoins((newCoins) => setCoins(newCoins));
    return () => unsub();
  }, []);

  // Masadaki Dizilimi Gör butonunun 2.8 saniye sonra otomatik küçülüp sadece `>` kalması
  useEffect(() => {
    if (phase === 'table') {
      setIsFloatingExpanded(true);
      const timer = setTimeout(() => {
        setIsFloatingExpanded(false);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Animations
  const shuffleRotate = useRef(new Animated.Value(0)).current;
  const shuffleScale = useRef(new Animated.Value(1)).current;

  // Deck kart havuzunu üret
  const generateDeckPool = useCallback((): DeckCardItem[] => {
    if (deck.id === 'tarot') {
      const tarotKeys = Object.keys(TAROT_CARD_IMAGES);
      const lexiconDeck = (cardDecksLexicon as any).tarot || {};
      return tarotKeys.map((key) => {
        const lex = lexiconDeck[key] || {};
        return {
          id: key,
          name: lex.name || key.replace('-', ' ').toUpperCase(),
          image: TAROT_CARD_IMAGES[key],
          themeColor: deck.accent,
          suitSymbol: '🎴',
          rankLabel: 'Tarot',
        };
      });
    }

    if (deck.id === 'angel') {
      return (angelCardsData as any[]).map((card, idx) => ({
        id: card.id || `angel-${idx}`,
        name: card.name,
        suitSymbol: '🪽',
        rankLabel: `${idx + 1}`,
        themeColor: '#C084FC',
      }));
    }

    if (deck.id === 'rune') {
      const rList = (runesData as any).runes || [];
      return rList.map((rune: any) => ({
        id: rune.id,
        name: `${rune.symbol} ${rune.name}`,
        suitSymbol: rune.symbol,
        rankLabel: 'Rün',
        themeColor: '#38BDF8',
      }));
    }

    if (deck.id === 'iskambil') {
      const entries = Object.entries(iskambilData as any);
      if (entries.length > 0) {
        return entries.map(([key, val]: [string, any]) => {
          const isHeart = key.startsWith('kupa');
          const isDiamond = key.startsWith('karo');
          const isClub = key.startsWith('sinek');
          const symbol = isHeart ? '♥' : isDiamond ? '♦' : isClub ? '♣' : '♠';
          const color = isHeart || isDiamond ? '#EF4444' : '#64748B';
          return {
            id: key,
            name: val.name || key,
            suitSymbol: symbol,
            rankLabel: symbol,
            themeColor: color,
          };
        });
      }
    }

    if (deck.id === 'katina') {
      // 52 sembolik kart (Kupa/Karo/Sinek/Maça) + 13 element/ruh kartı = 65
      // kartlık gerçek Katina destesi (bkz. katina_card_details.json ve
      // katina_element_cards.json). İsimler artık düz "KUPA ASI" yerine
      // katina_card_details.json'daki gerçek başlıklardan geliyor.
      const symbolicEntries = Object.entries(katinaData as any);
      const symbolicCards: DeckCardItem[] = symbolicEntries.map(([key]) => {
        const isKupa = key.startsWith('kupa');
        const isKaro = key.startsWith('karo');
        const isSinek = key.startsWith('sinek');
        const symbol = isKupa ? '♥' : isKaro ? '♦' : isSinek ? '♣' : '♠';
        const color = isKupa || isKaro ? '#E11D48' : '#10B981';
        const detail = (katinaCardDetails as any)[key];
        return {
          id: key,
          name: detail?.name || key.replace('-', ' ').toUpperCase(),
          suitSymbol: symbol,
          rankLabel: symbol,
          themeColor: color,
        };
      });
      const elementCards: DeckCardItem[] = (katinaElementCards as any[]).map((card) => ({
        id: card.id,
        name: card.name,
        suitSymbol: '✨',
        rankLabel: 'Element',
        themeColor: card.valence === 'negative' ? '#F87171' : card.valence === 'mixed' ? '#FBBF24' : '#34D399',
      }));
      return [...symbolicCards, ...elementCards];
    }

    if (deck.id === 'lenormand') {
      return LENORMAND_FULL_CARDS.map((c, index) => ({
        id: c.id,
        name: c.name,
        image: LENORMAND_IMAGES[index + 1],
        suitSymbol: c.symbol,
        rankLabel: `No.${index + 1}`,
        themeColor: '#06B6D4',
      }));
    }

    if (deck.id === 'osho_zen') {
      return OSHO_ZEN_FULL_CARDS.map((c) => ({
        id: c.id,
        name: c.name,
        suitSymbol: c.symbol,
        rankLabel: 'Zen',
        themeColor: '#10B981',
      }));
    }

    if (deck.id === 'thoth_egypt') {
      return THOTH_FULL_CARDS.map((c) => ({
        id: c.id,
        name: c.name,
        suitSymbol: c.symbol,
        rankLabel: 'Kmt',
        themeColor: '#F59E0B',
      }));
    }

    return deck.sampleCards;
  }, [deck]);

  useEffect(() => {
    getDeckTier(deck.id).then(setTier);
    getCoins().then(setCoins);
    setDeckPool(generateDeckPool());
  }, [deck, generateDeckPool]);

  // Karıştırma Animasyonu
  const startShuffle = () => {
    setPhase('shuffling');
    shuffleRotate.setValue(0);
    shuffleScale.setValue(1);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(shuffleRotate, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shuffleScale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(shuffleScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      setPhase('picking');
      setDrawnCards([]);
      setP1DrawnCards([]);
      setP2DrawnCards([]);
      setBridgeDrawnCard(null);
      setRelTurn('p1');
    });
  };

  // Kart Seçme
  const handlePickCard = (item: DeckCardItem) => {
    const isReversed = Math.random() < 0.35; // %35 ters gelme olasılığı
    const cardsPerPerson =
      readingMode === 'relationship'
        ? selectedSpread.id === 'rel_cosmic_20'
          ? 10
          : selectedSpread.id === 'rel_mirror_10'
          ? 5
          : 3
        : selectedSpread.cardCount;
    const cleanP1 = p1Name.trim() || '1. Kişi';
    const cleanP2 = p2Name.trim() || '2. Kişi';

    if (readingMode === 'relationship') {
      if (relTurn === 'p1') {
        if (p1DrawnCards.length >= cardsPerPerson) return;
        const posLabel = selectedSpread.positions[p1DrawnCards.length] || `${p1DrawnCards.length + 1}. Katman`;
        const newCard: DrawnCard = {
          ...item,
          isReversed,
          positionName: `${cleanP1} - ${posLabel}`,
          isRevealed: false,
          flipAnim: new Animated.Value(0),
          dealAnim: new Animated.Value(0),
          rawItem: item,
        };
        const next = [...p1DrawnCards, newCard];
        setP1DrawnCards(next);
        if (next.length === cardsPerPerson) {
          setTimeout(() => setRelTurn('transition'), 400);
        }
      } else if (relTurn === 'p2') {
        if (p2DrawnCards.length >= cardsPerPerson) return;
        const posLabel = selectedSpread.positions[p2DrawnCards.length] || `${p2DrawnCards.length + 1}. Katman`;
        const newCard: DrawnCard = {
          ...item,
          isReversed,
          positionName: `${cleanP2} - ${posLabel}`,
          isRevealed: false,
          flipAnim: new Animated.Value(0),
          dealAnim: new Animated.Value(0),
          rawItem: item,
        };
        const next = [...p2DrawnCards, newCard];
        setP2DrawnCards(next);
        if (next.length === cardsPerPerson) {
          if (selectedSpread.id === 'rel_bridge_7') {
            setTimeout(() => setRelTurn('bridge'), 400);
          } else {
            setTimeout(() => setRelTurn('completed'), 400);
          }
        }
      } else if (relTurn === 'bridge') {
        const newCard: DrawnCard = {
          ...item,
          isReversed,
          positionName: 'Ortak Kadersel Köprü',
          isRevealed: false,
          flipAnim: new Animated.Value(0),
          dealAnim: new Animated.Value(0),
          rawItem: item,
        };
        setBridgeDrawnCard(newCard);
        setTimeout(() => setRelTurn('completed'), 400);
      }
      return;
    }

    // Bireysel Fal Modu
    if (drawnCards.length >= selectedSpread.cardCount) return;

    const positionName = selectedSpread.positions[drawnCards.length] || `Kart ${drawnCards.length + 1}`;

    const newCard: DrawnCard = {
      ...item,
      isReversed,
      positionName,
      isRevealed: false,
      flipAnim: new Animated.Value(0),
      dealAnim: new Animated.Value(0),
      rawItem: item,
    };

    const nextDrawn = [...drawnCards, newCard];
    setDrawnCards(nextDrawn);

    if (nextDrawn.length === selectedSpread.cardCount) {
      setTimeout(() => {
        setPhase('table');
      }, 500);
    }
  };

  // Kadersel Uyum Skoru Splash Animasyonu ve Masaya Geçiş
  const startScoreSplashAndGoToTable = () => {
    const cleanP1 = p1Name.trim() || '1. Kişi (Sen)';
    const cleanP2 = p2Name.trim() || '2. Kişi (Partner)';

    const res = analyzeRelationshipSpread(
      cleanP1,
      cleanP2,
      p1DrawnCards.map((c) => ({
        id: c.id,
        name: c.name,
        orientation: c.isReversed ? 'reversed' : 'upright',
      })),
      p2DrawnCards.map((c) => ({
        id: c.id,
        name: c.name,
        orientation: c.isReversed ? 'reversed' : 'upright',
      })),
      bridgeDrawnCard
        ? {
            id: bridgeDrawnCard.id,
            name: bridgeDrawnCard.name,
            orientation: bridgeDrawnCard.isReversed ? 'reversed' : 'upright',
          }
        : undefined
    );

    const target = res.overallScore;
    setSplashScoreTarget(target);
    setSplashScoreDisplay(0);
    splashScoreAnim.setValue(0);
    setShowScoreSplashModal(true);

    const listenerId = splashScoreAnim.addListener(({ value }) => {
      setSplashScoreDisplay(Math.round(value * target));
    });

    Animated.timing(splashScoreAnim, {
      toValue: 1,
      duration: 6500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      splashScoreAnim.removeListener(listenerId);
      setSplashScoreDisplay(target);
    });
  };

  const handleFinishSplashAndOpenTable = () => {
    setShowScoreSplashModal(false);
    setPhase('table');
  };

  // Otomatik Rastgele Seçim
  const handleAutoPickRemaining = () => {
    const cardsPerPerson =
      readingMode === 'relationship'
        ? selectedSpread.id === 'rel_cosmic_20'
          ? 10
          : selectedSpread.id === 'rel_mirror_10'
          ? 5
          : 3
        : selectedSpread.cardCount;
    const cleanP1 = p1Name.trim() || '1. Kişi';
    const cleanP2 = p2Name.trim() || '2. Kişi';

    if (readingMode === 'relationship') {
      const pickedIds = [...p1DrawnCards, ...p2DrawnCards, ...(bridgeDrawnCard ? [bridgeDrawnCard] : [])].map((d) => d.id);
      const unpicked = deckPool.filter((p) => !pickedIds.includes(p.id));
      const shuffled = [...unpicked].sort(() => 0.5 - Math.random());

      if (relTurn === 'p1') {
        const needed = cardsPerPerson - p1DrawnCards.length;
        const items = shuffled.slice(0, needed);
        const newCards: DrawnCard[] = items.map((item, idx) => ({
          ...item,
          isReversed: Math.random() < 0.35,
          positionName: `${cleanP1} - ${selectedSpread.positions[p1DrawnCards.length + idx] || `${p1DrawnCards.length + idx + 1}. Katman`}`,
          isRevealed: false,
          flipAnim: new Animated.Value(0),
          dealAnim: new Animated.Value(0),
          rawItem: item,
        }));
        setP1DrawnCards([...p1DrawnCards, ...newCards]);
        setTimeout(() => setRelTurn('transition'), 400);
      } else if (relTurn === 'p2') {
        const needed = cardsPerPerson - p2DrawnCards.length;
        const items = shuffled.slice(0, needed);
        const newCards: DrawnCard[] = items.map((item, idx) => ({
          ...item,
          isReversed: Math.random() < 0.35,
          positionName: `${cleanP2} - ${selectedSpread.positions[p2DrawnCards.length + idx] || `${p2DrawnCards.length + idx + 1}. Katman`}`,
          isRevealed: false,
          flipAnim: new Animated.Value(0),
          dealAnim: new Animated.Value(0),
          rawItem: item,
        }));
        setP2DrawnCards([...p2DrawnCards, ...newCards]);
        if (selectedSpread.id === 'rel_bridge_7') {
          setTimeout(() => setRelTurn('bridge'), 400);
        } else {
          setTimeout(() => setRelTurn('completed'), 400);
        }
      } else if (relTurn === 'bridge') {
        const item = shuffled[0];
        if (item) {
          setBridgeDrawnCard({
            ...item,
            isReversed: Math.random() < 0.35,
            positionName: 'Ortak Kadersel Köprü',
            isRevealed: false,
            flipAnim: new Animated.Value(0),
            dealAnim: new Animated.Value(0),
            rawItem: item,
          });
          setTimeout(() => setRelTurn('completed'), 400);
        }
      }
      return;
    }

    const needed = selectedSpread.cardCount - drawnCards.length;
    if (needed <= 0) return;

    const unpicked = deckPool.filter((p) => !drawnCards.some((d) => d.id === p.id));
    const shuffled = [...unpicked].sort(() => 0.5 - Math.random());
    const pickedItems = shuffled.slice(0, needed);

    const newCards: DrawnCard[] = pickedItems.map((item, idx) => {
      const cardIndex = drawnCards.length + idx;
      return {
        ...item,
        isReversed: Math.random() < 0.35,
        positionName: selectedSpread.positions[cardIndex] || `Kart ${cardIndex + 1}`,
        isRevealed: false,
        flipAnim: new Animated.Value(0),
        dealAnim: new Animated.Value(0),
        rawItem: item,
      };
    });

    const nextDrawn = [...drawnCards, ...newCards];
    setDrawnCards(nextDrawn);

    setTimeout(() => {
      setPhase('table');
    }, 500);
  };

  // 3D Kart Çevirme
  const revealCard = (cardIndex: number) => {
    const card = drawnCards[cardIndex];
    if (!card || card.isRevealed) return;

    card.isRevealed = true;
    setDrawnCards([...drawnCards]);

    Animated.spring(card.flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  // Tüm Kartları Otomatik Çevir
  const revealAllCards = () => {
    drawnCards.forEach((card, idx) => {
      if (!card.isRevealed) {
        revealCard(idx);
      }
    });
  };

  const allRevealed = drawnCards.length > 0 && drawnCards.every((c) => c.isRevealed);

  // Masaya Serim Ritüeli Animasyonunu Başlat (Kartları sırayla tek tek masaya koyma)
  const playRitualDealingAnimation = useCallback(() => {
    if (readingMode === 'relationship') {
      // Çift Dağıtımı: Önce 1. kartlar (P1 ve P2) aynı anda, sonra 2. kartlar, 3. kartlar...
      const maxPairs = Math.max(p1DrawnCards.length, p2DrawnCards.length);
      [...p1DrawnCards, ...p2DrawnCards, ...(bridgeDrawnCard ? [bridgeDrawnCard] : [])].forEach((c) =>
        c.dealAnim.setValue(0)
      );

      for (let i = 0; i < maxPairs; i++) {
        const p1C = p1DrawnCards[i];
        const p2C = p2DrawnCards[i];
        const delay = i * 350;

        if (p1C) {
          Animated.sequence([
            Animated.delay(delay),
            Animated.spring(p1C.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
          ]).start();
        }
        if (p2C) {
          Animated.sequence([
            Animated.delay(delay),
            Animated.spring(p2C.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
          ]).start();
        }
      }

      if (bridgeDrawnCard) {
        Animated.sequence([
          Animated.delay(maxPairs * 350),
          Animated.spring(bridgeDrawnCard.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      }
    } else {
      // Bireysel kart dağıtımı
      drawnCards.forEach((c) => c.dealAnim.setValue(0));
      drawnCards.forEach((card, index) => {
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.spring(card.dealAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [drawnCards, p1DrawnCards, p2DrawnCards, bridgeDrawnCard, readingMode]);

  // Kart Anlamını Çek (Kişisel vs Karşılıklı Uyum Ayrımıyla)
  const getCardDetails = useCallback((cardId: string) => {
    const isRelationship = readingMode === 'relationship';
    const targetName = p2Name.trim() || 'Partner';

    // 1. Angel Cards
    if (deck.id === 'angel') {
      const angel = (angelCardsData as any[]).find((a) => a.id === cardId);
      if (angel) {
        return {
          upright: angel.message,
          reversed: `Bu enerjiyi hayatına çekmek için biraz daha sakinleşmeli ve içindeki rehber melek sesine alan açmalısın.`,
          love: isRelationship
            ? `${targetName}'e söyle: 'İlişkinde koşulsuz sevgi ve şefkat ışığı parlıyor, kalbini korkmadan açmalı.'`
            : `İlişkinde koşulsuz sevgi ve şefkat ışığı parlıyor; kalbini korkmadan aç.`,
          career: isRelationship
            ? `${targetName}'e söyle: 'Niyetlerinde ilahi destek yanında, attığı adımlar bereket getirecek.'`
            : `İş ve niyetlerinde ilahi destek seninle; doğru adımları atıyorsun.`,
          advice: isRelationship
            ? `🗣️ Rehberlik: '${targetName}, meleklerin sana mesajı net: ${angel.message}'`
            : angel.message,
          story: `${angel.name} kartı, göksel melekler hiyerarşisinde şifa ve ışık frekansını simgeler. Kişinin hayatındaki tıkalı enerjileri sevgiyle açar.`,
          keywords: ['İlahi Rehberlik', 'Şifa', 'Saf Sevgi', 'Koruma'],
        };
      }
    }

    // 2. Runes — 24 Elder Futhark otantik mitolojik hikaye, aşk ve kariyer anlamları
    if (deck.id === 'rune') {
      const rune = getAllRunes().find((r) => r.id === cardId);
      const detailInfo = RUNE_DETAILED_INSIGHTS[cardId];
      if (rune) {
        const symmetric = isSymmetricRune(cardId);
        const isReversed = !symmetric && inspectedCard?.isReversed;
        const loveText = isReversed ? (detailInfo?.loveReversed || rune.reversed) : (detailInfo?.loveUpright || rune.upright);
        const careerText = isReversed ? (detailInfo?.careerReversed || rune.reversed) : (detailInfo?.careerUpright || rune.upright);

        return {
          upright: rune.upright,
          reversed: rune.reversed,
          love: isRelationship
            ? `${targetName}'e söyle: '${loveText}'`
            : loveText,
          career: careerText,
          advice: isRelationship ? `🗣️ Rehberlik: 'Ona de ki: ${rune.advice}'` : rune.advice,
          story: (detailInfo as any)?.mythStory || (detailInfo as any)?.story || `${rune.name} rünü, kadim İskandinav bilgeliğinde kozmik döngüleri ve kaderin derin akışını temsil eder.`,
          keywords: (rune as any).keywords || [rune.meaning],
        };
      }
    }

    // 3. Lenormand
    if (deck.id === 'lenormand') {
      const len = getLenormandMeaning(cardId);
      if (len) {
        return {
          upright: (len as any)?.general || (len as any)?.upright || len.name,
          reversed: `Bu kartın enerjisi gecikmeli veya içsel bir farkındalık sürecinde kendini gösterecektir.`,
          love: isRelationship ? `${targetName}'e söyle: '${len.love}'` : len.love,
          career: len.career,
          advice: isRelationship ? `🗣️ Rehberlik: '${targetName}, ${len.advice}'` : len.advice,
          story: (len as any)?.story || `${len.name} sembolü, klasik Lenormand kehanet sisteminde doğrudan ve net hayat olaylarını haber verir.`,
          keywords: (len as any)?.keywords || ['Kehanet', 'Somut İşaret'],
        };
      }
    }

    // 4. Katina — 65 kartlık gerçek deste: 52 sembolik kart artık kendi
    // Helenik/İzmir temalı figür+hikaye içeriğine sahip (katina_card_details.json,
    // katina_meanings.json'daki asıl yazılmış anlamı korur), + 13 element/ruh
    // kartı (katina_element_cards.json) sonuç enerjisini (olumlu/olumsuz)
    // belirleyen ayrı bir katman olarak çekilebiliyor. Katina gerçekte sadece
    // aşk/ilişkiye adanmış bir fal olduğu için ayrı bir "kariyer" yorumu
    // uydurulmuyor.
    if (deck.id === 'katina') {
      const elementCard = (katinaElementCards as any[]).find((c) => c.id === cardId);
      if (elementCard) {
        return {
          upright: elementCard.meaning,
          reversed: `Bu enerjinin gölge yönü öne çıkabilir; dikkatli ve sabırlı ol.`,
          love: undefined,
          career: undefined,
          advice: isRelationship ? `🗣️ Rehberlik: '${targetName}, ${elementCard.advice}'` : elementCard.advice,
          story: elementCard.story,
          keywords: [elementCard.figure, elementCard.element].filter(Boolean),
        };
      }
      const katDetail = (katinaCardDetails as any)[cardId];
      const katText = (katinaData as any)[cardId] as string | undefined;
      if (katDetail || katText) {
        return {
          upright: katDetail?.meaning || katText,
          reversed: `Kartın gölge tarafı devreye girebilir; niyetlerinde aceleci olma, kalbini zorlama.`,
          love: undefined,
          career: undefined,
          advice: isRelationship
            ? `🗣️ Rehberlik: '${targetName}, ${katDetail?.advice || 'kalbinin sesini dinle, bu enerjiye güven.'}'`
            : (katDetail?.advice || `Kalbinin sesini dinle ve bu enerjiyi ilişkine taşı.`),
          story: katDetail?.story || `Katina destesi, aşk ve ilişki kehanetine adanmış özel bir fal geleneğidir; bu kart kalbinin derin katmanlarından birini temsil eder.`,
          keywords: [katDetail?.figure, katDetail?.element].filter(Boolean).length
            ? [katDetail?.figure, katDetail?.element].filter(Boolean)
            : ['Katina Kehaneti', 'Aşk', 'Kader'],
        };
      }
    }

    // 5. İskambil — iskambil_card_details.json'daki gerçek alanlar
    // name/figure/element/meaning/story/advice; isk.upright/isk.genel gibi
    // var olmayan alan adları yüzünden asıl yorum metni (meaning) hiç
    // gösterilmiyordu, sadece hikaye ve tavsiye görünüyordu.
    if (deck.id === 'iskambil') {
      const isk = (iskambilData as any)[cardId];
      if (isk) {
        const figureKeywords = [isk.figure, isk.element].filter(Boolean);
        return {
          upright: isk.meaning,
          reversed: `Enerjinin dengelenmesi için biraz zaman tanı; kartın gölge yönü öne çıkabilir.`,
          love: undefined,
          career: undefined,
          advice: isRelationship ? `🗣️ Rehberlik: '${targetName}, ${isk.advice}'` : isk.advice,
          story: isk.story,
          keywords: figureKeywords.length ? figureKeywords : ['Kader', 'Olay', 'Maddi / Manevi'],
        };
      }
    }

    // 6. Klasik Tarot
    const tMean = getTarotMeaning(cardId);
    const modern = getModernTarotMeaning(cardId);
    const keywords = getTarotKeywordList(cardId);
    const lexiconDeck = (cardDecksLexicon as any).tarot || {};
    const lex = lexiconDeck[cardId] || {};

    if (tMean) {
      return {
        upright: modern?.upright || tMean.upright,
        reversed: modern?.reversed || tMean.reversed,
        love: isRelationship
          ? `${targetName}'e söyle: '${modern?.love || tMean.upright}'`
          : (modern?.love || tMean.upright),
        career: modern?.career || tMean.upright,
        advice: isRelationship
          ? `🗣️ Rehberlik: '${targetName}, ${modern?.advice || tMean.upright}'`
          : (modern?.advice || tMean.upright),
        story: lex.story || `${inspectedCard?.name || cardId} kartı, kadim Tarot Arkana yolculuğunda ruhun tekamülünü ve kadersel döngülerini temsil eder.`,
        keywords: keywords.length > 0 ? keywords : [inspectedCard?.name || cardId],
      };
    }

    return {
      upright: 'Bu kartın evrensel enerjisi yolunu aydınlatıyor.',
      reversed: 'Bu enerjiyi hayatına entegre etmek için iç sesine kulak ver.',
      love: isRelationship ? `${targetName}'e söyle: 'Kalbinin sesini dinle.'` : 'Kalbinin sesini dinle.',
      career: 'Adımlarını kararlılıkla at.',
      advice: 'İç sesine güven ve akışta kal.',
      story: 'Kadim kehanet destesinde yer alan bu kart, hayatındaki önemli bir dönemece işaret eder.',
      keywords: ['İçsel Güç', 'Farkındalık'],
    };
  }, [readingMode, p2Name, deck.id, inspectedCard]);

  // Çiftler için Katman Katman Sentez Motoru
  const relAnalysis = useMemo(() => {
    if (readingMode !== 'relationship') return null;
    const cleanP1 = p1Name.trim() || '1. Kişi (Sen)';
    const cleanP2 = p2Name.trim() || '2. Kişi (Partner)';
    return analyzeRelationshipSpread(
      cleanP1,
      cleanP2,
      p1DrawnCards.map((c) => ({
        id: c.id,
        name: c.name,
        orientation: (c.isReversed ? 'reversed' : 'upright') as 'reversed' | 'upright',
      })),
      p2DrawnCards.map((c) => ({
        id: c.id,
        name: c.name,
        orientation: (c.isReversed ? 'reversed' : 'upright') as 'reversed' | 'upright',
      })),
      bridgeDrawnCard
        ? {
            id: bridgeDrawnCard.id,
            name: bridgeDrawnCard.name,
            orientation: (bridgeDrawnCard.isReversed ? 'reversed' : 'upright') as 'reversed' | 'upright',
          }
        : undefined
    );
  }, [readingMode, p1Name, p2Name, p1DrawnCards, p2DrawnCards, bridgeDrawnCard]);

  const allReadingCards = useMemo(() => {
    if (readingMode === 'relationship') {
      return [...p1DrawnCards, ...p2DrawnCards, ...(bridgeDrawnCard ? [bridgeDrawnCard] : [])];
    }
    return drawnCards;
  }, [readingMode, p1DrawnCards, p2DrawnCards, bridgeDrawnCard, drawnCards]);

  const totalCardsToPlace = allReadingCards.length;

  const isAllPlaced = useMemo(() => {
    if (readingMode === 'relationship') {
      const p1Done = p1PlacedCount >= p1DrawnCards.length && p1DrawnCards.length > 0;
      const p2Done = p2PlacedCount >= p2DrawnCards.length && p2DrawnCards.length > 0;
      const bridgeDone = bridgeDrawnCard ? isBridgePlaced : true;
      return p1Done && p2Done && bridgeDone;
    }
    return placedCount >= drawnCards.length && drawnCards.length > 0;
  }, [readingMode, p1PlacedCount, p1DrawnCards.length, p2PlacedCount, p2DrawnCards.length, bridgeDrawnCard, isBridgePlaced, placedCount, drawnCards.length]);

  // Bireysel Mod Kart Koyma
  const placeNextCard = useCallback((targetIndex?: number) => {
    const currentIndex = targetIndex !== undefined ? targetIndex : placedCount;
    if (currentIndex >= drawnCards.length) return;

    const card = drawnCards[currentIndex];
    if (card) {
      card.isRevealed = true;
      card.dealAnim.setValue(0);
      Animated.spring(card.dealAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }

    const nextCount = currentIndex + 1;
    setPlacedCount(nextCount);

    setTimeout(() => {
      bottomDockRef.current?.scrollTo({ x: Math.max(0, (nextCount - 1) * 66), animated: true });
    }, 60);
  }, [placedCount, drawnCards]);

  // Çiftler Modu Kart Koyma (Danışan / Partner Ayrımıyla)
  const placeNextRelationshipCard = useCallback((person: 'p1' | 'p2' | 'bridge', targetIdx?: number) => {
    if (person === 'p1') {
      const idx = targetIdx !== undefined ? targetIdx : p1PlacedCount;
      if (idx >= p1DrawnCards.length) return;
      const card = p1DrawnCards[idx];
      if (card) {
        card.isRevealed = true;
        card.dealAnim.setValue(0);
        Animated.spring(card.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
      }
      const nextP1 = idx + 1;
      setP1PlacedCount(nextP1);
      if (nextP1 === p1DrawnCards.length) {
        setTimeout(() => setActiveDockTab('p2'), 350);
      }
      setTimeout(() => {
        bottomDockRef.current?.scrollTo({ x: Math.max(0, (nextP1 - 1) * 66), animated: true });
      }, 60);
    } else if (person === 'p2') {
      const idx = targetIdx !== undefined ? targetIdx : p2PlacedCount;
      if (idx >= p2DrawnCards.length) return;
      const card = p2DrawnCards[idx];
      if (card) {
        card.isRevealed = true;
        card.dealAnim.setValue(0);
        Animated.spring(card.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
      }
      const nextP2 = idx + 1;
      setP2PlacedCount(nextP2);
      if (nextP2 === p2DrawnCards.length && bridgeDrawnCard) {
        setTimeout(() => setActiveDockTab('bridge'), 350);
      }
      setTimeout(() => {
        bottomDockRef.current?.scrollTo({ x: Math.max(0, (nextP2 - 1) * 66), animated: true });
      }, 60);
    } else if (person === 'bridge' && bridgeDrawnCard) {
      bridgeDrawnCard.isRevealed = true;
      bridgeDrawnCard.dealAnim.setValue(0);
      Animated.spring(bridgeDrawnCard.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
      setIsBridgePlaced(true);
    }
  }, [p1PlacedCount, p1DrawnCards, p2PlacedCount, p2DrawnCards, bridgeDrawnCard]);

  // Hepsini Masaya Diz
  const placeAllCards = useCallback(() => {
    if (readingMode === 'relationship') {
      p1DrawnCards.forEach((c, idx) => {
        c.isRevealed = true;
        Animated.sequence([
          Animated.delay(idx * 70),
          Animated.spring(c.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      });
      p2DrawnCards.forEach((c, idx) => {
        c.isRevealed = true;
        Animated.sequence([
          Animated.delay((p1DrawnCards.length + idx) * 70),
          Animated.spring(c.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      });
      if (bridgeDrawnCard) {
        bridgeDrawnCard.isRevealed = true;
        Animated.sequence([
          Animated.delay((p1DrawnCards.length + p2DrawnCards.length) * 70),
          Animated.spring(bridgeDrawnCard.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
        setIsBridgePlaced(true);
      }
      setP1PlacedCount(p1DrawnCards.length);
      setP2PlacedCount(p2DrawnCards.length);
    } else {
      drawnCards.forEach((card, idx) => {
        card.isRevealed = true;
        Animated.sequence([
          Animated.delay(idx * 80),
          Animated.spring(card.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      });
      setPlacedCount(drawnCards.length);
    }
  }, [readingMode, p1DrawnCards, p2DrawnCards, bridgeDrawnCard, drawnCards]);

  // Yeniden Diz (Aynı Kartları Sıfırlayıp Tekrar Dizebilme)
  const resetAndReDeal = useCallback(() => {
    [...p1DrawnCards, ...p2DrawnCards, ...(bridgeDrawnCard ? [bridgeDrawnCard] : []), ...drawnCards].forEach((c) => {
      c.isRevealed = false;
      c.dealAnim.setValue(0);
    });
    setPlacedCount(0);
    setP1PlacedCount(0);
    setP2PlacedCount(0);
    setIsBridgePlaced(false);
    setActiveDockTab('p1');
    setTimeout(() => {
      bottomDockRef.current?.scrollTo({ x: 0, animated: true });
    }, 60);
  }, [p1DrawnCards, p2DrawnCards, bridgeDrawnCard, drawnCards]);

  // Çiftler Modu Bireysel Kart Yerleştirme & Sıfırlama
  const placeAllPersonCards = useCallback((person: 'p1' | 'p2') => {
    if (person === 'p1') {
      p1DrawnCards.forEach((c, idx) => {
        c.isRevealed = true;
        Animated.sequence([
          Animated.delay(idx * 70),
          Animated.spring(c.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      });
      setP1PlacedCount(p1DrawnCards.length);
    } else if (person === 'p2') {
      p2DrawnCards.forEach((c, idx) => {
        c.isRevealed = true;
        Animated.sequence([
          Animated.delay(idx * 70),
          Animated.spring(c.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      });
      setP2PlacedCount(p2DrawnCards.length);
    }
  }, [p1DrawnCards, p2DrawnCards]);

  const resetPersonCards = useCallback((person: 'p1' | 'p2') => {
    if (person === 'p1') {
      p1DrawnCards.forEach((c) => {
        c.isRevealed = false;
        c.dealAnim.setValue(0);
      });
      setP1PlacedCount(0);
      setTimeout(() => p1DockScrollRef.current?.scrollTo({ x: 0, animated: true }), 60);
    } else if (person === 'p2') {
      p2DrawnCards.forEach((c) => {
        c.isRevealed = false;
        c.dealAnim.setValue(0);
      });
      setP2PlacedCount(0);
      setTimeout(() => p2DockScrollRef.current?.scrollTo({ x: 0, animated: true }), 60);
    }
  }, [p1DrawnCards, p2DrawnCards]);

  const handleBuyExplained = async () => {
    setPurchaseLoading(true);
    const cost =
      tier === 'visual'
        ? Math.max(0, deck.priceExplainedCoins - deck.priceVisualCoins)
        : deck.priceExplainedCoins;

    const res = await purchaseDeckWithCoins(deck.id, 'explained', cost);
    setPurchaseLoading(false);
    if (res.success) {
      setTier('explained');
      setUpgradeModalVisible(false);
      showAlert('Harika! ✨', 'Açıklamalı deste kilidi açıldı! Artık tüm kart analizlerini görebilirsin.');
    } else {
      showAlert('Hata', res.error || 'Satın alma tamamlanamadı.');
    }
  };

  // Detaylı Fal Yorumu Butonuna Basıldığında (Coin Kontrolü & Onay)
  const handleLaunchAiReading = async () => {
    const totalPicked = readingMode === 'relationship'
      ? p1DrawnCards.length + p2DrawnCards.length + (bridgeDrawnCard ? 1 : 0)
      : drawnCards.length;

    if (totalPicked === 0) return;
    const current = await getCoins();
    if (current < 50) {
      setInsufficientCoinModalVisible(true);
    } else {
      setConfirmAnalysisModalVisible(true);
    }
  };

  // 50 Coin Onaylanıp Analiz Başlatıldığında
  const handleConfirmAndPayAnalysis = async () => {
    setConfirmAnalysisModalVisible(false);
    const current = await getCoins();
    if (current < 50) {
      setInsufficientCoinModalVisible(true);
      return;
    }

    const spent = await spendCoins(50);
    if (!spent) {
      setInsufficientCoinModalVisible(true);
      return;
    }

    // Kullanıcının bizzat kendi seçtiği kartları, yönlerini ve açılım tipini TarotResult ekranına aktar
    const allCards = readingMode === 'relationship'
      ? [...p1DrawnCards, ...p2DrawnCards, ...(bridgeDrawnCard ? [bridgeDrawnCard] : [])]
      : drawnCards;

    const mappedPicks = allCards.map((c) => ({
      id: c.id,
      orientation: (c.isReversed ? 'reversed' : 'upright') as any,
    }));

    // Lenormand'ın kendi otantik yorumlama motoru ve sonuç ekranı var — Tarot
    // kart ID'leriyle çalışan TarotResult'a asla yönlendirilmemeli (findTarotCard
    // Lenormand kart ID'lerini tanımaz, sonuç bozuk çıkar).
    if (deck.id === 'lenormand') {
      const lenormandSpread = LENORMAND_SPREADS.find((s) => s.positions.length === allCards.length) ?? LENORMAND_SPREADS[1];
      navigation.navigate('LenormandResult', {
        picks: mappedPicks,
        positions: allCards.map((c) => c.positionName),
        readingTechnique: lenormandSpread.readingTechnique,
      });
      return;
    }

    // Rün, Anasayfa'daki Rün Falı ile AYNI motoru (interpretRuneReading) ve
    // aynı sonuç ekranını kullanır — Tarot'a yönlendirilmemeli.
    if (deck.id === 'rune') {
      navigation.navigate('RuneResult', {
        picks: mappedPicks,
        spreadType: spreadTypeForCount(allCards.length),
      });
      return;
    }

    // spreadId burada sadece kart sayısı — kuyruk/başlık amaçlı yaklaşık bir
    // bilgi. Gerçek pozisyon etiketleri (kullanıcının ekranda gördüğü ve bu
    // ekranın kendi SPREAD_OPTIONS/RELATIONSHIP_SPREAD_OPTIONS kataloğundan
    // gelen) ayrıca `positions` ile gönderiliyor — TarotResultScreen'in
    // findSpread(spreadId) ile YANLIŞ bir açılım kataloğuna (ör. 5/7/10 kartlık
    // farklı bir dizilime) düşmesini engellemek için. Her kartın kendi
    // positionName'i zaten seçim sırasında doğru şekilde hesaplanmıştı.
    const targetSpreadId = allCards.length as any;
    navigation.navigate('TarotResult', {
      spreadId: targetSpreadId,
      picks: mappedPicks,
      positions: allCards.map((c) => c.positionName),
      isPrepaid: true,
      isRelationship: readingMode === 'relationship',
      p1Name: p1Name.trim() || '1. Kişi',
      p2Name: p2Name.trim() || '2. Kişi',
      relFocus: relFocus.trim() || 'Aşk & Ruhsal Uyum',
    });
  };

  const shuffleSpin = shuffleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <View style={styles.rootContainer}>
      {/* 8K Özel Deste Arkaplanı */}
      <Image source={deck.sectionBg} style={styles.bgFullImage} resizeMode="cover" />
      <LinearGradient
        colors={[
          'rgba(6, 3, 14, 0.70)',
          'rgba(10, 5, 20, 0.85)',
          'rgba(6, 2, 12, 0.95)',
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 1. Mistik Giriş Figür Animasyonu */}
      <EkolEntranceSplash
        visible={showSplash}
        figureSource={deck.figureSource}
        title={deck.title}
        subtitle={deck.tagline}
        accentColor={deck.accent}
        onFinish={() => setShowSplash(false)}
      />

      {/* Üst Gezinme Barı */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={deck.accent} />
        </Pressable>

        <View style={styles.topTitleBox}>
          <Text style={[styles.topTitle, { color: deck.accent }]}>{deck.shortTitle}</Text>
          <Text style={styles.topSubtitle}>
            {readingMode === 'self'
              ? '🔮 Kendi Falım'
              : `👥 ${p1Name} & ${p2Name} Karşılıklı Uyum`}
          </Text>
        </View>

        {tier === 'visual' ? (
          <Pressable
            onPress={() => setUpgradeModalVisible(true)}
            style={[styles.upgradeBadge, { borderColor: GOLD_SOFT }]}
          >
            <Ionicons name="sparkles" size={13} color={GOLD} />
            <Text style={styles.upgradeBadgeText}>Rehberi Aç</Text>
          </Pressable>
        ) : (
          <View style={[styles.tierIndicator, { backgroundColor: deck.accent + '25' }]}>
            <Text style={[styles.tierIndicatorText, { color: deck.accent }]}>Tam Rehber</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PHASE 1: KURULUM & DİZİLİM SEÇİMİ */}
        {phase === 'setup' && (
          <View style={styles.setupContainer}>
            {/* 1. Kime Bakılıyor? Mod Seçimi */}
            {!initialMode ? (
              <>
                <Text style={styles.sectionLabel}>1. FAL MODUNU SEÇ</Text>
                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => {
                      setReadingMode('self');
                      setSelectedSpread(
                        deck.id === 'lenormand' ? LENORMAND_SPREAD_OPTIONS[1] : deck.id === 'rune' ? RUNE_SPREAD_OPTIONS[1] : SPREAD_OPTIONS[1],
                      );
                    }}
                    style={[
                      styles.modeButton,
                      readingMode === 'self' && [styles.modeButtonActive, { borderColor: deck.accent }],
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="crystal-ball"
                      size={26}
                      color={readingMode === 'self' ? deck.accent : TEXT_MUTED}
                    />
                    <Text
                      style={[
                        styles.modeButtonTitle,
                        readingMode === 'self' && { color: deck.accent, fontWeight: '900' },
                      ]}
                    >
                      Kendi Falıma Bakıyorum
                    </Text>
                    <Text style={styles.modeButtonDesc}>Bireysel içsel mesajlar & sezgisel rehberlik</Text>
                  </Pressable>

                  {/* Lenormand ve Rün için otantik, araştırılmış bir çift açılımı
                      henüz tasarlanmadı — yanlış/kopya bir açılım göstermektense
                      bu mod şimdilik gizli. Sadece bireysel okuma sunuluyor. */}
                  {deck.id !== 'lenormand' && deck.id !== 'rune' && (
                    <Pressable
                      onPress={() => {
                        setReadingMode('relationship');
                        setSelectedSpread(RELATIONSHIP_SPREAD_OPTIONS[0]);
                      }}
                      style={[
                        styles.modeButton,
                        readingMode === 'relationship' && [styles.modeButtonActive, { borderColor: deck.accent }],
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="heart-multiple"
                        size={26}
                        color={readingMode === 'relationship' ? deck.accent : TEXT_MUTED}
                      />
                      <Text
                        style={[
                          styles.modeButtonTitle,
                          readingMode === 'relationship' && { color: deck.accent, fontWeight: '900' },
                        ]}
                      >
                        Karşılıklı Uyum Açılımı
                      </Text>
                      <Text style={styles.modeButtonDesc}>Çift & 2 kişilik ilişki aynası (Sırayla kart seçimi)</Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : initialMode === 'relationship' ? (
              <View style={[styles.lockedModeCard, { borderColor: '#EC489955', backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <MaterialCommunityIcons name="heart-multiple" size={24} color="#EC4899" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lockedModeTitle, { color: '#EC4899' }]}>
                    Karşılıklı Uyum Açılımı (Çift & Partner Analizi)
                  </Text>
                  <Text style={styles.lockedModeSub}>
                    İki tarafın enerjilerini karşılıklı masaya yatıran 10 seviyeli sentez modu
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.lockedModeCard, { borderColor: deck.accent + '55', backgroundColor: deck.accent + '12' }]}>
                <MaterialCommunityIcons name="table-furniture" size={24} color={deck.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lockedModeTitle, { color: deck.accent }]}>
                    Deste Masası & Kehanet Atölyesi
                  </Text>
                  <Text style={styles.lockedModeSub}>
                    Masa dizilimini inceleme, kart sembolizmini ve anlamlarını öğrenme modu
                  </Text>
                </View>
              </View>
            )}

            {/* Karşılıklı Uyum Moduna Özel Çift Bilgi Girişi & Rehber Bilgi */}
            {readingMode === 'relationship' && (
              <>
                <View style={[styles.relInfoBanner, { borderColor: '#EC489966', backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Ionicons name="information-circle" size={20} color="#EC4899" />
                  <Text style={styles.relInfoText}>
                    💡 Masaya geçildiğinde tüm kartlara tek tek dokunarak her iki tarafın hislerini, bilinçaltını ve kadersel analizini detaylı olarak öğrenebilirsiniz.
                  </Text>
                </View>

                <View style={[styles.friendInputCard, { borderColor: 'rgba(255, 201, 60, 0.25)' }]}>
                  <View style={styles.friendHeaderRow}>
                    <MaterialCommunityIcons name="heart-pulse" size={18} color="#F43F5E" />
                    <Text style={[styles.friendInputTitle, { color: '#FFFFFF' }]}>
                      Karşılıklı Uyum Çift Bilgileri
                    </Text>
                  </View>

                  {/* 1. ve 2. Kişi Bilgileri & Ortada Yer Değiştirme Butonu */}
                  <View style={styles.swapInputsRow}>
                    {/* 1. Kişi (Mavi / Pembe Dinamik) */}
                    <View style={[styles.partnerInputBox, { borderColor: p1Color + '66', backgroundColor: p1Color + '0D' }]}>
                      <View style={styles.partnerInputLabelRow}>
                        <MaterialCommunityIcons name={p1GenderIcon as any} size={14} color={p1Color} />
                        <Text style={[styles.partnerInputLabel, { color: p1Color }]} numberOfLines={1}>
                          {p1RoleLabel}
                        </Text>
                      </View>
                      <TextInput
                        placeholder={p1Placeholder}
                        placeholderTextColor={TEXT_MUTED}
                        value={p1Name}
                        onChangeText={setP1Name}
                        style={[styles.friendTextInput, { borderColor: p1Color + '55', color: '#FFFFFF' }]}
                      />
                    </View>

                    {/* ⇄ Ortadaki Yer Değiştirme Butonu */}
                    <Pressable
                      onPress={handleSwapPartners}
                      style={({ pressed }) => [
                        styles.swapPartnersCircleBtn,
                        pressed && styles.btnPressed,
                      ]}
                      hitSlop={8}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        style={styles.swapPartnersCircleGradient}
                      >
                        <Ionicons name="swap-horizontal" size={18} color="#0B0612" />
                      </LinearGradient>
                      <Text style={styles.swapBtnHintText}>Değiştir</Text>
                    </Pressable>

                    {/* 2. Kişi (Pembe / Mavi Dinamik) */}
                    <View style={[styles.partnerInputBox, { borderColor: p2Color + '66', backgroundColor: p2Color + '0D' }]}>
                      <View style={styles.partnerInputLabelRow}>
                        <MaterialCommunityIcons name={p2GenderIcon as any} size={14} color={p2Color} />
                        <Text style={[styles.partnerInputLabel, { color: p2Color }]} numberOfLines={1}>
                          {p2RoleLabel}
                        </Text>
                      </View>
                      <TextInput
                        placeholder={p2Placeholder}
                        placeholderTextColor={TEXT_MUTED}
                        value={p2Name}
                        onChangeText={setP2Name}
                        style={[styles.friendTextInput, { borderColor: p2Color + '55', color: '#FFFFFF' }]}
                      />
                    </View>
                  </View>

                  <TextInput
                    placeholder="İlişki Niyeti / Odak (Örn: Aşk & Evlilik Uyumu, Geleceğimiz)..."
                    placeholderTextColor={TEXT_MUTED}
                    value={relFocus}
                    onChangeText={setRelFocus}
                    style={[styles.friendTextInput, { marginTop: 4 }]}
                  />
                </View>
              </>
            )}

            {/* 2. Açılım Tipi Seçimi */}
            <Text style={styles.sectionLabel}>
              {deck.id === 'rune' ? 'AÇILIM VE TAŞ SAYISINI SEÇ' : 'AÇILIM VE KART SAYISINI SEÇ'}
            </Text>
            <View style={styles.spreadList}>
              {(deck.id === 'lenormand'
                ? LENORMAND_SPREAD_OPTIONS
                : deck.id === 'rune'
                ? RUNE_SPREAD_OPTIONS
                : readingMode === 'relationship'
                ? RELATIONSHIP_SPREAD_OPTIONS
                : SPREAD_OPTIONS
              ).map((spread) => {
                const isSelected = selectedSpread.id === spread.id;
                return (
                  <Pressable
                    key={spread.id}
                    onPress={() => setSelectedSpread(spread)}
                    style={({ pressed }) => [
                      styles.spreadCard,
                      isSelected && [styles.spreadCardSelected, { borderColor: deck.accent }],
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <View style={styles.spreadTop}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.spreadName, isSelected && { color: deck.accent }]}>
                          {spread.name}
                        </Text>
                        <View style={[styles.spreadCountPill, { backgroundColor: deck.accent + '25' }]}>
                          <Text style={[styles.spreadCountText, { color: deck.accent }]}>
                            {spread.cardCount} {deck.id === 'rune' ? 'Taş' : 'Kart'}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={22} color={deck.accent} />}
                    </View>
                    <Text style={styles.spreadDesc}>{spread.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 3. Kart Dizilim Düzeni (Sadece kart desteleri için) */}
            {deck.id !== 'rune' && (
              <>
                <Text style={styles.sectionLabel}>3. KART DİZİLİM DÜZENİ</Text>
                <View style={styles.layoutOptionsGrid}>
                  {LAYOUT_OPTIONS.map((lo) => {
                    const isSelected = selectedLayout === lo.id;
                    return (
                      <Pressable
                        key={lo.id}
                        onPress={() => setSelectedLayout(lo.id)}
                        style={[
                          styles.layoutOptionButton,
                          isSelected && [styles.layoutOptionActive, { borderColor: deck.accent }],
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={lo.icon}
                          size={22}
                          color={isSelected ? deck.accent : TEXT_MUTED}
                        />
                        <Text
                          style={[
                            styles.layoutOptionTitle,
                            isSelected && { color: deck.accent, fontWeight: '800' },
                          ]}
                        >
                          {lo.title}
                        </Text>
                        <Text style={styles.layoutOptionDesc} numberOfLines={1}>
                          {lo.desc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Masaya Aç Butonu */}
            <Pressable
              onPress={startShuffle}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: deck.accent },
                pressed && styles.btnPressed,
              ]}
            >
              <MaterialCommunityIcons
                name={deck.id === 'rune' ? 'hand-back-left' : 'cards-playing-outline'}
                size={22}
                color={NIGHT_CARD}
              />
              <Text style={styles.startBtnText}>
                {deck.id === 'rune'
                  ? `Taşları Hazırla ve Masaya Ser (${deckPool.length} Taş)`
                  : `Desteyi Karıştır ve Masaya Aç (${deckPool.length} Kart)`}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={NIGHT_CARD} />
            </Pressable>
          </View>
        )}

        {/* PHASE 2: SHUFFLING & PICKING (KARIŞTIRMA VE SEÇİM) */}
        {(phase === 'shuffling' || phase === 'picking') && (
          <View style={styles.pickContainer}>
            <Text style={[styles.pickHeaderTitle, { color: deck.accent }]}>
              {phase === 'shuffling'
                ? deck.id === 'rune'
                  ? 'Kutsal Taşlar Arındırılıyor & Enerjiler Açılıyor...'
                  : 'Deste Karıştırılıyor & Enerjiler Arınıyor...'
                : readingMode === 'relationship'
                ? relTurn === 'p1'
                  ? `✨ 1. TUR: ${p1Name} 3 Kart Seçiyor (${p1DrawnCards.length}/3)`
                  : relTurn === 'transition'
                  ? `💖 ${p1Name}'in kartları seçildi! Şimdi telefonu ${p2Name}'e verin.`
                  : relTurn === 'p2'
                  ? `✨ 2. TUR: ${p2Name} 3 Kart Seçiyor (${p2DrawnCards.length}/3)`
                  : `🔮 ORTAK TUR: Kadersel Köprü Kartını Seçin`
                : `Niyetine odaklan ve ${selectedSpread.cardCount - drawnCards.length} ${deck.id === 'rune' ? 'taş seç' : 'kart seç'}`}
            </Text>
            <Text style={styles.pickHeaderSubtitle}>
              {readingMode === 'relationship'
                ? relTurn === 'p1'
                  ? `Sırayla: ${['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek'][p1DrawnCards.length] || 'Hazır'}`
                  : relTurn === 'p2'
                  ? `Sırayla: ${['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek'][p2DrawnCards.length] || 'Hazır'}`
                  : relTurn === 'transition'
                  ? `Şimdi telefonu ${p2Name}'e verin`
                  : 'Ortak Kadersel Kesişim'
                : `${drawnCards.length} / ${selectedSpread.cardCount} ${deck.id === 'rune' ? 'Taş' : 'Kart'} Seçildi · (${deck.id === 'rune' ? 'Taş Seti' : 'Deste'}: ${deckPool.length} ${deck.id === 'rune' ? 'Taş' : 'Kart'})`}
            </Text>

            {phase === 'shuffling' ? (
              <Animated.View
                style={[
                  styles.shuffleWrap,
                  deck.id === 'rune' && { backgroundColor: 'transparent', borderWidth: 0 },
                  {
                    transform: [{ rotate: shuffleSpin }, { scale: shuffleScale }],
                  },
                ]}
              >
                <Image source={deck.cardBackImage} style={styles.shuffleCardBack} resizeMode="contain" />
              </Animated.View>
            ) : (
              <View style={styles.pickingArea}>
                {/* 2 Kişilik Geçiş Ekranı (1. Tur Bittiğinde) */}
                {readingMode === 'relationship' && relTurn === 'transition' && (
                  <View style={[styles.friendInputCard, { borderColor: deck.accent, alignItems: 'center', padding: 22, marginVertical: 12 }]}>
                    <MaterialCommunityIcons name="heart-flash" size={36} color={deck.accent} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 16, fontWeight: '900', color: deck.accent, textAlign: 'center' }}>
                      {p1Name.trim() || '1. Kişi'}'in Kartları Mühürlendi! ✨
                    </Text>
                    <Text style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.75)', textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 18 }}>
                      Harika! Şimdi telefonu {p2Name.trim() || '2. Kişi'}'e uzatın. O da enerjilerini temsil eden kartlarını seçecek.
                    </Text>
                    <Pressable
                      onPress={() => setRelTurn('p2')}
                      style={[styles.startBtn, { backgroundColor: deck.accent, width: '100%', paddingVertical: 14 }]}
                    >
                      <Text style={styles.startBtnText}>2. Tura Başla ({p2Name.trim() || '2. Kişi'} Kart Seçecek) →</Text>
                    </Pressable>
                  </View>
                )}

                {/* 2 Kişilik Seçim Tamamlandı Ekranı & Butonu */}
                {readingMode === 'relationship' && relTurn === 'completed' && (
                  <View style={[styles.friendInputCard, { borderColor: GOLD, alignItems: 'center', padding: 22, marginVertical: 14, backgroundColor: 'rgba(20, 10, 35, 0.95)' }]}>
                    <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={38} color={GOLD} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 17, fontWeight: '900', color: GOLD, textAlign: 'center' }}>
                      ✨ Tüm Kartlar Masada Mühürlendi!
                    </Text>
                    <Text style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginTop: 6, marginBottom: 18, lineHeight: 18 }}>
                      {p1Name.trim() || '1. Kişi'} ve {p2Name.trim() || '2. Kişi'} için tüm kadersel enerjiler toplandı. Şimdi kozmik uyum oranını ve masadaki dizilimi görmek için butona dokunun.
                    </Text>
                    <Pressable
                      onPress={startScoreSplashAndGoToTable}
                      style={[styles.startBtn, { backgroundColor: GOLD, width: '100%', paddingVertical: 15 }]}
                    >
                      <MaterialCommunityIcons name="heart-flash" size={20} color="#000" />
                      <Text style={[styles.startBtnText, { color: '#000', fontWeight: '900', fontSize: 14 }]}>
                        KADERSEL UYUM SONUCUNU GÖR →
                      </Text>
                    </Pressable>
                  </View>
                )}

                {deck.id === 'rune' && readingMode === 'self' ? (
                  <RuneCastingClothExperience
                    requiredCount={selectedSpread.cardCount}
                    positions={selectedSpread.positions}
                    accentColor={deck.accent}
                    onSelectionComplete={(selectedRunes) => {
                      const drawn: DrawnCard[] = selectedRunes.map((r, idx) => ({
                        id: r.id,
                        name: r.name,
                        suitSymbol: r.symbol,
                        themeColor: deck.accent,
                        isReversed: !!r.isReversed,
                        isRevealed: true,
                        positionName: selectedSpread.positions[idx] || `${idx + 1}. Taş`,
                        flipAnim: new Animated.Value(1),
                        dealAnim: new Animated.Value(1),
                      }));
                      setDrawnCards(drawn);
                      setPhase('table');
                    }}
                    onInspectRune={(rune, label) => {
                      setInspectedCard({
                        id: rune.id,
                        name: rune.name,
                        suitSymbol: rune.symbol,
                        themeColor: deck.accent,
                        isReversed: !!rune.isReversed,
                        positionName: label,
                        isRevealed: true,
                        flipAnim: new Animated.Value(1),
                        dealAnim: new Animated.Value(1),
                      });
                    }}
                  />
                ) : (
                  <>
                    {/* Hızlı Otomatik Seçim Butonu */}
                    {((readingMode === 'relationship' && relTurn !== 'transition' && relTurn !== 'completed') || (readingMode === 'self' && drawnCards.length < selectedSpread.cardCount)) && (
                      <Pressable
                        onPress={handleAutoPickRemaining}
                        style={[styles.autoPickBtn, { borderColor: deck.accent }]}
                      >
                        <Ionicons name="sparkles" size={16} color={deck.accent} />
                        <Text style={[styles.autoPickBtnText, { color: deck.accent }]}>
                          {readingMode === 'relationship'
                            ? relTurn === 'p1'
                              ? `${p1Name.trim() || '1. Kişi'} İçin Kalan Kartları Rastgele Çek 🎲`
                              : relTurn === 'p2'
                              ? `${p2Name.trim() || '2. Kişi'} İçin Kalan Kartları Rastgele Çek 🎲`
                              : 'Köprü Kartını Rastgele Çek 🎲'
                            : `Kalan ${selectedSpread.cardCount - drawnCards.length} ${deck.id === 'rune' ? 'Taşı' : 'Kartı'} Rastgele Çek 🎲`}
                        </Text>
                      </Pressable>
                    )}

                    {/* 1. DİZİLİM: BÜYÜK MASA IZGARASI (GENİŞ VE FERAH DÜZEN) */}
                    {selectedLayout === 'fullgrid' && (
                      <View style={styles.fullGridBoard}>
                        <Text style={styles.fullGridNotice}>
                          {deck.id === 'rune'
                            ? 'Kutsal taşlar döküm bezine dizildi, hissettiğin taşa dokun:'
                            : 'Kartlar geniş masaya dizildi, hissettiğine dokun:'}
                        </Text>
                        <View style={styles.fullGridWrap}>
                          {deckPool.map((item, index) => {
                            const cardsPerPerson =
                              readingMode === 'relationship'
                                ? selectedSpread.id === 'rel_cosmic_20'
                                  ? 10
                                  : selectedSpread.id === 'rel_mirror_10'
                                  ? 5
                                  : 3
                                : selectedSpread.cardCount;

                            const isPicked =
                              readingMode === 'relationship'
                                ? p1DrawnCards.some((d) => d.id === item.id) ||
                                  p2DrawnCards.some((d) => d.id === item.id) ||
                                  bridgeDrawnCard?.id === item.id
                                : drawnCards.some((d) => d.id === item.id);

                            const isDisabled =
                              isPicked ||
                              (readingMode === 'relationship'
                                ? relTurn === 'transition' ||
                                  (relTurn === 'p1' && p1DrawnCards.length >= cardsPerPerson) ||
                                  (relTurn === 'p2' && p2DrawnCards.length >= cardsPerPerson) ||
                                  (relTurn === 'bridge' && bridgeDrawnCard !== null)
                                : drawnCards.length >= selectedSpread.cardCount);

                            return (
                              <Pressable
                                key={`${item.id}-${index}`}
                                disabled={isDisabled}
                                onPress={() => handlePickCard(item)}
                                style={[
                                  styles.fullGridCardTile,
                                  deck.id === 'rune' && { backgroundColor: 'transparent', borderWidth: 0 },
                                  isPicked && styles.fullGridTilePicked,
                                  { borderColor: isPicked ? GOLD : 'rgba(255, 201, 60, 0.3)' },
                                ]}
                              >
                                <Image source={deck.cardBackImage} style={styles.fullGridTileImg} resizeMode="contain" />
                                {isPicked && (
                                  <View style={styles.fullGridOverlay}>
                                    <Ionicons name="checkmark" size={12} color={GOLD} />
                                  </View>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* 2. DİZİLİM: KLASİK MASA IZGARASI (GRID) */}
                    {selectedLayout === 'grid' && (
                      <View style={styles.classicGridWrap}>
                        {deckPool.map((item, index) => {
                          const cardsPerPerson =
                            readingMode === 'relationship'
                              ? selectedSpread.id === 'rel_cosmic_20'
                                ? 10
                                : selectedSpread.id === 'rel_mirror_10'
                                ? 5
                                : 3
                              : selectedSpread.cardCount;

                          const isPicked =
                            readingMode === 'relationship'
                              ? p1DrawnCards.some((d) => d.id === item.id) ||
                                p2DrawnCards.some((d) => d.id === item.id) ||
                                bridgeDrawnCard?.id === item.id
                              : drawnCards.some((d) => d.id === item.id);

                          const isDisabled =
                            isPicked ||
                            (readingMode === 'relationship'
                              ? relTurn === 'transition' ||
                                (relTurn === 'p1' && p1DrawnCards.length >= cardsPerPerson) ||
                                (relTurn === 'p2' && p2DrawnCards.length >= cardsPerPerson) ||
                                (relTurn === 'bridge' && bridgeDrawnCard !== null)
                              : drawnCards.length >= selectedSpread.cardCount);

                          return (
                            <Pressable
                              key={`${item.id}-${index}`}
                              disabled={isDisabled}
                              onPress={() => handlePickCard(item)}
                              style={[
                                styles.classicGridCard,
                                deck.id === 'rune' && { backgroundColor: 'transparent', borderWidth: 0 },
                                isPicked && styles.fanCardPicked,
                              ]}
                            >
                              <Image source={deck.cardBackImage} style={styles.fanCardImg} resizeMode="contain" />
                              <View style={styles.fanCardIndexBadge}>
                                <Text style={styles.fanCardIndexText}>{index + 1}</Text>
                              </View>
                              {isPicked && (
                                <View style={styles.fanCardOverlay}>
                                  <Ionicons name="checkmark-circle" size={24} color={GOLD} />
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}

                    {/* 3. DİZİLİM: DALGA ŞEKLİ DİZİLİM & ÇEMBER (FAN & RADIAL) */}
                    {(selectedLayout === 'fan' || selectedLayout === 'radial') && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cardFanScroll}
                      >
                        {deckPool.map((item, index) => {
                          const cardsPerPerson =
                            readingMode === 'relationship'
                              ? selectedSpread.id === 'rel_cosmic_20'
                                ? 10
                                : selectedSpread.id === 'rel_mirror_10'
                                ? 5
                                : 3
                              : selectedSpread.cardCount;

                          const isPicked =
                            readingMode === 'relationship'
                              ? p1DrawnCards.some((d) => d.id === item.id) ||
                                p2DrawnCards.some((d) => d.id === item.id) ||
                                bridgeDrawnCard?.id === item.id
                              : drawnCards.some((d) => d.id === item.id);

                          const isDisabled =
                            isPicked ||
                            (readingMode === 'relationship'
                              ? relTurn === 'transition' ||
                                (relTurn === 'p1' && p1DrawnCards.length >= cardsPerPerson) ||
                                (relTurn === 'p2' && p2DrawnCards.length >= cardsPerPerson) ||
                                (relTurn === 'bridge' && bridgeDrawnCard !== null)
                              : drawnCards.length >= selectedSpread.cardCount);

                          // Otantik Sinüzoidal Dalga Eğrisi Hesaplaması (Tarot Dalgası)
                          const WAVE_PERIOD_CARDS = 10;
                          const FREQUENCY = (2 * Math.PI) / WAVE_PERIOD_CARDS;
                          const MAX_ANGLE = 16;
                          const MAX_RISE = 22;

                          const wavePhase = index * FREQUENCY;
                          const angle = Math.sin(wavePhase) * MAX_ANGLE;
                          const rise = -Math.cos(wavePhase) * MAX_RISE;

                          return (
                            <Pressable
                              key={`${item.id}-${index}`}
                              disabled={isDisabled}
                              onPress={() => handlePickCard(item)}
                              style={({ pressed }) => [
                                styles.fanCard,
                                deck.id === 'rune' && { backgroundColor: 'transparent', borderWidth: 0 },
                                selectedLayout === 'fan' && {
                                  transform: [{ translateY: rise }, { rotate: `${angle}deg` }],
                                  marginLeft: index === 0 ? 12 : -22,
                                  zIndex: index + 1,
                                },
                                isPicked && styles.fanCardPicked,
                                pressed && styles.fanCardPressed,
                              ]}
                            >
                              <Image source={deck.cardBackImage} style={styles.fanCardImg} resizeMode="contain" />
                              <View style={styles.fanCardIndexBadge}>
                                <Text style={styles.fanCardIndexText}>{index + 1}</Text>
                              </View>
                              {isPicked && (
                                <View style={styles.fanCardOverlay}>
                                  <Ionicons name="checkmark-circle" size={28} color={GOLD} />
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* PHASE 3: MASADAKİ DİZİLİM & ETKİLEŞİMLİ RİTÜEL MASASI (TABLE VIEW) */}
        {phase === 'table' && (
          <View style={styles.tableContainer}>
            {/* Üst Bilgilendirme ve Masadaki Dizilimi Gör Butonu */}
            <View style={styles.tableBannerRow}>
              <View style={styles.tableBannerLeft}>
                <MaterialCommunityIcons
                  name={isAllPlaced ? 'star-face' : 'cards-playing-outline'}
                  size={18}
                  color={deck.accent}
                />
                <Text style={[styles.tableBannerText, { color: deck.accent }]}>
                  {isAllPlaced
                    ? '✨ Kartlara dokunarak derin anlamları inceleyin'
                    : '👇 Sıradaki karta dokunarak masaya tek tek dizin'}
                </Text>
              </View>

              <View style={styles.tableBannerButtonsRow}>
                {/* 🎴 Masadaki Dizilimi Gör Butonu */}
                <Pressable
                  onPress={() => setShowRitualSpread(true)}
                  style={[styles.seeSpreadAnimationBtn, { borderColor: GOLD }]}
                >
                  <MaterialCommunityIcons name="movie-play-outline" size={13} color={GOLD} />
                  <Text style={styles.seeSpreadAnimationBtnText}>Dizilimi Gör</Text>
                </Pressable>
              </View>
            </View>

            {/* 1. MASA ALANI (RİTÜEL ÇUHASI ÜZERİNDE GEOMETRİK DİZİLİM) */}
            {readingMode === 'relationship' ? (
              <View style={styles.pistiTableWrapper}>
                <CornerTicks />
                <LinearGradient
                  colors={['#0F3822', '#0A2617', '#04130A']}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                />

                {/* --- ÜST BÖLÜM: 2. KİŞİ (PARTNER) MASASI --- */}
                <View style={styles.pistiPlayerSection}>
                  <View style={styles.pistiPlayerBadgeTop}>
                    <View style={[styles.pistiAvatarCircle, { borderColor: p2Color }]}>
                      <MaterialCommunityIcons name={p2GenderIcon as any} size={22} color={p2Color} />
                    </View>
                    <View style={styles.pistiPlayerInfo}>
                      <Text style={[styles.pistiPlayerName, { color: p2Color }]} numberOfLines={1}>
                        {p2Name.trim() || (isPartnersSwapped ? '2. Kişi (Erkek)' : '2. Kişi (Partner)')}
                      </Text>
                      <Text style={styles.pistiPlayerRole}>
                        {isPartnersSwapped ? 'Partner (Erkek / Karşı Taraf)' : 'Partner (Kadın / Karşı Taraf)'}
                      </Text>
                    </View>
                    <View style={[styles.pistiScoreChip, { backgroundColor: p2Color + '25' }]}>
                      <Text style={[styles.pistiScoreChipText, { color: p2Color }]}>{p2PlacedCount} / {p2DrawnCards.length} Kart</Text>
                    </View>
                  </View>

                  {/* 20 KARTLIK (10+10) İSE: PARTNER KELT HAÇI GEOMETRİSİ */}
                  {selectedSpread.id === 'rel_cosmic_20' ? (
                    <View style={styles.celticCrossBoard}>
                      <View style={styles.celticCrossLeft}>
                        {/* Kart 5: Taç / Olası Gelecek (Üst) */}
                        <RitualSlotItem
                          card={p2DrawnCards[4]}
                          index={4}
                          isPlaced={p2PlacedCount > 4}
                          isNext={p2PlacedCount === 4}
                          positionName={selectedSpread.positions[4]}
                          deck={deck}
                          onPress={() => p2DrawnCards[4] && setInspectedCard(p2DrawnCards[4])}
                        />
                        {/* Orta Satır: Kart 4 (Sol), Kart 1 & Kart 2 (Merkez Çapraz), Kart 6 (Sağ) */}
                        <View style={styles.celticCrossMidRow}>
                          <RitualSlotItem
                            card={p2DrawnCards[3]}
                            index={3}
                            isPlaced={p2PlacedCount > 3}
                            isNext={p2PlacedCount === 3}
                            positionName={selectedSpread.positions[3]}
                            deck={deck}
                            onPress={() => p2DrawnCards[3] && setInspectedCard(p2DrawnCards[3])}
                          />
                          {/* Merkezde Kart 1 ve Üzerine Çapraz 90 Derece Kapanan Kart 2 (Yalnızca yerleştiğinde) */}
                          <View style={styles.celticCenterStack}>
                            <RitualSlotItem
                              card={p2DrawnCards[0]}
                              index={0}
                              isPlaced={p2PlacedCount > 0}
                              isNext={p2PlacedCount === 0}
                              positionName={selectedSpread.positions[0]}
                              deck={deck}
                              onPress={() => p2DrawnCards[0] && setInspectedCard(p2DrawnCards[0])}
                            />
                            {p2PlacedCount > 1 && (
                              <View style={styles.celticCrossCardOverlay} pointerEvents="box-none">
                                <RitualSlotItem
                                  card={p2DrawnCards[1]}
                                  index={1}
                                  isPlaced={true}
                                  isNext={false}
                                  positionName={selectedSpread.positions[1]}
                                  deck={deck}
                                  isRotated={true}
                                  onPress={() => p2DrawnCards[1] && setInspectedCard(p2DrawnCards[1])}
                                />
                              </View>
                            )}
                          </View>
                          <RitualSlotItem
                            card={p2DrawnCards[5]}
                            index={5}
                            isPlaced={p2PlacedCount > 5}
                            isNext={p2PlacedCount === 5}
                            positionName={selectedSpread.positions[5]}
                            deck={deck}
                            onPress={() => p2DrawnCards[5] && setInspectedCard(p2DrawnCards[5])}
                          />
                        </View>
                        {/* Kart 3: Bilinçaltı & Kök Temel (Alt) */}
                        <RitualSlotItem
                          card={p2DrawnCards[2]}
                          index={2}
                          isPlaced={p2PlacedCount > 2}
                          isNext={p2PlacedCount === 2}
                          positionName={selectedSpread.positions[2]}
                          deck={deck}
                          onPress={() => p2DrawnCards[2] && setInspectedCard(p2DrawnCards[2])}
                        />
                        {/* 2. Kartın Bekleme Yuvası (3. Kartın Altında Yan Durur, Yerleşene Kadar) */}
                        {p2PlacedCount < 2 && (
                          <View style={styles.celticCrossWaitingSlotWrap}>
                            <RitualSlotItem
                              card={p2DrawnCards[1]}
                              index={1}
                              isPlaced={false}
                              isNext={p2PlacedCount === 1}
                              positionName={selectedSpread.positions[1]}
                              deck={deck}
                              isRotated={true}
                              onPress={() => {}}
                            />
                          </View>
                        )}
                      </View>

                      {/* Sağ Sütun / Asa (Kart 10, 9, 8, 7) */}
                      <View style={styles.celticStaffColumn}>
                        {[9, 8, 7, 6].map((slotIdx) => (
                          <RitualSlotItem
                            key={`p2-staff-${slotIdx}`}
                            card={p2DrawnCards[slotIdx]}
                            index={slotIdx}
                            isPlaced={p2PlacedCount > slotIdx}
                            isNext={p2PlacedCount === slotIdx}
                            positionName={selectedSpread.positions[slotIdx]}
                            deck={deck}
                            onPress={() => p2DrawnCards[slotIdx] && setInspectedCard(p2DrawnCards[slotIdx])}
                          />
                        ))}
                      </View>
                    </View>
                  ) : selectedSpread.id === 'rel_mirror_10' ? (
                    <View style={styles.fiveCrossBoard}>
                      <RitualSlotItem
                        card={p2DrawnCards[1]}
                        index={1}
                        isPlaced={p2PlacedCount > 1}
                        isNext={p2PlacedCount === 1}
                        positionName={selectedSpread.positions[1]}
                        deck={deck}
                        onPress={() => p2DrawnCards[1] && setInspectedCard(p2DrawnCards[1])}
                      />
                      <View style={styles.fiveCrossMidRow}>
                        <RitualSlotItem
                          card={p2DrawnCards[2]}
                          index={2}
                          isPlaced={p2PlacedCount > 2}
                          isNext={p2PlacedCount === 2}
                          positionName={selectedSpread.positions[2]}
                          deck={deck}
                          onPress={() => p2DrawnCards[2] && setInspectedCard(p2DrawnCards[2])}
                        />
                        <RitualSlotItem
                          card={p2DrawnCards[0]}
                          index={0}
                          isPlaced={p2PlacedCount > 0}
                          isNext={p2PlacedCount === 0}
                          positionName={selectedSpread.positions[0]}
                          deck={deck}
                          onPress={() => p2DrawnCards[0] && setInspectedCard(p2DrawnCards[0])}
                        />
                        <RitualSlotItem
                          card={p2DrawnCards[3]}
                          index={3}
                          isPlaced={p2PlacedCount > 3}
                          isNext={p2PlacedCount === 3}
                          positionName={selectedSpread.positions[3]}
                          deck={deck}
                          onPress={() => p2DrawnCards[3] && setInspectedCard(p2DrawnCards[3])}
                        />
                      </View>
                      <RitualSlotItem
                        card={p2DrawnCards[4]}
                        index={4}
                        isPlaced={p2PlacedCount > 4}
                        isNext={p2PlacedCount === 4}
                        positionName={selectedSpread.positions[4]}
                        deck={deck}
                        onPress={() => p2DrawnCards[4] && setInspectedCard(p2DrawnCards[4])}
                      />
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pistiCardsHandRow}>
                      {p2DrawnCards.map((card, idx) => (
                        <RitualSlotItem
                          key={`p2-hand-${idx}`}
                          card={card}
                          index={idx}
                          isPlaced={p2PlacedCount > idx}
                          isNext={p2PlacedCount === idx}
                          positionName={selectedSpread.positions[idx]}
                          deck={deck}
                          onPress={() => setInspectedCard(card)}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 💖 2. KİŞİ (PARTNER) KART DOCK'U — MASANIN ORTASINDA */}
                <View style={styles.personDockMiddleContainer}>
                  <View style={styles.dockHeaderRow}>
                    <View style={styles.dockHeaderLeft}>
                      <MaterialCommunityIcons name="cards-playing" size={15} color="#F43F5E" />
                      <Text style={[styles.dockCounterText, { color: '#F43F5E' }]}>
                        {p2Name.trim() || '2. Kişi'}: {p2PlacedCount} / {p2DrawnCards.length} Kart Masada
                      </Text>
                    </View>

                    <View style={styles.dockActionsRight}>
                      {p2PlacedCount < p2DrawnCards.length && (
                        <Pressable
                          onPress={() => placeAllPersonCards('p2')}
                          style={[styles.dockQuickBtn, { backgroundColor: '#F43F5E' }]}
                        >
                          <Ionicons name="flash" size={11} color="#FFFFFF" />
                          <Text style={[styles.dockQuickBtnText, { color: '#FFFFFF' }]}>Hepsini Diz</Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={() => resetPersonCards('p2')}
                        style={[styles.dockQuickBtnAlt, { borderColor: '#F43F5E' + '66' }]}
                      >
                        <Ionicons name="refresh" size={11} color="#F43F5E" />
                        <Text style={[styles.dockQuickBtnTextAlt, { color: '#F43F5E' }]}>Yeniden Diz</Text>
                      </Pressable>
                    </View>
                  </View>

                  <ScrollView
                    ref={p2DockScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dockCardsScroll}
                  >
                    {p2DrawnCards.map((card, idx) => {
                      const isPlaced = idx < p2PlacedCount;
                      const isCurrent = idx === p2PlacedCount;
                      const isLocked = idx > p2PlacedCount;

                      return (
                        <Pressable
                          key={`dock-p2-${card.id}-${idx}`}
                          disabled={!isCurrent}
                          onPress={() => placeNextRelationshipCard('p2', idx)}
                          style={({ pressed }) => [
                            styles.dockCardItem,
                            isCurrent && [styles.dockCardCurrent, { borderColor: '#F43F5E' }],
                            isPlaced && styles.dockCardPlaced,
                            isLocked && styles.dockCardLocked,
                            pressed && isCurrent && styles.dockCardPressed,
                          ]}
                        >
                          {isPlaced ? (
                            <View style={styles.dockCardPlacedInner}>
                              <Image source={card.image || deck.cardBackImage} style={styles.dockCardThumbImg} resizeMode="cover" />
                              <View style={[styles.dockPlacedCheckBadge, { backgroundColor: '#F43F5E' }]}>
                                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                              </View>
                              <Text style={styles.dockPlacedIndexText}>#{idx + 1}</Text>
                            </View>
                          ) : isCurrent ? (
                            <View style={styles.dockCardActiveInner}>
                              <LinearGradient
                                colors={['rgba(244, 63, 94, 0.45)', 'rgba(244, 63, 94, 0.15)']}
                                style={StyleSheet.absoluteFillObject}
                              />
                              <Image source={deck.cardBackImage} style={styles.dockCardThumbImg} resizeMode="cover" />
                              <View style={[styles.dockActiveGlowTag, { backgroundColor: '#F43F5E' }]}>
                                <Text style={[styles.dockActiveGlowTagText, { color: '#FFFFFF' }]}>DOKUN</Text>
                              </View>
                              <Text style={[styles.dockActivePosText, { color: '#F43F5E' }]} numberOfLines={1}>
                                {card.positionName?.split('-').pop()?.trim() || `${idx + 1}. Kart`}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.dockCardLockedInner}>
                              <Image source={deck.cardBackImage} style={[styles.dockCardThumbImg, { opacity: 0.45 }]} resizeMode="cover" />
                              <Text style={styles.dockLockedIndexText}>#{idx + 1}</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* --- ORTA BÖLÜM: MASA MERKEZİ & KÖPRÜ (REZONANS HATTI) --- */}
                <View style={styles.pistiTableCenter}>
                  <View style={styles.pistiCenterWatermarkRow}>
                    <View style={styles.pistiWatermarkLine} />
                    <View style={styles.pistiWatermarkBadge}>
                      <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={14} color={GOLD} />
                      <Text style={styles.pistiWatermarkText}>KADERSEL REZONANS EKSENİ</Text>
                      <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={14} color={GOLD} />
                    </View>
                    <View style={styles.pistiWatermarkLine} />
                  </View>

                  {bridgeDrawnCard && (
                    <View style={styles.bridgeCardSlotWrapper}>
                      <RitualSlotItem
                        card={bridgeDrawnCard}
                        index={p1DrawnCards.length + p2DrawnCards.length}
                        badgeText="Köprü"
                        isPlaced={isBridgePlaced}
                        isNext={!isBridgePlaced}
                        positionName="Ortak Kadersel Köprü"
                        deck={deck}
                        onPress={() => {
                          if (!isBridgePlaced) {
                            placeNextRelationshipCard('bridge');
                          } else {
                            setInspectedCard(bridgeDrawnCard);
                          }
                        }}
                      />
                      {!isBridgePlaced && (
                        <Pressable
                          onPress={() => placeNextRelationshipCard('bridge')}
                          style={({ pressed }) => [
                            styles.bridgeDirectDokunBtn,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            style={styles.bridgeDirectDokunGradient}
                          >
                            <Ionicons name="sparkles" size={13} color="#0B0612" />
                            <Text style={styles.bridgeDirectDokunText}>7. Köprüyü Diz (DOKUN)</Text>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {/* --- ALT BÖLÜM: 1. KİŞİ (DANIŞAN / SEN) MASASI --- */}
                <View style={styles.pistiPlayerSection}>
                  {selectedSpread.id === 'rel_cosmic_20' ? (
                    <View style={styles.celticCrossBoard}>
                      <View style={styles.celticCrossLeft}>
                        {/* Kart 5: Taç / Olası Gelecek (Üst) */}
                        <RitualSlotItem
                          card={p1DrawnCards[4]}
                          index={4}
                          isPlaced={p1PlacedCount > 4}
                          isNext={p1PlacedCount === 4}
                          positionName={selectedSpread.positions[4]}
                          deck={deck}
                          onPress={() => p1DrawnCards[4] && setInspectedCard(p1DrawnCards[4])}
                        />
                        {/* Orta Satır: Kart 4 (Sol), Kart 1 & Kart 2 (Merkez Çapraz), Kart 6 (Sağ) */}
                        <View style={styles.celticCrossMidRow}>
                          <RitualSlotItem
                            card={p1DrawnCards[3]}
                            index={3}
                            isPlaced={p1PlacedCount > 3}
                            isNext={p1PlacedCount === 3}
                            positionName={selectedSpread.positions[3]}
                            deck={deck}
                            onPress={() => p1DrawnCards[3] && setInspectedCard(p1DrawnCards[3])}
                          />
                          {/* Merkezde Kart 1 ve Üzerine Çapraz 90 Derece Kapanan Kart 2 (Yalnızca yerleştiğinde) */}
                          <View style={styles.celticCenterStack}>
                            <RitualSlotItem
                              card={p1DrawnCards[0]}
                              index={0}
                              isPlaced={p1PlacedCount > 0}
                              isNext={p1PlacedCount === 0}
                              positionName={selectedSpread.positions[0]}
                              deck={deck}
                              onPress={() => p1DrawnCards[0] && setInspectedCard(p1DrawnCards[0])}
                            />
                            {p1PlacedCount > 1 && (
                              <View style={styles.celticCrossCardOverlay} pointerEvents="box-none">
                                <RitualSlotItem
                                  card={p1DrawnCards[1]}
                                  index={1}
                                  isPlaced={true}
                                  isNext={false}
                                  positionName={selectedSpread.positions[1]}
                                  deck={deck}
                                  isRotated={true}
                                  onPress={() => p1DrawnCards[1] && setInspectedCard(p1DrawnCards[1])}
                                />
                              </View>
                            )}
                          </View>
                          <RitualSlotItem
                            card={p1DrawnCards[5]}
                            index={5}
                            isPlaced={p1PlacedCount > 5}
                            isNext={p1PlacedCount === 5}
                            positionName={selectedSpread.positions[5]}
                            deck={deck}
                            onPress={() => p1DrawnCards[5] && setInspectedCard(p1DrawnCards[5])}
                          />
                        </View>
                        {/* Kart 3: Bilinçaltı & Kök Temel (Alt) */}
                        <RitualSlotItem
                          card={p1DrawnCards[2]}
                          index={2}
                          isPlaced={p1PlacedCount > 2}
                          isNext={p1PlacedCount === 2}
                          positionName={selectedSpread.positions[2]}
                          deck={deck}
                          onPress={() => p1DrawnCards[2] && setInspectedCard(p1DrawnCards[2])}
                        />
                        {/* 2. Kartın Bekleme Yuvası (3. Kartın Altında Yan Durur, Yerleşene Kadar) */}
                        {p1PlacedCount < 2 && (
                          <View style={styles.celticCrossWaitingSlotWrap}>
                            <RitualSlotItem
                              card={p1DrawnCards[1]}
                              index={1}
                              isPlaced={false}
                              isNext={p1PlacedCount === 1}
                              positionName={selectedSpread.positions[1]}
                              deck={deck}
                              isRotated={true}
                              onPress={() => {}}
                            />
                          </View>
                        )}
                      </View>

                      {/* Sağ Sütun / Asa (Kart 10, 9, 8, 7) */}
                      <View style={styles.celticStaffColumn}>
                        {[9, 8, 7, 6].map((slotIdx) => (
                          <RitualSlotItem
                            key={`p1-staff-${slotIdx}`}
                            card={p1DrawnCards[slotIdx]}
                            index={slotIdx}
                            isPlaced={p1PlacedCount > slotIdx}
                            isNext={p1PlacedCount === slotIdx}
                            positionName={selectedSpread.positions[slotIdx]}
                            deck={deck}
                            onPress={() => p1DrawnCards[slotIdx] && setInspectedCard(p1DrawnCards[slotIdx])}
                          />
                        ))}
                      </View>
                    </View>
                  ) : selectedSpread.id === 'rel_mirror_10' ? (
                    <View style={styles.fiveCrossBoard}>
                      <RitualSlotItem
                        card={p1DrawnCards[1]}
                        index={1}
                        isPlaced={p1PlacedCount > 1}
                        isNext={p1PlacedCount === 1}
                        positionName={selectedSpread.positions[1]}
                        deck={deck}
                        onPress={() => p1DrawnCards[1] && setInspectedCard(p1DrawnCards[1])}
                      />
                      <View style={styles.fiveCrossMidRow}>
                        <RitualSlotItem
                          card={p1DrawnCards[2]}
                          index={2}
                          isPlaced={p1PlacedCount > 2}
                          isNext={p1PlacedCount === 2}
                          positionName={selectedSpread.positions[2]}
                          deck={deck}
                          onPress={() => p1DrawnCards[2] && setInspectedCard(p1DrawnCards[2])}
                        />
                        <RitualSlotItem
                          card={p1DrawnCards[0]}
                          index={0}
                          isPlaced={p1PlacedCount > 0}
                          isNext={p1PlacedCount === 0}
                          positionName={selectedSpread.positions[0]}
                          deck={deck}
                          onPress={() => p1DrawnCards[0] && setInspectedCard(p1DrawnCards[0])}
                        />
                        <RitualSlotItem
                          card={p1DrawnCards[3]}
                          index={3}
                          isPlaced={p1PlacedCount > 3}
                          isNext={p1PlacedCount === 3}
                          positionName={selectedSpread.positions[3]}
                          deck={deck}
                          onPress={() => p1DrawnCards[3] && setInspectedCard(p1DrawnCards[3])}
                        />
                      </View>
                      <RitualSlotItem
                        card={p1DrawnCards[4]}
                        index={4}
                        isPlaced={p1PlacedCount > 4}
                        isNext={p1PlacedCount === 4}
                        positionName={selectedSpread.positions[4]}
                        deck={deck}
                        onPress={() => p1DrawnCards[4] && setInspectedCard(p1DrawnCards[4])}
                      />
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pistiCardsHandRow}>
                      {p1DrawnCards.map((card, idx) => (
                        <RitualSlotItem
                          key={`p1-hand-${idx}`}
                          card={card}
                          index={idx}
                          isPlaced={p1PlacedCount > idx}
                          isNext={p1PlacedCount === idx}
                          positionName={selectedSpread.positions[idx]}
                          deck={deck}
                          onPress={() => setInspectedCard(card)}
                        />
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.pistiPlayerBadgeBottom}>
                    <View style={[styles.pistiAvatarCircle, { borderColor: p1Color }]}>
                      <MaterialCommunityIcons name={p1GenderIcon as any} size={22} color={p1Color} />
                    </View>
                    <View style={styles.pistiPlayerInfo}>
                      <Text style={[styles.pistiPlayerName, { color: p1Color }]} numberOfLines={1}>
                        {p1Name.trim() || (isPartnersSwapped ? '1. Kişi (Kadın)' : '1. Kişi (Sen)')}
                      </Text>
                      <Text style={styles.pistiPlayerRole}>
                        {isPartnersSwapped ? 'Danışan (Kadın / Sen)' : 'Danışan (Erkek / Sen)'}
                      </Text>
                    </View>
                    <View style={[styles.pistiScoreChip, { backgroundColor: p1Color + '25' }]}>
                      <Text style={[styles.pistiScoreChipText, { color: p1Color }]}>{p1PlacedCount} / {p1DrawnCards.length} Kart</Text>
                    </View>
                  </View>
                </View>

                {/* 👤 1. KİŞİ (DANIŞAN) KART DOCK'U — EN ALTTAN DİZİLİM */}
                <View style={styles.personDockBottomContainer}>
                  <View style={styles.dockHeaderRow}>
                    <View style={styles.dockHeaderLeft}>
                      <MaterialCommunityIcons name="cards-playing" size={15} color="#38BDF8" />
                      <Text style={[styles.dockCounterText, { color: '#38BDF8' }]}>
                        {p1Name.trim() || '1. Kişi'}: {p1PlacedCount} / {p1DrawnCards.length} Kart Masada
                      </Text>
                    </View>

                    <View style={styles.dockActionsRight}>
                      {p1PlacedCount < p1DrawnCards.length && (
                        <Pressable
                          onPress={() => placeAllPersonCards('p1')}
                          style={[styles.dockQuickBtn, { backgroundColor: '#38BDF8' }]}
                        >
                          <Ionicons name="flash" size={11} color="#000000" />
                          <Text style={[styles.dockQuickBtnText, { color: '#000000' }]}>Hepsini Diz</Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={() => resetPersonCards('p1')}
                        style={[styles.dockQuickBtnAlt, { borderColor: '#38BDF8' + '66' }]}
                      >
                        <Ionicons name="refresh" size={11} color="#38BDF8" />
                        <Text style={[styles.dockQuickBtnTextAlt, { color: '#38BDF8' }]}>Yeniden Diz</Text>
                      </Pressable>
                    </View>
                  </View>

                  <ScrollView
                    ref={p1DockScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dockCardsScroll}
                  >
                    {p1DrawnCards.map((card, idx) => {
                      const isPlaced = idx < p1PlacedCount;
                      const isCurrent = idx === p1PlacedCount;
                      const isLocked = idx > p1PlacedCount;

                      return (
                        <Pressable
                          key={`dock-p1-${card.id}-${idx}`}
                          disabled={!isCurrent}
                          onPress={() => placeNextRelationshipCard('p1', idx)}
                          style={({ pressed }) => [
                            styles.dockCardItem,
                            isCurrent && [styles.dockCardCurrent, { borderColor: '#38BDF8' }],
                            isPlaced && styles.dockCardPlaced,
                            isLocked && styles.dockCardLocked,
                            pressed && isCurrent && styles.dockCardPressed,
                          ]}
                        >
                          {isPlaced ? (
                            <View style={styles.dockCardPlacedInner}>
                              <Image source={card.image || deck.cardBackImage} style={styles.dockCardThumbImg} resizeMode="cover" />
                              <View style={[styles.dockPlacedCheckBadge, { backgroundColor: '#38BDF8' }]}>
                                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                              </View>
                              <Text style={styles.dockPlacedIndexText}>#{idx + 1}</Text>
                            </View>
                          ) : isCurrent ? (
                            <View style={styles.dockCardActiveInner}>
                              <LinearGradient
                                colors={['rgba(56, 189, 248, 0.45)', 'rgba(56, 189, 248, 0.15)']}
                                style={StyleSheet.absoluteFillObject}
                              />
                              <Image source={deck.cardBackImage} style={styles.dockCardThumbImg} resizeMode="cover" />
                              <View style={[styles.dockActiveGlowTag, { backgroundColor: '#38BDF8' }]}>
                                <Text style={[styles.dockActiveGlowTagText, { color: '#000000' }]}>DOKUN</Text>
                              </View>
                              <Text style={[styles.dockActivePosText, { color: '#38BDF8' }]} numberOfLines={1}>
                                {card.positionName?.split('-').pop()?.trim() || `${idx + 1}. Kart`}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.dockCardLockedInner}>
                              <Image source={deck.cardBackImage} style={[styles.dockCardThumbImg, { opacity: 0.45 }]} resizeMode="cover" />
                              <Text style={styles.dockLockedIndexText}>#{idx + 1}</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            ) : (
              /* BİREYSEL MASA ÖRTÜSÜ & YERLEŞİM GEOMETRİSİ */
              <View style={styles.altarClothBoard}>
                {drawnCards.length === 10 ? (
                  <View style={styles.celticCrossBoard}>
                    <View style={styles.celticCrossLeft}>
                      {/* Kart 5: Taç / Olası Gelecek (Üst) */}
                      <RitualSlotItem
                        card={drawnCards[4]}
                        index={4}
                        isPlaced={placedCount > 4}
                        isNext={placedCount === 4}
                        positionName={selectedSpread.positions[4]}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[4])}
                      />
                      {/* Orta Satır: Kart 4 (Sol), Kart 1 & Kart 2 (Merkez Çapraz), Kart 6 (Sağ) */}
                      <View style={styles.celticCrossMidRow}>
                        <RitualSlotItem
                          card={drawnCards[3]}
                          index={3}
                          isPlaced={placedCount > 3}
                          isNext={placedCount === 3}
                          positionName={selectedSpread.positions[3]}
                          deck={deck}
                          onPress={() => setInspectedCard(drawnCards[3])}
                        />
                        {/* Merkezde Kart 1 ve Üzerine Çapraz 90 Derece Kapanan Kart 2 (Yalnızca yerleştiğinde) */}
                        <View style={styles.celticCenterStack}>
                          <RitualSlotItem
                            card={drawnCards[0]}
                            index={0}
                            isPlaced={placedCount > 0}
                            isNext={placedCount === 0}
                            positionName={selectedSpread.positions[0]}
                            deck={deck}
                            onPress={() => setInspectedCard(drawnCards[0])}
                          />
                          {placedCount > 1 && (
                            <View style={styles.celticCrossCardOverlay} pointerEvents="box-none">
                              <RitualSlotItem
                                card={drawnCards[1]}
                                index={1}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[1]}
                                deck={deck}
                                isRotated={true}
                                onPress={() => setInspectedCard(drawnCards[1])}
                              />
                            </View>
                          )}
                        </View>
                        <RitualSlotItem
                          card={drawnCards[5]}
                          index={5}
                          isPlaced={placedCount > 5}
                          isNext={placedCount === 5}
                          positionName={selectedSpread.positions[5]}
                          deck={deck}
                          onPress={() => setInspectedCard(drawnCards[5])}
                        />
                      </View>
                      {/* Kart 3: Bilinçaltı & Kök Temel (Alt) */}
                      <RitualSlotItem
                        card={drawnCards[2]}
                        index={2}
                        isPlaced={placedCount > 2}
                        isNext={placedCount === 2}
                        positionName={selectedSpread.positions[2]}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[2])}
                      />
                      {/* 2. Kartın Bekleme Yuvası (3. Kartın Altında Yan Durur, Yerleşene Kadar) */}
                      {placedCount < 2 && (
                        <View style={styles.celticCrossWaitingSlotWrap}>
                          <RitualSlotItem
                            card={drawnCards[1]}
                            index={1}
                            isPlaced={false}
                            isNext={placedCount === 1}
                            positionName={selectedSpread.positions[1]}
                            deck={deck}
                            isRotated={true}
                            onPress={() => {}}
                          />
                        </View>
                      )}
                    </View>

                    {/* Sağ Sütun / Asa (Kart 10, 9, 8, 7) */}
                    <View style={styles.celticStaffColumn}>
                      {[9, 8, 7, 6].map((slotIdx) => (
                        <RitualSlotItem
                          key={`staff-${slotIdx}`}
                          card={drawnCards[slotIdx]}
                          index={slotIdx}
                          isPlaced={placedCount > slotIdx}
                          isNext={placedCount === slotIdx}
                          positionName={selectedSpread.positions[slotIdx]}
                          deck={deck}
                          onPress={() => setInspectedCard(drawnCards[slotIdx])}
                        />
                      ))}
                    </View>
                  </View>
                ) : drawnCards.length === 5 ? (
                  <View style={styles.fiveCrossBoard}>
                    <RitualSlotItem card={drawnCards[1]} index={1} isPlaced={placedCount > 1} isNext={placedCount === 1} positionName={selectedSpread.positions[1]} deck={deck} onPress={() => setInspectedCard(drawnCards[1])} />
                    <View style={styles.fiveCrossMidRow}>
                      <RitualSlotItem card={drawnCards[2]} index={2} isPlaced={placedCount > 2} isNext={placedCount === 2} positionName={selectedSpread.positions[2]} deck={deck} onPress={() => setInspectedCard(drawnCards[2])} />
                      <RitualSlotItem card={drawnCards[0]} index={0} isPlaced={placedCount > 0} isNext={placedCount === 0} positionName={selectedSpread.positions[0]} deck={deck} onPress={() => setInspectedCard(drawnCards[0])} />
                      <RitualSlotItem card={drawnCards[3]} index={3} isPlaced={placedCount > 3} isNext={placedCount === 3} positionName={selectedSpread.positions[3]} deck={deck} onPress={() => setInspectedCard(drawnCards[3])} />
                    </View>
                    <RitualSlotItem card={drawnCards[4]} index={4} isPlaced={placedCount > 4} isNext={placedCount === 4} positionName={selectedSpread.positions[4]} deck={deck} onPress={() => setInspectedCard(drawnCards[4])} />
                  </View>
                ) : drawnCards.length === 7 ? (
                  <View style={styles.horseshoeRitualBoard}>
                    {drawnCards.map((card, index) => (
                      <RitualSlotItem
                        key={`horseshoe-${index}`}
                        card={card}
                        index={index}
                        isPlaced={placedCount > index}
                        isNext={placedCount === index}
                        positionName={selectedSpread.positions[index]}
                        deck={deck}
                        onPress={() => setInspectedCard(card)}
                      />
                    ))}
                  </View>
                ) : drawnCards.length === 9 ? (
                  <View style={styles.boxRitualBoard}>
                    {[0, 3, 6].map((rowStart) => (
                      <View key={`box-row-${rowStart}`} style={styles.boxRitualRow}>
                        {[0, 1, 2].map((col) => {
                          const idx = rowStart + col;
                          const card = drawnCards[idx];
                          return (
                            <RitualSlotItem
                              key={`box-${idx}`}
                              card={card}
                              index={idx}
                              isPlaced={placedCount > idx}
                              isNext={placedCount === idx}
                              positionName={selectedSpread.positions[idx]}
                              deck={deck}
                              onPress={() => setInspectedCard(card)}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.generalRitualRow}>
                    {drawnCards.map((card, index) => (
                      <RitualSlotItem
                        key={`gen-${index}`}
                        card={card}
                        index={index}
                        isPlaced={placedCount > index}
                        isNext={placedCount === index}
                        positionName={selectedSpread.positions[index]}
                        deck={deck}
                        onPress={() => setInspectedCard(card)}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 2. BİREYSEL MOD İÇİN ALT SIRALI KART DOCK / TEPSİ (MANUEL DİZİLİM ALANI) */}
            {readingMode === 'self' && (
              <View style={[styles.bottomDockContainer, { borderColor: deck.accent + '66' }]}>
                {/* Üst Durum Çubuğu & Hızlı Diz / Yeniden Diz Butonları */}
                <View style={styles.dockHeaderRow}>
                  <View style={styles.dockStatusRow}>
                    <MaterialCommunityIcons
                      name={isAllPlaced ? 'check-decagram' : 'cards-playing-outline'}
                      size={16}
                      color={isAllPlaced ? '#34D399' : GOLD}
                    />
                    <Text style={[styles.dockStatusText, isAllPlaced && { color: '#34D399' }]}>
                      {isAllPlaced
                        ? 'Tüm Kartlar Masaya Dizildi ✨'
                        : `${placedCount} / ${drawnCards.length} Kart Masada`}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {!isAllPlaced && (
                      <Pressable onPress={placeAllCards} style={[styles.quickDealBtn, { borderColor: deck.accent }]}>
                        <Ionicons name="flash" size={12} color={deck.accent} />
                        <Text style={[styles.quickDealText, { color: deck.accent }]}>Hepsini Diz</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={resetAndReDeal} style={[styles.quickDealBtn, { borderColor: GOLD_SOFT }]}>
                      <Ionicons name="refresh" size={12} color={GOLD} />
                      <Text style={[styles.quickDealText, { color: GOLD }]}>Yeniden Diz</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Kaydırılabilir Sıralı Kart Tepsisi */}
                <ScrollView
                  ref={bottomDockRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dockCardsScroll}
                >
                  {drawnCards.map((card, idx) => {
                    const isPlaced = idx < placedCount;
                    const isCurrent = idx === placedCount;
                    const isLocked = idx > placedCount;

                    return (
                      <Pressable
                        key={`dock-card-${card.id}-${idx}`}
                        disabled={!isCurrent}
                        onPress={() => {
                          if (!isCurrent) return;
                          placeNextCard(idx);
                        }}
                        style={({ pressed }) => [
                          styles.dockCardItem,
                          isCurrent && [styles.dockCardCurrent, { borderColor: deck.accent }],
                          isPlaced && styles.dockCardPlaced,
                          isLocked && styles.dockCardLocked,
                          pressed && isCurrent && styles.dockCardPressed,
                        ]}
                      >
                        {isPlaced ? (
                          <View style={styles.dockCardPlacedInner}>
                            <Image source={card.image || deck.cardBackImage} style={styles.dockCardThumbImg} resizeMode="cover" />
                            <View style={styles.dockPlacedCheckBadge}>
                              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                            </View>
                            <Text style={styles.dockPlacedIndexText}>#{idx + 1}</Text>
                          </View>
                        ) : isCurrent ? (
                          <View style={styles.dockCardActiveInner}>
                            <LinearGradient
                              colors={[deck.accent + '44', deck.accent + '11']}
                              style={StyleSheet.absoluteFillObject}
                            />
                            <Image source={deck.cardBackImage} style={styles.dockCardThumbImg} resizeMode="cover" />
                            <View style={[styles.dockActiveGlowTag, { backgroundColor: deck.accent }]}>
                              <Text style={styles.dockActiveGlowTagText}>DOKUN</Text>
                            </View>
                            <Text style={[styles.dockActivePosText, { color: deck.accent }]} numberOfLines={1}>
                              {card.positionName?.split('-').pop()?.trim() || `${idx + 1}. Kart`}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.dockCardLockedInner}>
                            <Image source={deck.cardBackImage} style={[styles.dockCardThumbImg, { opacity: 0.45 }]} resizeMode="cover" />
                            <Text style={styles.dockLockedIndexText}>#{idx + 1}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 3. A) BİREYSEL MOD: HER KARTIN BÜYÜK GÖRSELİ VE KAVRAMSAL ANLAMI (2'ŞERLİ SIRALI DİZİLİM) */}
            {readingMode === 'self' && (
              <View style={styles.individualCardsSection}>
                <View style={styles.individualHeaderBadgeWrap}>
                  <View style={[styles.individualHeaderBadge, { borderColor: deck.accent + '88' }]}>
                    <MaterialCommunityIcons name="cards-playing" size={18} color={deck.accent} />
                    <Text style={[styles.individualHeaderBadgeText, { color: deck.accent }]}>
                      AÇILAN KARTLAR VE KAVRAMSAL ANLAMLARI
                    </Text>
                  </View>
                </View>

                <View style={styles.twoColumnCardsGrid}>
                  {drawnCards.map((card, idx) => {
                    const details = getCardDetails(card.id);
                    const isReversed = card.isReversed;
                    const keywords = getTarotKeywordList(card.id, isReversed ? 'reversed' : 'upright');

                    return (
                      <Pressable
                        key={`grid-detail-${card.id}-${idx}`}
                        onPress={() => setInspectedCard(card)}
                        style={({ pressed }) => [
                          styles.gridCardItemBox,
                          { borderColor: isReversed ? '#EF444488' : deck.accent + '88' },
                          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                        ]}
                      >
                        {/* Kart Pozisyon Başlığı */}
                        <View style={[styles.gridCardPosBadge, { backgroundColor: deck.accent + '22', borderColor: deck.accent + '55' }]}>
                          <Text style={styles.gridCardPosIndex}>#{idx + 1}</Text>
                          <Text style={[styles.gridCardPosTitle, { color: deck.accent }]} numberOfLines={1}>
                            {card.positionName}
                          </Text>
                        </View>

                        {/* Büyük Kart Görseli */}
                        <View style={[styles.gridCardImageWrapper, isReversed && { transform: [{ rotate: '180deg' }] }]}>
                          {card.image ? (
                            <Image source={card.image} style={styles.gridCardRealImage} resizeMode="cover" />
                          ) : deck.id === 'rune' ? (
                            <View style={styles.gridCardPlaceholder}>
                              <RuneStoneItem
                                rune={{
                                  id: card.id,
                                  symbol: card.suitSymbol || 'ᚱ',
                                  name: card.name,
                                  isReversed: card.isReversed,
                                }}
                                size="md"
                                revealed={true}
                                isReversed={card.isReversed}
                                glowColor={deck.accent}
                              />
                            </View>
                          ) : (
                            <View style={styles.gridCardPlaceholder}>
                              <Text style={styles.gridCardPlaceholderSymbol}>{card.suitSymbol || '🔮'}</Text>
                            </View>
                          )}
                        </View>

                        {/* Kart İsmi & Düz/Ters Etiketi */}
                        <Text style={styles.gridCardName} numberOfLines={1}>{card.name}</Text>
                        <View style={[styles.gridCardOrientPill, { backgroundColor: isReversed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderColor: isReversed ? '#EF4444' : '#10B981' }]}>
                          <Text style={[styles.gridCardOrientText, { color: isReversed ? '#F87171' : '#34D399' }]}>
                            {isReversed ? '🔴 Ters Konum' : '🟢 Düz Konum'}
                          </Text>
                        </View>

                        {/* Temel Kavramsal Anlamı */}
                        <Text style={styles.gridCardConceptualText} numberOfLines={4}>
                          {isReversed ? details?.reversed : details?.upright}
                        </Text>

                        {/* Özgün Kavramsal Anahtar Kelimeler */}
                        {keywords && keywords.length > 0 && (
                          <View style={styles.gridCardKeywordsRow}>
                            {keywords.slice(0, 3).map((kw: string, kIdx: number) => (
                              <View key={`kw-${kIdx}`} style={styles.gridKeywordChip}>
                                <Text style={styles.gridKeywordChipText}>{kw}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. B) ÇİFTLER MODU: KATMAN KATMAN SENTEZ & DERİN UYUM ANALİZİ */}
            {readingMode === 'relationship' && relAnalysis && (
              <View style={styles.relSynthesisContainer}>
                {/* 🌟 GENEL UYUM SKORU KARTI */}
                <View style={[styles.scoreHeroCard, { borderColor: (relAnalysis.overallScore >= 80 ? '#10B981' : relAnalysis.overallScore >= 65 ? '#F59E0B' : '#F43F5E') + '88' }]}>
                  <CornerTicks />
                  <LinearGradient
                    colors={[(relAnalysis.overallScore >= 80 ? '#10B981' : relAnalysis.overallScore >= 65 ? '#F59E0B' : '#F43F5E') + '22', 'rgba(15, 10, 30, 0.9)']}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                  />
                  <View style={styles.scoreHeroContent}>
                    <View style={[styles.scoreCircle, { borderColor: relAnalysis.overallScore >= 80 ? '#10B981' : relAnalysis.overallScore >= 65 ? '#F59E0B' : '#F43F5E', backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                      <Text style={[styles.scorePercentText, { color: relAnalysis.overallScore >= 80 ? '#10B981' : relAnalysis.overallScore >= 65 ? '#F59E0B' : '#F43F5E' }]}>
                        %{relAnalysis.overallScore}
                      </Text>
                      <Text style={styles.scoreLabelText}>Uyum Skoru</Text>
                    </View>

                    <View style={styles.scoreInfo}>
                      <View style={[styles.badgeRow, { backgroundColor: (relAnalysis.overallScore >= 80 ? '#10B981' : '#F43F5E') + '20', borderColor: (relAnalysis.overallScore >= 80 ? '#10B981' : '#F43F5E') + '50' }]}>
                        <MaterialCommunityIcons name="heart-flash" size={18} color={relAnalysis.overallScore >= 80 ? '#10B981' : '#F43F5E'} />
                        <Text style={[styles.statusBadgeText, { color: relAnalysis.overallScore >= 80 ? '#10B981' : '#F43F5E' }]}>
                          {relAnalysis.overallStatus}
                        </Text>
                      </View>
                      <Text style={styles.summaryText}>{relAnalysis.overallSummary}</Text>
                    </View>
                  </View>
                </View>

                {/* 🔮 SEVİYE SEVİYE DERİN UYUM VE SENTEZ BLOKLARI (KART GÖRSELLİ VE ÇEVRİLEBİLİR) */}
                <Text style={styles.sectionHeading}>⚜️ KATMAN KATMAN REZONANS VE SENTEZ</Text>

                {relAnalysis.pairs.map((pair, idx) => {
                  const p1Card = p1DrawnCards[idx];
                  const p2Card = p2DrawnCards[idx];
                  const isFlipped = !!flippedLevels[idx];
                  const p1Keywords = p1Card ? getTarotKeywordList(p1Card.id, p1Card.isReversed ? 'reversed' : 'upright').slice(0, 3) : [];
                  const p2Keywords = p2Card ? getTarotKeywordList(p2Card.id, p2Card.isReversed ? 'reversed' : 'upright').slice(0, 3) : [];

                  return (
                    <View key={`rel-pair-${idx}`} style={[styles.pairBlockCard, { borderColor: isFlipped ? '#F59E0B' : deck.accent + '66' }]}>
                      <CornerTicks />

                      {/* Seviye Başlığı ve Uyum Skoru */}
                      <View style={styles.pairBlockHeader}>
                        <View style={styles.pairLevelBadge}>
                          <Text style={styles.pairLevelNumber}>#{idx + 1}</Text>
                        </View>
                        <View style={styles.pairHeaderTextWrap}>
                          <Text style={[styles.pairTitle, { color: deck.accent }]}>{pair.title}</Text>
                          <Text style={styles.pairPosSubtitle}>{pair.posLabel}</Text>
                        </View>
                        <View
                          style={[
                            styles.pairScorePill,
                            {
                              backgroundColor: pair.score >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 201, 60, 0.15)',
                              borderColor: pair.score >= 85 ? '#10B981' : deck.accent,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pairScoreText,
                              { color: pair.score >= 85 ? '#10B981' : deck.accent },
                            ]}
                          >
                            %{pair.score} Uyum
                          </Text>
                        </View>
                      </View>

                      {!isFlipped ? (
                        /* ÖN YÜZ: İKİ KARTIN KARŞILIKLI BÜYÜK GÖRSELİ VE ÇEVİRME KONTROLÜ */
                        <View style={styles.pairFrontFaceWrap}>
                          <View style={styles.pairVersusRow}>
                            {/* 1. Kişi (Danışan / Sen) */}
                            <Pressable
                              style={styles.pairCardCol}
                              onPress={() => p1Card && setInspectedCard(p1Card)}
                            >
                              <View style={styles.pairPersonHeaderTag}>
                                <MaterialCommunityIcons name="account" size={13} color="#38BDF8" />
                                <Text style={styles.pairPersonHeaderNameLeft} numberOfLines={1}>
                                  {p1Name.trim() || '1. Kişi'}
                                </Text>
                              </View>

                              <View style={[styles.pairCardImageFrame, { borderColor: '#38BDF888' }]}>
                                {p1Card?.image ? (
                                  <Image
                                    source={p1Card.image}
                                    style={[
                                      styles.pairCardRealImg,
                                      p1Card.isReversed && { transform: [{ rotate: '180deg' }] },
                                    ]}
                                    resizeMode="cover"
                                  />
                                ) : deck.id === 'rune' && p1Card ? (
                                  <View style={styles.pairCardRuneBox}>
                                    <RuneStoneItem
                                      rune={{
                                        id: p1Card.id,
                                        symbol: p1Card.suitSymbol || 'ᚱ',
                                        name: p1Card.name,
                                        isReversed: p1Card.isReversed,
                                      }}
                                      size="sm"
                                      revealed={true}
                                      isReversed={p1Card.isReversed}
                                      glowColor="#38BDF8"
                                    />
                                  </View>
                                ) : (
                                  <View style={styles.pairCardPlaceholder}>
                                    <Text style={styles.pairCardPlaceholderSym}>{p1Card?.suitSymbol || '🔮'}</Text>
                                  </View>
                                )}
                                {p1Card?.isReversed && (
                                  <View style={styles.pairCardReversedBadge}>
                                    <Text style={styles.pairCardReversedBadgeText}>TERS</Text>
                                  </View>
                                )}
                              </View>

                              <Text style={styles.pairCardNameTitle} numberOfLines={1}>
                                {pair.p1CardName || p1Card?.name}
                              </Text>

                              <View style={[styles.pairOrientMiniTag, { backgroundColor: p1Card?.isReversed ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)' }]}>
                                <Text style={[styles.pairOrientMiniText, { color: p1Card?.isReversed ? '#F87171' : '#34D399' }]}>
                                  {p1Card?.isReversed ? '🔴 Ters Konum' : '🟢 Düz Konum'}
                                </Text>
                              </View>

                              <View style={[styles.pairElementMiniBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                                <Text style={styles.pairElementMiniText}>{pair.p1Element} Elementi</Text>
                              </View>

                              <View style={styles.pairKeywordsContainer}>
                                {p1Keywords.map((kw, kIdx) => (
                                  <View key={`p1-kw-${kIdx}`} style={styles.pairKeywordChip}>
                                    <Text style={styles.pairKeywordChipText} numberOfLines={1}>{kw}</Text>
                                  </View>
                                ))}
                              </View>
                            </Pressable>

                            {/* ORTA: REZONANS VE ÇEVİR / ANALİZİ GÖR BUTONU */}
                            <View style={styles.pairCenterControlCol}>
                              <View style={[styles.tableMatchCircle, { borderColor: deck.accent }]}>
                                <Text style={[styles.tableMatchPercent, { color: deck.accent }]}>%{pair.score}</Text>
                                <Text style={styles.tableMatchPercentLabel}>Uyum</Text>
                              </View>

                              <Pressable
                                onPress={() => toggleLevelFlip(idx)}
                                style={({ pressed }) => [
                                  styles.pairFlipCenterBtn,
                                  pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
                                ]}
                              >
                                <LinearGradient
                                  colors={['#F59E0B', '#D97706']}
                                  style={styles.pairFlipCenterBtnGradient}
                                >
                                  <MaterialCommunityIcons name="cached" size={22} color="#0B0612" />
                                </LinearGradient>
                                <Text style={styles.pairFlipCenterBtnText}>TIKLA ANALİZİ GÖR</Text>
                              </Pressable>

                              <MaterialCommunityIcons name="lightning-bolt" size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                            </View>

                            {/* 2. Kişi (Partner) */}
                            <Pressable
                              style={styles.pairCardCol}
                              onPress={() => p2Card && setInspectedCard(p2Card)}
                            >
                              <View style={styles.pairPersonHeaderTag}>
                                <MaterialCommunityIcons name="account-heart" size={13} color="#F43F5E" />
                                <Text style={styles.pairPersonHeaderNameRight} numberOfLines={1}>
                                  {p2Name.trim() || '2. Kişi'}
                                </Text>
                              </View>

                              <View style={[styles.pairCardImageFrame, { borderColor: '#F43F5E88' }]}>
                                {p2Card?.image ? (
                                  <Image
                                    source={p2Card.image}
                                    style={[
                                      styles.pairCardRealImg,
                                      p2Card.isReversed && { transform: [{ rotate: '180deg' }] },
                                    ]}
                                    resizeMode="cover"
                                  />
                                ) : deck.id === 'rune' && p2Card ? (
                                  <View style={styles.pairCardRuneBox}>
                                    <RuneStoneItem
                                      rune={{
                                        id: p2Card.id,
                                        symbol: p2Card.suitSymbol || 'ᚱ',
                                        name: p2Card.name,
                                        isReversed: p2Card.isReversed,
                                      }}
                                      size="sm"
                                      revealed={true}
                                      isReversed={p2Card.isReversed}
                                      glowColor="#F43F5E"
                                    />
                                  </View>
                                ) : (
                                  <View style={styles.pairCardPlaceholder}>
                                    <Text style={styles.pairCardPlaceholderSym}>{p2Card?.suitSymbol || '🔮'}</Text>
                                  </View>
                                )}
                                {p2Card?.isReversed && (
                                  <View style={styles.pairCardReversedBadge}>
                                    <Text style={styles.pairCardReversedBadgeText}>TERS</Text>
                                  </View>
                                )}
                              </View>

                              <Text style={styles.pairCardNameTitle} numberOfLines={1}>
                                {pair.p2CardName || p2Card?.name}
                              </Text>

                              <View style={[styles.pairOrientMiniTag, { backgroundColor: p2Card?.isReversed ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)' }]}>
                                <Text style={[styles.pairOrientMiniText, { color: p2Card?.isReversed ? '#F87171' : '#34D399' }]}>
                                  {p2Card?.isReversed ? '🔴 Ters Konum' : '🟢 Düz Konum'}
                                </Text>
                              </View>

                              <View style={[styles.pairElementMiniBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                                <Text style={styles.pairElementMiniText}>{pair.p2Element} Elementi</Text>
                              </View>

                              <View style={styles.pairKeywordsContainer}>
                                {p2Keywords.map((kw, kIdx) => (
                                  <View key={`p2-kw-${kIdx}`} style={styles.pairKeywordChip}>
                                    <Text style={styles.pairKeywordChipText} numberOfLines={1}>{kw}</Text>
                                  </View>
                                ))}
                              </View>
                            </Pressable>
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
                        </View>
                      ) : (
                        /* ARKA YÜZ: DERİN SENTEZ VE DETAYLI REHBERLİK */
                        <View style={styles.pairBackFaceWrap}>
                          {/* Hızlı Geri Dönme Butonu */}
                          <Pressable onPress={() => toggleLevelFlip(idx)} style={styles.pairFlipBackTopBtn}>
                            <MaterialCommunityIcons name="undo-variant" size={15} color="#F59E0B" />
                            <Text style={styles.pairFlipBackTopText}>Kart Görsellerini İncele (Geri Dön)</Text>
                          </Pressable>

                          {/* Enerji ve Niyet Karşılaştırması */}
                          <View style={styles.tableArchetypeRow}>
                            <View style={styles.tableArchetypeColLeft}>
                              <Text style={styles.tableArchetypeLabel}>{p1Name.trim() || '1. Kişi'} Enerjisi:</Text>
                              <Text style={styles.tableArchetypeText}>{pair.p1Archetype}</Text>
                            </View>
                            <View style={styles.tableArchetypeColDivider} />
                            <View style={styles.tableArchetypeColRight}>
                              <Text style={styles.tableArchetypeLabel}>{p2Name.trim() || '2. Kişi'} Enerjisi:</Text>
                              <Text style={styles.tableArchetypeText}>{pair.p2Archetype}</Text>
                            </View>
                          </View>

                          {/* Derin Sentez Metni */}
                          <View style={styles.synthesisBox}>
                            <View style={styles.synthesisHeadingRow}>
                              <MaterialCommunityIcons name="crystal-ball" size={18} color="#F59E0B" />
                              <Text style={styles.synthesisHeading}>Kadersel Sentez & Dinamik</Text>
                            </View>
                            <Text style={styles.pairSynthesisText}>{pair.synthesis}</Text>
                          </View>

                          {/* İlişki Tavsiyesi & Rehberlik */}
                          <View style={styles.pairAdviceBox}>
                            <View style={styles.adviceHeaderRow}>
                              <Ionicons name="bulb" size={17} color={GOLD} />
                              <Text style={styles.adviceHeadingText}>İlişki Tavsiyesi & Rehberlik</Text>
                            </View>
                            <Text style={styles.pairAdviceText}>{pair.advice}</Text>
                          </View>

                          <Pressable onPress={() => toggleLevelFlip(idx)} style={styles.pairFlipBackBottomBtn}>
                            <MaterialCommunityIcons name="cached" size={18} color="#0B0612" />
                            <Text style={styles.pairFlipBackBottomText}>KARTLARA DÖN</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* 🌉 7. KART: ÖZEL ORTAK KADERSEL KÖPRÜ & REZONANS KARTI (ÇEVRİLEBİLİR) */}
                {bridgeDrawnCard && (
                  <View style={[styles.pairBlockCard, { borderColor: '#F59E0B', marginTop: 10 }]}>
                    <CornerTicks />

                    {/* Köprü Başlığı */}
                    <View style={styles.pairBlockHeader}>
                      <View style={[styles.pairLevelBadge, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                        <Ionicons name="sparkles" size={16} color="#F59E0B" />
                      </View>
                      <View style={styles.pairHeaderTextWrap}>
                        <Text style={[styles.pairTitle, { color: '#F59E0B' }]}>Ortak Kadersel Köprü Kartı</Text>
                        <Text style={styles.pairPosSubtitle}>İki Ruhun Kesişim & Birleşme Noktası</Text>
                      </View>
                      <View style={[styles.pairScorePill, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}>
                        <Text style={[styles.pairScoreText, { color: '#F59E0B' }]}>✨ Kilit Enerji</Text>
                      </View>
                    </View>

                    {!flippedLevels[99] ? (
                      /* ÖN YÜZ: KÖPRÜ KARTININ GÖRSELİ VE DETAYLARI */
                      <View style={styles.bridgeFrontFaceWrap}>
                        <Pressable
                          style={styles.bridgeCardCol}
                          onPress={() => setInspectedCard(bridgeDrawnCard)}
                        >
                          <View style={[styles.bridgeCardImageFrame, { borderColor: '#F59E0B' }]}>
                            {bridgeDrawnCard.image ? (
                              <Image
                                source={bridgeDrawnCard.image}
                                style={[
                                  styles.bridgeCardRealImg,
                                  bridgeDrawnCard.isReversed && { transform: [{ rotate: '180deg' }] },
                                ]}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.pairCardPlaceholder}>
                                <Text style={styles.pairCardPlaceholderSym}>{bridgeDrawnCard.suitSymbol || '🔮'}</Text>
                              </View>
                            )}
                            {bridgeDrawnCard.isReversed && (
                              <View style={styles.pairCardReversedBadge}>
                                <Text style={styles.pairCardReversedBadgeText}>TERS</Text>
                              </View>
                            )}
                          </View>

                          <Text style={[styles.pairCardNameTitle, { fontSize: 13.5, color: '#FDE68A' }]} numberOfLines={1}>
                            {bridgeDrawnCard.name}
                          </Text>

                          <View style={[styles.pairOrientMiniTag, { backgroundColor: bridgeDrawnCard.isReversed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                            <Text style={[styles.pairOrientMiniText, { color: bridgeDrawnCard.isReversed ? '#F87171' : '#34D399' }]}>
                              {bridgeDrawnCard.isReversed ? '🔴 Ters Konum' : '🟢 Düz Konum'}
                            </Text>
                          </View>

                          {/* Element & Arketip */}
                          {getCardElement(bridgeDrawnCard.id) && (
                            <View style={[styles.pairElementMiniBadge, { backgroundColor: 'rgba(245, 158, 11, 0.18)' }]}>
                              <Text style={[styles.pairElementMiniText, { color: '#FDE68A' }]}>
                                {getCardElement(bridgeDrawnCard.id).elementName} Elementi · {getCardElement(bridgeDrawnCard.id).loveArchetype}
                              </Text>
                            </View>
                          )}

                          {/* Özgün Kavramsal Kelimeler */}
                          <View style={styles.pairKeywordsContainer}>
                            {getTarotKeywordList(bridgeDrawnCard.id, bridgeDrawnCard.isReversed ? 'reversed' : 'upright').slice(0, 3).map((kw, kIdx) => (
                              <View key={`bridge-kw-${kIdx}`} style={[styles.pairKeywordChip, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 0.6, borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                                <Text style={[styles.pairKeywordChipText, { color: '#FDE68A' }]}>{kw}</Text>
                              </View>
                            ))}
                          </View>
                        </Pressable>

                        {/* Tıkla Köprü Analizini Gör Butonu */}
                        <Pressable
                          onPress={() => toggleLevelFlip(99)}
                          style={({ pressed }) => [
                            styles.bridgeFlipActionBtn,
                            pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
                          ]}
                        >
                          <LinearGradient
                            colors={['#D97706', '#F59E0B']}
                            style={styles.bridgeFlipActionGradient}
                          >
                            <MaterialCommunityIcons name="cached" size={18} color="#0B0612" />
                            <Text style={styles.bridgeFlipActionText}>TIKLA KÖPRÜ ANALİZİNİ GÖR</Text>
                          </LinearGradient>
                        </Pressable>
                      </View>
                    ) : (
                      /* ARKA YÜZ: DERİN KÖPRÜ ANALİZİ VE MESAJI */
                      <View style={styles.pairBackFaceWrap}>
                        <Pressable onPress={() => toggleLevelFlip(99)} style={styles.pairFlipBackTopBtn}>
                          <MaterialCommunityIcons name="cached" size={14} color="#F59E0B" />
                          <Text style={styles.pairFlipBackTopText}>Kart Görseline Dön</Text>
                        </Pressable>

                        <View style={styles.synthesisBox}>
                          <View style={styles.synthesisHeadingRow}>
                            <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={18} color="#F59E0B" />
                            <Text style={[styles.synthesisHeading, { color: '#F59E0B' }]}>Ortak Kadersel Kesişim Analizi</Text>
                          </View>
                          <Text style={styles.pairSynthesisText}>
                            {relAnalysis.bridgeAnalysis?.meaning || `${bridgeDrawnCard.name} kartı, ${p1Name.trim() || '1. Kişi'} ve ${p2Name.trim() || '2. Kişi'}'in birleştiği kadersel enerji noktasını temsil ediyor. Bu kart, iki tarafın birbirine kattığı en büyük ruhsal dersi ve birlikte var edecekleri kadersel gücü sembolize eder.`}
                          </Text>
                        </View>

                        <View style={[styles.pairAdviceBox, { borderColor: '#F59E0B' }]}>
                          <View style={styles.adviceHeaderRow}>
                            <Ionicons name="sparkles" size={17} color="#F59E0B" />
                            <Text style={[styles.adviceHeadingText, { color: '#F59E0B' }]}>Köprü Rehberliği & Kozmik Mesaj</Text>
                          </View>
                          <Text style={styles.pairAdviceText}>
                            {getCardDetails(bridgeDrawnCard.id)?.advice || `Bu köprü kartının enerjisi, ilişkinizin temel taşını oluşturuyor. Birlikteyken bu kartın temsil ettiği değerlere sahip çıkmanız aranızdaki bağı kopmaz kılacaktır.`}
                          </Text>
                        </View>

                        <Pressable onPress={() => toggleLevelFlip(99)} style={styles.pairFlipBackBottomBtn}>
                          <MaterialCommunityIcons name="cached" size={18} color="#0B0612" />
                          <Text style={styles.pairFlipBackBottomText}>KART GÖRSELİNE DÖN</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                {/* 📜 2'Lİ KARŞILAŞTIRMALI DİZİLİM SIRASI VE KART TABLOSU */}
                <View style={styles.ritualLegendWrap}>
                  <Text style={styles.ritualLegendTitle}>📜 DİZİLİM SIRASI VE KARŞILIKLI KART TABLOSU</Text>
                  <View style={styles.relComparisonTableWrap}>
                    {Array.from({ length: Math.max(p1DrawnCards.length, p2DrawnCards.length) }).map((_, idx) => {
                      const p1C = p1DrawnCards[idx];
                      const p2C = p2DrawnCards[idx];
                      const posLabel = selectedSpread.positions[idx] || `${idx + 1}. Katman`;

                      return (
                        <View key={`rel-legend-${idx}`} style={styles.relTableRow}>
                          <Pressable
                            style={styles.relTableCell}
                            onPress={() => p1C && setInspectedCard(p1C)}
                          >
                            {p1C ? (
                              <>
                                <Text style={styles.relTableCellCardName} numberOfLines={1}>{p1C.name}</Text>
                                <View style={[styles.relOrientationTag, p1C.isReversed ? styles.relTagReversed : styles.relTagUpright]}>
                                  <Text style={[styles.relOrientationTagText, { color: p1C.isReversed ? '#EF4444' : '#10B981' }]}>
                                    {p1C.isReversed ? '🔴 Ters' : '🟢 Düz'}
                                  </Text>
                                </View>
                              </>
                            ) : (
                              <Text style={styles.relTableEmpty}>-</Text>
                            )}
                          </Pressable>

                          <View style={styles.relTableCenterCell}>
                            <View style={styles.relLayerBadge}>
                              <Text style={styles.relLayerBadgeText}>#{idx + 1}</Text>
                            </View>
                            <Text style={styles.relLayerPosText} numberOfLines={2}>{posLabel}</Text>
                          </View>

                          <Pressable
                            style={styles.relTableCell}
                            onPress={() => p2C && setInspectedCard(p2C)}
                          >
                            {p2C ? (
                              <>
                                <Text style={styles.relTableCellCardName} numberOfLines={1}>{p2C.name}</Text>
                                <View style={[styles.relOrientationTag, p2C.isReversed ? styles.relTagReversed : styles.relTagUpright]}>
                                  <Text style={[styles.relOrientationTagText, { color: p2C.isReversed ? '#EF4444' : '#10B981' }]}>
                                    {p2C.isReversed ? '🔴 Ters' : '🟢 Düz'}
                                  </Text>
                                </View>
                              </>
                            ) : (
                              <Text style={styles.relTableEmpty}>-</Text>
                            )}
                          </Pressable>
                        </View>
                      );
                    })}

                    {bridgeDrawnCard && (
                      <View style={styles.relTableBridgeRow}>
                        <Pressable
                          style={styles.relTableBridgeInner}
                          onPress={() => setInspectedCard(bridgeDrawnCard)}
                        >
                          <View style={styles.relTableBridgePill}>
                            <Ionicons name="sparkles" size={12} color={GOLD} />
                            <Text style={styles.relTableBridgePillText}>Ortak Kadersel Köprü Kartı</Text>
                          </View>
                          <Text style={[styles.relTableCellCardName, { color: GOLD, fontSize: 13, marginTop: 4 }]} numberOfLines={1}>
                            {bridgeDrawnCard.name}
                          </Text>
                          <View style={[styles.relOrientationTag, bridgeDrawnCard.isReversed ? styles.relTagReversed : styles.relTagUpright, { marginTop: 4 }]}>
                            <Text style={[styles.relOrientationTagText, { color: bridgeDrawnCard.isReversed ? '#EF4444' : '#10B981' }]}>
                              {bridgeDrawnCard.isReversed ? '🔴 Ters' : '🟢 Düz'}
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* 4. MASAYI YENİLEME & AI ANALİZİ BUTONLARI */}
            <View style={{ gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => {
                  setPhase('setup');
                  setDrawnCards([]);
                  setP1DrawnCards([]);
                  setP2DrawnCards([]);
                  setBridgeDrawnCard(null);
                  setPlacedCount(0);
                }}
                style={styles.resetBtn}
              >
                <Ionicons name="refresh" size={18} color={GOLD} />
                <Text style={styles.resetBtnText}>Falı Tamamla & Yeni Açılım Yap</Text>
              </Pressable>

              <Pressable
                onPress={handleLaunchAiReading}
                style={({ pressed }) => [styles.aiReadingBtn, pressed && styles.btnPressed]}
              >
                <LinearGradient
                  colors={['#D97706', '#F59E0B', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiReadingGradient}
                >
                  <View style={styles.aiReadingIconWrap}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={26} color={NIGHT_CARD} />
                  </View>
                  <View style={styles.aiReadingTextWrap}>
                    <View style={styles.aiReadingTitleRow}>
                      <Text style={styles.aiReadingTitle}>Daha Detaylı Analiz Al</Text>
                      <View style={styles.aiReadingCostPill}>
                        <Ionicons name="disc" size={13} color={NIGHT_CARD} />
                        <Text style={styles.aiReadingCostText}>50 Coin</Text>
                      </View>
                    </View>
                    <Text style={styles.aiReadingSubtitle}>
                      Seçtiğin kartların sana özel derin, kapsamlı analizi ve genel yorum.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={NIGHT_CARD} />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>


      {/* 🌟 TAM EKRAN KADERSEL UYUM SKORU SAYACI VE BAŞARI ANİMASYONU */}
      {showScoreSplashModal && (
        <Modal
          visible={showScoreSplashModal}
          transparent={false}
          animationType="fade"
          onRequestClose={handleFinishSplashAndOpenTable}
        >
          <View style={styles.scoreSplashContainer}>
            <Image source={deck.sectionBg} style={styles.bgFullImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(7, 2, 16, 0.88)', 'rgba(18, 6, 36, 0.95)', 'rgba(8, 2, 14, 0.98)']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.scoreSplashInner}>
              <View style={styles.scoreSplashHeader}>
                <MaterialCommunityIcons name="heart-pulse" size={32} color={deck.accent} />
                <Text style={[styles.scoreSplashTitle, { color: deck.accent }]}>
                  KADERSEL UYUM HESAPLANIYOR
                </Text>
                <Text style={styles.scoreSplashSubtitle}>
                  {p1Name.trim() || '1. Kişi'} & {p2Name.trim() || '2. Kişi'} Kozmik Rezonansı
                </Text>
              </View>

              {/* Mistik Işıltılı Halka & Dönen Sayaç */}
              <View style={styles.scoreSplashCircleWrap}>
                <View
                  style={[
                    styles.scoreSplashCircle,
                    {
                      borderColor:
                        splashScoreDisplay >= 80
                          ? '#10B981'
                          : splashScoreDisplay >= 65
                          ? '#F59E0B'
                          : '#F43F5E',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreSplashNumber,
                      {
                        color:
                          splashScoreDisplay >= 80
                            ? '#10B981'
                            : splashScoreDisplay >= 65
                            ? '#F59E0B'
                            : '#F43F5E',
                      },
                    ]}
                  >
                    %{splashScoreDisplay}
                  </Text>
                  <Text style={styles.scoreSplashPercentLabel}>Uyum Skoru</Text>
                </View>
              </View>

              {/* Dinamik Başarı / Durum Rozeti */}
              <View style={styles.scoreSplashBadgeWrap}>
                <View
                  style={[
                    styles.scoreSplashStatusBadge,
                    {
                      backgroundColor:
                        splashScoreDisplay >= 80
                          ? 'rgba(16, 185, 129, 0.15)'
                          : splashScoreDisplay >= 65
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(244, 63, 94, 0.15)',
                      borderColor:
                        splashScoreDisplay >= 80
                          ? '#10B981'
                          : splashScoreDisplay >= 65
                          ? '#F59E0B'
                          : '#F43F5E',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreSplashStatusText,
                      {
                        color:
                          splashScoreDisplay >= 80
                            ? '#10B981'
                            : splashScoreDisplay >= 65
                            ? '#F59E0B'
                            : '#F43F5E',
                      },
                    ]}
                  >
                    {splashScoreDisplay >= 85
                      ? '👑 KOZMİK RUH EŞİ & KUSURSUZ UYUM'
                      : splashScoreDisplay >= 70
                      ? '✨ YÜKSEK KALBİ ÇEKİM & DERİN BAĞ'
                      : '🌿 GELİŞİME AÇIK KARMASIK DERSLER'}
                  </Text>
                </View>

                <Text style={styles.scoreSplashDesc}>
                  {splashScoreDisplay >= 80
                    ? 'Kutsal kartlar iki ruh arasında muazzam bir rezonans ve yüksek aşk kimyası işaret ediyor!'
                    : splashScoreDisplay >= 65
                    ? 'Kartlar dengeli bir duygusal çekim ve karşılıklı anlayışla büyüyen bir bağ gösteriyor.'
                    : 'İlişkide çözülmesi gereken kadersel sınavlar ve derinleşme fırsatları mevcut.'}
                </Text>
              </View>

              {/* Sonuç Tablosuna Geçiş Butonu */}
              <Pressable
                onPress={handleFinishSplashAndOpenTable}
                style={[styles.scoreSplashProceedBtn, { backgroundColor: deck.accent }]}
              >
                <MaterialCommunityIcons name="cards-playing" size={20} color={NIGHT_CARD} />
                <Text style={styles.scoreSplashProceedBtnText}>
                  Masadaki Dizilimi ve Kart Analizini İncele →
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* 🎴 MASADAKİ DİZİLİMİ GÖR > (ANİMASYONLU SIRAYLA GÖSTERİM MODALI) */}
      {showRitualSpread && (
        <Modal
          visible={showRitualSpread}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRitualSpread(false)}
        >
          <View style={styles.spreadModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setShowRitualSpread(false)}
            />
            <View style={styles.spreadModalCard}>
              <View style={styles.spreadModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="movie-play-outline" size={22} color={GOLD} />
                  <Text style={styles.spreadModalTitle}>Masadaki Kart Dizilimi</Text>
                </View>
                <Pressable
                  onPress={() => setShowRitualSpread(false)}
                  style={styles.spreadModalCloseBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={TEXT_MUTED} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.spreadModalScrollContent}>
                {/* Ritüel Masası Gösterimi */}
                <View style={styles.spreadModalTableWrap}>
                  <CornerTicks />
                  <LinearGradient
                    colors={['#0F3822', '#0A2617', '#04130A']}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                  />

                  {readingMode === 'relationship' ? (
                    <View style={{ width: '100%', gap: 16 }}>
                      {/* Partner Board */}
                      <View style={styles.pistiPlayerSection}>
                        <Text style={[styles.pistiPlayerName, { color: '#F43F5E', marginBottom: 8 }]}>
                          {p2Name.trim() || '2. Kişi (Partner)'} Masası
                        </Text>
                        {selectedSpread.id === 'rel_cosmic_20' ? (
                          <View style={styles.celticCrossBoard}>
                            <View style={styles.celticCrossLeft}>
                              <RitualSlotItem card={p2DrawnCards[4]} index={4} isPlaced={true} isNext={false} positionName={selectedSpread.positions[4]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[4]); }} />
                              <View style={styles.celticCrossMidRow}>
                                <RitualSlotItem card={p2DrawnCards[3]} index={3} isPlaced={true} isNext={false} positionName={selectedSpread.positions[3]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[3]); }} />
                                <View style={styles.celticCenterStack}>
                                  <RitualSlotItem card={p2DrawnCards[0]} index={0} isPlaced={true} isNext={false} positionName={selectedSpread.positions[0]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[0]); }} />
                                  <View style={styles.celticCrossCardOverlay} pointerEvents="box-none">
                                    <RitualSlotItem card={p2DrawnCards[1]} index={1} isPlaced={true} isNext={false} positionName={selectedSpread.positions[1]} deck={deck} isRotated={true} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[1]); }} />
                                  </View>
                                </View>
                                <RitualSlotItem card={p2DrawnCards[5]} index={5} isPlaced={true} isNext={false} positionName={selectedSpread.positions[5]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[5]); }} />
                              </View>
                              <RitualSlotItem card={p2DrawnCards[2]} index={2} isPlaced={true} isNext={false} positionName={selectedSpread.positions[2]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[2]); }} />
                            </View>
                            <View style={styles.celticStaffColumn}>
                              {[9, 8, 7, 6].map((s) => (
                                <RitualSlotItem key={`spr-p2-${s}`} card={p2DrawnCards[s]} index={s} isPlaced={true} isNext={false} positionName={selectedSpread.positions[s]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[s]); }} />
                              ))}
                            </View>
                          </View>
                        ) : p2DrawnCards.length === 5 ? (
                          <View style={styles.fiveCrossBoard}>
                            <RitualSlotItem
                              card={p2DrawnCards[1]}
                              index={1}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[1]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[1]); }}
                            />
                            <View style={styles.fiveCrossMidRow}>
                              <RitualSlotItem
                                card={p2DrawnCards[2]}
                                index={2}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[2]}
                                deck={deck}
                                onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[2]); }}
                              />
                              <RitualSlotItem
                                card={p2DrawnCards[0]}
                                index={0}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[0]}
                                deck={deck}
                                onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[0]); }}
                              />
                              <RitualSlotItem
                                card={p2DrawnCards[3]}
                                index={3}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[3]}
                                deck={deck}
                                onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[3]); }}
                              />
                            </View>
                            <RitualSlotItem
                              card={p2DrawnCards[4]}
                              index={4}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[4]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(p2DrawnCards[4]); }}
                            />
                          </View>
                        ) : p2DrawnCards.length === 7 ? (
                          <View style={styles.horseshoeRitualBoard}>
                            {p2DrawnCards.map((c, i) => (
                              <RitualSlotItem key={`spr-p2-hs-${i}`} card={c} index={i} isPlaced={true} isNext={false} positionName={selectedSpread.positions[i]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(c); }} />
                            ))}
                          </View>
                        ) : (
                          <View style={styles.generalRitualRow}>
                            {p2DrawnCards.map((c, i) => (
                              <RitualSlotItem key={`spr-p2-h-${i}`} card={c} index={i} isPlaced={true} isNext={false} positionName={selectedSpread.positions[i]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(c); }} />
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Bridge */}
                      {bridgeDrawnCard && (
                        <View style={{ alignItems: 'center', marginVertical: 8 }}>
                          <RitualSlotItem
                            card={bridgeDrawnCard}
                            index={0}
                            badgeText="Köprü"
                            isPlaced={true}
                            isNext={false}
                            positionName="Ortak Kadersel Köprü"
                            deck={deck}
                            onPress={() => {
                              setShowRitualSpread(false);
                              setInspectedCard(bridgeDrawnCard);
                            }}
                          />
                        </View>
                      )}

                      {/* Danışan Board */}
                      <View style={styles.pistiPlayerSection}>
                        <Text style={[styles.pistiPlayerName, { color: '#38BDF8', marginBottom: 8 }]}>
                          {p1Name.trim() || '1. Kişi (Sen)'} Masası
                        </Text>
                        {selectedSpread.id === 'rel_cosmic_20' ? (
                          <View style={styles.celticCrossBoard}>
                            <View style={styles.celticCrossLeft}>
                              <RitualSlotItem card={p1DrawnCards[4]} index={4} isPlaced={true} isNext={false} positionName={selectedSpread.positions[4]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[4]); }} />
                              <View style={styles.celticCrossMidRow}>
                                <RitualSlotItem card={p1DrawnCards[3]} index={3} isPlaced={true} isNext={false} positionName={selectedSpread.positions[3]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[3]); }} />
                                <View style={styles.celticCenterStack}>
                                  <RitualSlotItem card={p1DrawnCards[0]} index={0} isPlaced={true} isNext={false} positionName={selectedSpread.positions[0]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[0]); }} />
                                  <View style={styles.celticCrossCardOverlay} pointerEvents="box-none">
                                    <RitualSlotItem card={p1DrawnCards[1]} index={1} isPlaced={true} isNext={false} positionName={selectedSpread.positions[1]} deck={deck} isRotated={true} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[1]); }} />
                                  </View>
                                </View>
                                <RitualSlotItem card={p1DrawnCards[5]} index={5} isPlaced={true} isNext={false} positionName={selectedSpread.positions[5]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[5]); }} />
                              </View>
                              <RitualSlotItem card={p1DrawnCards[2]} index={2} isPlaced={true} isNext={false} positionName={selectedSpread.positions[2]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[2]); }} />
                            </View>
                            <View style={styles.celticStaffColumn}>
                              {[9, 8, 7, 6].map((s) => (
                                <RitualSlotItem key={`spr-p1-${s}`} card={p1DrawnCards[s]} index={s} isPlaced={true} isNext={false} positionName={selectedSpread.positions[s]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[s]); }} />
                              ))}
                            </View>
                          </View>
                        ) : p1DrawnCards.length === 5 ? (
                          <View style={styles.fiveCrossBoard}>
                            <RitualSlotItem
                              card={p1DrawnCards[1]}
                              index={1}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[1]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[1]); }}
                            />
                            <View style={styles.fiveCrossMidRow}>
                              <RitualSlotItem
                                card={p1DrawnCards[2]}
                                index={2}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[2]}
                                deck={deck}
                                onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[2]); }}
                              />
                              <RitualSlotItem
                                card={p1DrawnCards[0]}
                                index={0}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[0]}
                                deck={deck}
                                onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[0]); }}
                              />
                              <RitualSlotItem
                                card={p1DrawnCards[3]}
                                index={3}
                                isPlaced={true}
                                isNext={false}
                                positionName={selectedSpread.positions[3]}
                                deck={deck}
                                onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[3]); }}
                              />
                            </View>
                            <RitualSlotItem
                              card={p1DrawnCards[4]}
                              index={4}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[4]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(p1DrawnCards[4]); }}
                            />
                          </View>
                        ) : p1DrawnCards.length === 7 ? (
                          <View style={styles.horseshoeRitualBoard}>
                            {p1DrawnCards.map((c, i) => (
                              <RitualSlotItem key={`spr-p1-hs-${i}`} card={c} index={i} isPlaced={true} isNext={false} positionName={selectedSpread.positions[i]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(c); }} />
                            ))}
                          </View>
                        ) : (
                          <View style={styles.generalRitualRow}>
                            {p1DrawnCards.map((c, i) => (
                              <RitualSlotItem key={`spr-p1-h-${i}`} card={c} index={i} isPlaced={true} isNext={false} positionName={selectedSpread.positions[i]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(c); }} />
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    /* Bireysel Masa */
                    <View style={{ width: '100%' }}>
                      {drawnCards.length === 10 ? (
                        <View style={styles.celticCrossBoard}>
                          <View style={styles.celticCrossLeft}>
                            <RitualSlotItem card={drawnCards[4]} index={4} isPlaced={true} isNext={false} positionName={selectedSpread.positions[4]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[4]); }} />
                            <View style={styles.celticCrossMidRow}>
                              <RitualSlotItem card={drawnCards[3]} index={3} isPlaced={true} isNext={false} positionName={selectedSpread.positions[3]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[3]); }} />
                              <View style={styles.celticCenterStack}>
                                <RitualSlotItem card={drawnCards[0]} index={0} isPlaced={true} isNext={false} positionName={selectedSpread.positions[0]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[0]); }} />
                                <View style={styles.celticCrossCardOverlay} pointerEvents="box-none">
                                  <RitualSlotItem card={drawnCards[1]} index={1} isPlaced={true} isNext={false} positionName={selectedSpread.positions[1]} deck={deck} isRotated={true} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[1]); }} />
                                </View>
                              </View>
                              <RitualSlotItem card={drawnCards[5]} index={5} isPlaced={true} isNext={false} positionName={selectedSpread.positions[5]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[5]); }} />
                            </View>
                            <RitualSlotItem card={drawnCards[2]} index={2} isPlaced={true} isNext={false} positionName={selectedSpread.positions[2]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[2]); }} />
                          </View>
                          <View style={styles.celticStaffColumn}>
                            {[9, 8, 7, 6].map((s) => (
                              <RitualSlotItem key={`spr-ind-${s}`} card={drawnCards[s]} index={s} isPlaced={true} isNext={false} positionName={selectedSpread.positions[s]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[s]); }} />
                            ))}
                          </View>
                        </View>
                      ) : drawnCards.length === 5 ? (
                        <View style={styles.fiveCrossBoard}>
                          <RitualSlotItem
                            card={drawnCards[1]}
                            index={1}
                            isPlaced={true}
                            isNext={false}
                            positionName={selectedSpread.positions[1]}
                            deck={deck}
                            onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[1]); }}
                          />
                          <View style={styles.fiveCrossMidRow}>
                            <RitualSlotItem
                              card={drawnCards[2]}
                              index={2}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[2]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[2]); }}
                            />
                            <RitualSlotItem
                              card={drawnCards[0]}
                              index={0}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[0]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[0]); }}
                            />
                            <RitualSlotItem
                              card={drawnCards[3]}
                              index={3}
                              isPlaced={true}
                              isNext={false}
                              positionName={selectedSpread.positions[3]}
                              deck={deck}
                              onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[3]); }}
                            />
                          </View>
                          <RitualSlotItem
                            card={drawnCards[4]}
                            index={4}
                            isPlaced={true}
                            isNext={false}
                            positionName={selectedSpread.positions[4]}
                            deck={deck}
                            onPress={() => { setShowRitualSpread(false); setInspectedCard(drawnCards[4]); }}
                          />
                        </View>
                      ) : drawnCards.length === 7 ? (
                        <View style={styles.horseshoeRitualBoard}>
                          {drawnCards.map((c, i) => (
                            <RitualSlotItem key={`spr-ind-hs-${i}`} card={c} index={i} isPlaced={true} isNext={false} positionName={selectedSpread.positions[i]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(c); }} />
                          ))}
                        </View>
                      ) : drawnCards.length === 9 ? (
                        <View style={styles.boxRitualBoard}>
                          {[0, 3, 6].map((rowStart) => (
                            <View key={`spr-box-row-${rowStart}`} style={styles.boxRitualRow}>
                              {[0, 1, 2].map((col) => {
                                const idx = rowStart + col;
                                const card = drawnCards[idx];
                                return (
                                  <RitualSlotItem
                                    key={`spr-box-${idx}`}
                                    card={card}
                                    index={idx}
                                    isPlaced={true}
                                    isNext={false}
                                    positionName={selectedSpread.positions[idx]}
                                    deck={deck}
                                    onPress={() => { setShowRitualSpread(false); setInspectedCard(card); }}
                                  />
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.generalRitualRow}>
                          {drawnCards.map((c, i) => (
                            <RitualSlotItem key={`spr-ind-g-${i}`} card={c} index={i} isPlaced={true} isNext={false} positionName={selectedSpread.positions[i]} deck={deck} onPress={() => { setShowRitualSpread(false); setInspectedCard(c); }} />
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Butonlar */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' }}>
                  <Pressable
                    onPress={() => {
                      const allCards = readingMode === 'relationship'
                        ? [...p1DrawnCards, ...p2DrawnCards, ...(bridgeDrawnCard ? [bridgeDrawnCard] : [])]
                        : drawnCards;
                      allCards.forEach((c, idx) => {
                        c.dealAnim.setValue(0);
                        Animated.sequence([
                          Animated.delay(idx * 90),
                          Animated.spring(c.dealAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
                        ]).start();
                      });
                    }}
                    style={[styles.spreadReplayBtn, { borderColor: GOLD }]}
                  >
                    <Ionicons name="play" size={15} color={GOLD} />
                    <Text style={styles.spreadReplayBtnText}>Yeniden Oynat</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowRitualSpread(false)}
                    style={styles.spreadCloseBtn}
                  >
                    <Text style={styles.spreadCloseBtnText}>Kapat</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* KART DETAYLI İNCELEME MODALI (KAVRAMLAR + HİKAYESİ + REHBER) */}
      {inspectedCard && (
        <View style={styles.inspectBackdrop}>
          <View style={styles.inspectCardModal}>
            <Pressable
              onPress={() => {
                setInspectedCard(null);
                setShowStoryDetail(false);
              }}
              style={styles.inspectCloseBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.inspectScroll}>
              <Text style={[styles.inspectPosition, { color: deck.accent }]}>
                {inspectedCard.positionName}
              </Text>
              <Text style={styles.inspectTitle}>{inspectedCard.name}</Text>
              <Text style={[styles.inspectOrientation, { color: inspectedCard.isReversed ? '#F87171' : '#34D399' }]}>
                {inspectedCard.isReversed ? '⚡ Ters Açıldı' : '✨ Düz Doğrudan Enerji'}
              </Text>

              {/* Kart / Taş Görseli */}
              {deck.id === 'rune' ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
                  <RuneStoneItem
                    rune={{
                      id: inspectedCard.id,
                      symbol: inspectedCard.suitSymbol || 'ᚱ',
                      name: inspectedCard.name,
                      isReversed: inspectedCard.isReversed,
                    }}
                    size="lg"
                    revealed={true}
                    isReversed={inspectedCard.isReversed}
                    glowColor={deck.accent}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.inspectImgWrap,
                    { borderColor: deck.accent },
                    inspectedCard.isReversed && { transform: [{ rotate: '180deg' }] },
                  ]}
                >
                  {inspectedCard.image ? (
                    <Image source={inspectedCard.image} style={styles.inspectImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.inspectPlaceholder}>
                      <Text style={[styles.inspectSuit, { color: inspectedCard.themeColor || deck.accent }]}>
                        {inspectedCard.suitSymbol}
                      </Text>
                      <Text style={styles.inspectPlaceholderText}>{inspectedCard.name}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Açıklamalı İçerik vs Görsel Kısıtlaması */}
              {tier === 'explained' ? (
                (() => {
                  const details = getCardDetails(inspectedCard.id);
                  if (!details) {
                    return (
                      <Text style={styles.inspectDesc}>
                        {inspectedCard.isReversed
                          ? `Bu ${deck.id === 'rune' ? 'taş' : 'kart'} ters konumda engelleri ve içsel dönüşümü işaret ediyor.`
                          : `Bu ${deck.id === 'rune' ? 'taş' : 'kart'} düz konumda doğrudan enerjiyi ve açık fırsatları simgeliyor.`}
                      </Text>
                    );
                  }
                  return (
                    <View style={styles.lexiconWrap}>
                      {/* Karşılıklı Uyum Moduna Özel Rehberlik Başlığı */}
                      {readingMode === 'relationship' && (
                        <View style={styles.friendClientBanner}>
                          <Ionicons name="sparkles" size={15} color={GOLD} />
                          <Text style={styles.friendClientBannerText}>
                            {p2Name.trim() || 'Partner'} & {p1Name.trim() || 'Sen'} için Uyum Notu
                          </Text>
                        </View>
                      )}

                      {/* 1. KAVRAMLAR VE ANAHTAR KELİMELER PİLLERİ */}
                      {details.keywords && details.keywords.length > 0 && (
                        <View style={styles.keywordPillsRow}>
                          {details.keywords.map((kw: string, idx: number) => (
                            <View key={idx} style={[styles.keywordPill, { borderColor: deck.accent + '66' }]}>
                              <Text style={[styles.keywordPillText, { color: deck.accent }]}>{kw}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* 2. TAŞIN / KARTIN HİKAYESİ VE MİTOLOJİSİ (BUTON HALİNDE) */}
                      {details.story && (
                        <View style={styles.storyCardBox}>
                          <Pressable
                            onPress={() => setShowStoryDetail(!showStoryDetail)}
                            style={styles.storyToggleHeader}
                          >
                            <View style={styles.storyToggleLeft}>
                              <Ionicons name="book-outline" size={16} color={GOLD} />
                              <Text style={styles.storyToggleTitle}>
                                {deck.id === 'rune' ? 'Taşın Hikayesi & Mitolojisi' : 'Kartın Hikayesi & Arketipi'}
                              </Text>
                            </View>
                            <Ionicons
                              name={showStoryDetail ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color={GOLD}
                            />
                          </Pressable>
                          {showStoryDetail && (
                            <Text style={styles.storyBodyText}>{details.story}</Text>
                          )}
                        </View>
                      )}

                      {/* 3. DÜZ VE TERS ANLAMI */}
                      <View style={styles.lexiconBox}>
                        <Text style={styles.lexiconLabel}>🔮 TEMEL ENERJİ & ANLAMI</Text>
                        <Text style={styles.lexiconText}>
                          {inspectedCard.isReversed ? details.reversed : details.upright}
                        </Text>
                      </View>

                      {/* 4. AŞK & İLİŞKİ */}
                      {details.love && (
                        <View style={styles.lexiconBox}>
                          <Text style={[styles.lexiconLabel, { color: '#F43F5E' }]}>❤️ AŞK & İLİŞKİ YORUMU</Text>
                          <Text style={styles.lexiconText}>{details.love}</Text>
                        </View>
                      )}

                      {/* 5. KARİYER & PARA */}
                      {details.career && (
                        <View style={styles.lexiconBox}>
                          <Text style={[styles.lexiconLabel, { color: '#F59E0B' }]}>💼 KARİYER & PARA</Text>
                          <Text style={styles.lexiconText}>{details.career}</Text>
                        </View>
                      )}

                      {/* 6. FALCININ TAVSİYESİ VEYA REPLİĞİ */}
                      {details.advice && (
                        <View style={[styles.lexiconBox, readingMode === 'relationship' && styles.lexiconBoxFriend]}>
                          <Text style={[styles.lexiconLabel, { color: '#38BDF8' }]}>
                            {readingMode === 'relationship' ? '🗣️ İLİŞKİ TAVSİYESİ & REHBERLİK' : '💡 FALCININ TAVSİYESİ'}
                          </Text>
                          <Text style={[styles.lexiconText, readingMode === 'relationship' && { fontWeight: '700', color: '#FFFFFF' }]}>
                            {details.advice}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()
              ) : (
                <View style={styles.lockedExplainedBox}>
                  <MaterialCommunityIcons name="book-lock-outline" size={32} color={GOLD} />
                  <Text style={styles.lockedTitle}>Açıklamalı Sürüm Gerekli</Text>
                  <Text style={styles.lockedDesc}>
                    Bu {deck.id === 'rune' ? 'taşın' : 'kartın'} Kavramlarını, Mitolojik Hikayesini, Aşk/Kariyer ve Falcı Repliklerini görmek için Açıklamalı Sürüme yükseltin.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setInspectedCard(null);
                      setUpgradeModalVisible(true);
                    }}
                    style={styles.upgradeInModalBtn}
                  >
                    <Text style={styles.upgradeInModalText}>Açıklamalı Sürüme Yükselt ✨</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Yükseltme / Satın Alma Modalı */}
      <DeckPurchaseModal
        visible={upgradeModalVisible}
        deck={deck}
        currentTier={tier}
        coins={coins}
        loading={purchaseLoading}
        onBuyVisual={() => {}}
        onBuyExplained={handleBuyExplained}
        onNeedCoins={() => {
          setUpgradeModalVisible(false);
          navigation.navigate('CoinShop');
        }}
        onClose={() => setUpgradeModalVisible(false)}
        onDirectPlay={() => setUpgradeModalVisible(false)}
      />

      {/* 🪙 50 COİN DETAYLI ANALİZ ONAY MODALI */}
      {confirmAnalysisModalVisible && (
        <Modal
          visible={confirmAnalysisModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmAnalysisModalVisible(false)}
        >
          <View style={styles.confirmModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setConfirmAnalysisModalVisible(false)}
            />
            <View style={styles.confirmModalCard}>
              <View style={styles.confirmModalHeader}>
                <MaterialCommunityIcons name="crystal-ball" size={28} color={GOLD} />
                <Text style={styles.confirmModalTitle}>Detaylı Analiz Onayı</Text>
              </View>

              <Text style={styles.confirmModalDesc}>
                50 Coin karşılığında seçtiğin {drawnCards.length} kartın sana özel derin, kapsamlı analizi ve genel yorumu hazırlanacak.
              </Text>

              <View style={styles.confirmBalanceRow}>
                <Text style={styles.confirmBalanceLabel}>Mevcut Bakiyen:</Text>
                <View style={styles.confirmBalanceBadge}>
                  <Ionicons name="disc" size={14} color={GOLD} />
                  <Text style={styles.confirmBalanceText}>{coins} Coin</Text>
                </View>
              </View>

              <View style={styles.confirmModalActions}>
                <Pressable
                  onPress={handleConfirmAndPayAnalysis}
                  style={({ pressed }) => [styles.confirmPrimaryBtn, pressed && styles.btnPressed]}
                >
                  <LinearGradient
                    colors={['#D97706', '#F59E0B', '#B45309']}
                    style={styles.confirmBtnGradient}
                  >
                    <Ionicons name="sparkles" size={17} color={NIGHT_CARD} />
                    <Text style={styles.confirmPrimaryText}>50 Coin ile Analizi Başlat</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => setConfirmAnalysisModalVisible(false)}
                  style={styles.confirmSecondaryBtn}
                >
                  <Text style={styles.confirmSecondaryText}>Vazgeç</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ⚠️ YETERSİZ COİN UYARI & YÜKLEME MODALI */}
      {insufficientCoinModalVisible && (
        <Modal
          visible={insufficientCoinModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInsufficientCoinModalVisible(false)}
        >
          <View style={styles.confirmModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setInsufficientCoinModalVisible(false)}
            />
            <View style={styles.confirmModalCard}>
              <View style={styles.confirmModalHeader}>
                <Ionicons name="alert-circle" size={32} color="#F59E0B" />
                <Text style={styles.confirmModalTitle}>Yetersiz Coin</Text>
              </View>

              <Text style={styles.confirmModalDesc}>
                Detaylı analiz için 50 coin gerekiyor. Mevcut bakiyen: {coins} coin. Hemen coin yüklemek ister misin?
              </Text>

              <View style={styles.confirmModalActions}>
                <Pressable
                  onPress={() => {
                    setInsufficientCoinModalVisible(false);
                    navigation.navigate('CoinShop');
                  }}
                  style={({ pressed }) => [styles.confirmPrimaryBtn, pressed && styles.btnPressed]}
                >
                  <LinearGradient
                    colors={['#D97706', '#F59E0B', '#B45309']}
                    style={styles.confirmBtnGradient}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={NIGHT_CARD} />
                    <Text style={styles.confirmPrimaryText}>Coin Yükle</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => setInsufficientCoinModalVisible(false)}
                  style={styles.confirmSecondaryBtn}
                >
                  <Text style={styles.confirmSecondaryText}>Vazgeç</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// Ritüel Masasındaki Animasyonlu Kart Yuvası Bileşeni
const RitualSlotItem = React.memo(function RitualSlotItem({
  card,
  index,
  badgeText,
  isPlaced = true,
  isNext = false,
  isRotated = false,
  positionName,
  deck,
  onPress,
}: {
  card?: DrawnCard;
  index: number;
  badgeText?: string;
  isPlaced?: boolean;
  isNext?: boolean;
  isRotated?: boolean;
  positionName?: string;
  deck: CardDeckInfo;
  onPress: () => void;
}) {
  if (isPlaced && card) {
    return (
      <Animated.View
        style={[
          styles.ritualSlotItemWrap,
          {
            opacity: card.dealAnim,
            transform: [
              {
                scale: card.dealAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
              {
                translateY: card.dealAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: isRotated ? [110, 0] : [-30, 0],
                }),
              },
              ...(isRotated ? [{ rotate: '90deg' }] : []),
            ],
          },
        ]}
      >
        <Pressable onPress={onPress} style={styles.ritualCardBtn}>
          <View
            style={[
              styles.ritualIndexBadge,
              { backgroundColor: deck.accent },
              !!badgeText && { width: 'auto', minWidth: 24, paddingHorizontal: 5, borderRadius: 8 },
            ]}
          >
            <Text style={styles.ritualIndexBadgeText}>{badgeText || index + 1}</Text>
          </View>
          {deck.id === 'rune' ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 56, minHeight: 64 }}>
              <RuneStoneItem
                rune={{
                  id: card.id,
                  symbol: card.suitSymbol || 'ᚱ',
                  name: card.name,
                  isReversed: card.isReversed,
                }}
                size="sm"
                revealed={true}
                isReversed={card.isReversed}
                glowColor={deck.accent}
              />
            </View>
          ) : (
            <View
              style={[
                styles.ritualMiniCardBox,
                { borderColor: deck.accent },
                card.isReversed && { transform: [{ rotate: '180deg' }] },
              ]}
            >
              {card.image ? (
                <Image source={card.image} style={styles.ritualMiniCardImg} resizeMode="cover" />
              ) : (
                <View style={styles.ritualMiniPlaceholder}>
                  <Text style={styles.ritualMiniPlaceholderSymbol}>{card.suitSymbol}</Text>
                  <Text style={styles.ritualMiniPlaceholderName} numberOfLines={1}>
                    {card.name}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
        {!isRotated && (
          <>
            <Text style={styles.ritualCardNameText} numberOfLines={1}>
              {card.name}
            </Text>
            <Text style={styles.ritualSlotLabelText} numberOfLines={1}>
              {card.positionName}
            </Text>
          </>
        )}
      </Animated.View>
    );
  }

  // Henüz masaya konmamış boş yuva (Yan / Rotated yuva - 3. Kartın altındaki yatay bekleme alanı)
  if (isRotated) {
    return (
      <Pressable onPress={onPress} style={styles.horizontalWaitingSlotWrap}>
        <View
          style={[
            styles.emptyTableSlotBoxHorizontal,
            { borderColor: isNext ? deck.accent : 'rgba(255, 255, 255, 0.22)' },
            isNext && styles.emptyTableSlotBoxNext,
          ]}
        >
          <View
            style={[
              styles.ritualIndexBadgeHorizontal,
              { backgroundColor: isNext ? deck.accent : 'rgba(255, 255, 255, 0.2)' },
            ]}
          >
            <Text
              style={[
                styles.ritualIndexBadgeText,
                { color: isNext ? NIGHT_CARD : '#FFFFFF' },
              ]}
            >
              2
            </Text>
          </View>
          <MaterialCommunityIcons
            name={isNext ? 'cards-playing' : 'cards-playing-outline'}
            size={16}
            color={isNext ? deck.accent : 'rgba(255, 255, 255, 0.35)'}
          />
          {isNext ? (
            <View style={[styles.emptySlotNextPill, { backgroundColor: deck.accent + '33', borderColor: deck.accent }]}>
              <Text style={[styles.emptySlotNextPillText, { color: deck.accent }]}>2. Sıradaki Kart (Yan)</Text>
            </View>
          ) : (
            <Text style={styles.emptySlotWaitingText}>2. Kart Bekleniyor</Text>
          )}
        </View>
        <Text style={styles.ritualSlotLabelText} numberOfLines={1}>
          {positionName || '2. Engel & Zorluk'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.ritualSlotItemWrap}>
      <View
        style={[
          styles.emptyTableSlotBox,
          { borderColor: isNext ? deck.accent : 'rgba(255, 255, 255, 0.22)' },
          isNext && styles.emptyTableSlotBoxNext,
        ]}
      >
        <View
          style={[
            styles.ritualIndexBadge,
            { backgroundColor: isNext ? deck.accent : 'rgba(255, 255, 255, 0.2)' },
            !!badgeText && { width: 'auto', minWidth: 24, paddingHorizontal: 5, borderRadius: 8 },
          ]}
        >
          <Text
            style={[
              styles.ritualIndexBadgeText,
              { color: isNext ? NIGHT_CARD : '#FFFFFF' },
            ]}
          >
            {badgeText || index + 1}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={deck.id === 'rune' ? 'triangle-outline' : 'cards-outline'}
          size={18}
          color={isNext ? deck.accent : 'rgba(255, 255, 255, 0.3)'}
        />

        {isNext && (
          <View style={[styles.emptySlotNextPill, { backgroundColor: deck.accent + '25', borderColor: deck.accent }]}>
            <Text style={[styles.emptySlotNextPillText, { color: deck.accent }]}>Sıradaki</Text>
          </View>
        )}
      </View>

      <Text style={[styles.emptySlotPosTitle, isNext && { color: deck.accent }]} numberOfLines={1}>
        {positionName || `${index + 1}. Katman`}
      </Text>
      <Text style={[styles.emptySlotWaitingText, isNext && { color: deck.accent, fontWeight: '800' }]}>
        {isNext ? 'Dokun' : 'Bekleniyor'}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#07030F',
  },
  bgFullImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 30, 32, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleBox: {
    alignItems: 'center',
    flex: 1,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  topSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 201, 60, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  upgradeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
  tierIndicator: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  tierIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  setupContainer: {
    marginTop: 10,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    backgroundColor: 'rgba(22, 12, 44, 0.82)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(40, 20, 75, 0.95)',
    borderWidth: 1.8,
  },
  modeButtonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  modeButtonDesc: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 14,
  },
  friendInputCard: {
    backgroundColor: 'rgba(30, 30, 32, 0.9)',
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  friendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendInputTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  friendTextInput: {
    backgroundColor: 'rgba(10, 5, 24, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    borderRadius: 10,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
    textAlignVertical: 'center',
  },
  swapInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  partnerInputBox: {
    flex: 1,
    borderWidth: 1.2,
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  partnerInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  partnerInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  swapPartnersCircleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  swapPartnersCircleGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  swapBtnHintText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  spreadList: {
    gap: 10,
  },
  spreadCard: {
    backgroundColor: 'rgba(22, 12, 44, 0.82)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  spreadCardSelected: {
    backgroundColor: 'rgba(40, 20, 75, 0.95)',
    borderWidth: 1.8,
  },
  spreadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spreadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  spreadCountPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  spreadCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  spreadName: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  spreadDesc: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  layoutOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layoutOptionButton: {
    width: (SCREEN_WIDTH - 40) / 2,
    backgroundColor: 'rgba(22, 12, 44, 0.82)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  layoutOptionActive: {
    backgroundColor: 'rgba(40, 20, 75, 0.95)',
    borderWidth: 1.8,
  },
  layoutOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  layoutOptionDesc: {
    fontSize: 9.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 15,
    marginTop: 10,
  },
  startBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: NIGHT_CARD,
    letterSpacing: 0.3,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  pickContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  pickHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  pickHeaderSubtitle: {
    fontSize: 12.5,
    color: '#E2E8F0',
    fontWeight: '600',
    marginBottom: 14,
  },
  pickingArea: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  autoPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.2,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  autoPickBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  shuffleWrap: {
    width: 140,
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD,
    overflow: 'hidden',
    marginTop: 40,
  },
  shuffleCardBack: {
    width: '100%',
    height: '100%',
  },

  // 1. FullGrid Board Layout (78 Kart Tek Ekranda)
  fullGridBoard: {
    width: '100%',
    backgroundColor: 'rgba(15, 8, 32, 0.8)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    padding: 10,
    alignItems: 'center',
    gap: 8,
  },
  fullGridNotice: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  fullGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
  },
  fullGridCardTile: {
    width: (SCREEN_WIDTH - 50) / 6 - 5,
    height: ((SCREEN_WIDTH - 50) / 6 - 5) * 1.55,
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
  },
  fullGridTilePicked: {
    opacity: 0.35,
    transform: [{ scale: 0.9 }],
  },
  fullGridTileImg: {
    width: '100%',
    height: '100%',
  },
  fullGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Classic Grid Layout
  classicGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 20,
  },
  classicGridCard: {
    width: (SCREEN_WIDTH - 54) / 3,
    height: ((SCREEN_WIDTH - 54) / 3) * 1.6,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
    alignItems: 'center',
  },

  // 3. Fan / Radial Scroll (Sinüzoidal Dalga Masası)
  cardFanScroll: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 36,
    alignItems: 'center',
  },
  fanCard: {
    width: 82,
    height: 138,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  fanCardPicked: {
    opacity: 0.35,
    transform: [{ scale: 0.9 }],
  },
  fanCardPressed: {
    transform: [{ scale: 0.95 }],
  },
  fanCardImg: {
    width: '100%',
    height: '100%',
  },
  fanCardIndexBadge: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  fanCardIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  fanCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  revealAllBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  spreadSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  slotCardWrap: {
    width: (SCREEN_WIDTH - 64) / 2,
    maxWidth: 160,
    alignItems: 'center',
    gap: 6,
  },
  slotPositionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardFlipBox: {
    width: 130,
    height: 200,
  },
  cardFaceBox: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
  },
  cardFrontContent: {
    width: '100%',
    height: '100%',
  },
  cardRealImg: {
    width: '100%',
    height: '100%',
  },
  cardGraphicBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  cardSuitSymbol: {
    fontSize: 42,
  },
  cardRankLabel: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardBottomName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  orientPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  orientText: {
    fontSize: 10,
    fontWeight: '800',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },

  // AI Reading Button (Detaylı Yapay Zeka Fal Yorumu Al)
  aiReadingBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  aiReadingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  aiReadingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiReadingTextWrap: {
    flex: 1,
    gap: 3,
  },
  aiReadingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  aiReadingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: NIGHT_CARD,
    letterSpacing: 0.2,
  },
  aiReadingCostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  aiReadingCostText: {
    fontSize: 11,
    fontWeight: '900',
    color: NIGHT_CARD,
  },
  aiReadingSubtitle: {
    fontSize: 11,
    color: '#3B1E04',
    lineHeight: 15,
    fontWeight: '600',
  },

  // Floating Right Spread View Button (`>` butonu)
  floatingSpreadBtn: {
    position: 'absolute',
    right: 12,
    top: '42%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 99,
  },
  floatingSpreadBtnMini: {
    right: 8,
    borderRadius: 20,
  },
  floatingSpreadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 6,
    gap: 8,
  },
  floatingSpreadGradientMini: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    paddingLeft: 6,
    paddingRight: 6,
    gap: 0,
  },
  floatingSpreadTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingSpreadText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  floatingSpreadArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ritual Spread Fullscreen View
  ritualModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#07030F',
    zIndex: 999,
  },
  ritualTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 201, 60, 0.2)',
  },
  ritualBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  ritualBackText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ritualReplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 201, 60, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  ritualReplayText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
  },
  ritualScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 60,
    alignItems: 'center',
    gap: 16,
  },
  ritualHeader: {
    alignItems: 'center',
    gap: 4,
  },
  ritualMainTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  ritualSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  pistiTableWrapper: {
    width: '100%',
    minHeight: 560,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.7)',
    padding: 16,
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  pistiPlayerSection: {
    width: '100%',
    gap: 8,
  },
  pistiPlayerBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.5)',
  },
  pistiPlayerBadgeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  pistiAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pistiPlayerInfo: {
    gap: 1,
  },
  pistiPlayerName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pistiPlayerRole: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pistiScoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
  },
  pistiScoreChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F43F5E',
  },
  pistiCardsHandRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pistiCardSlotAnim: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 3,
    maxWidth: 100,
  },
  pistiCardPressable: {
    alignItems: 'center',
    gap: 4,
  },
  pistiPosLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F87171',
    textAlign: 'center',
  },
  pistiCardImageFrame: {
    width: 76,
    height: 116,
    borderRadius: 10,
    borderWidth: 1.8,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  pistiCardImg: {
    width: '100%',
    height: '100%',
  },
  pistiPlaceholderCard: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pistiCardName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
  pistiTableCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  pistiCenterWatermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  pistiWatermarkLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  pistiWatermarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  pistiWatermarkText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: 0.8,
  },
  pistiBridgeWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pistiBridgePressable: {
    alignItems: 'center',
    gap: 4,
  },
  pistiBridgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  pistiBridgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
  },
  bridgeCardSlotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bridgeDirectDokunBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  bridgeDirectDokunGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  bridgeDirectDokunText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B0612',
    letterSpacing: 0.3,
  },
  altarClothBoard: {
    width: '100%',
    backgroundColor: 'rgba(16, 9, 36, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
  },

  // 10 Kart Kelt Haçı Geometrisi
  celticCrossBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  celticCrossLeft: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  celticCrossMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  celticCenterStack: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celticCrossCardOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  celticCrossWaitingSlotWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  horizontalWaitingSlotWrap: {
    alignItems: 'center',
    gap: 3,
  },
  emptyTableSlotBoxHorizontal: {
    width: 92,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(15, 7, 28, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: 3,
  },
  ritualIndexBadgeHorizontal: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celticStaffColumn: {
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 201, 60, 0.2)',
  },

  // 5 Kart Haç Geometrisi
  fiveCrossBoard: {
    alignItems: 'center',
    gap: 10,
  },
  fiveCrossMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // 7 Kart At Nalı (Horseshoe) Geometrisi
  horseshoeRitualBoard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  horseshoeArcWrap: {
    width: 310,
    height: 290,
    position: 'relative',
    alignSelf: 'center',
  },
  horseshoeRitualSlot: {
    position: 'absolute',
    alignItems: 'center',
  },

  // Genel Dizi
  generalRitualRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },

  // 9 Kart 3x3 Kutu Geometrisi (Lenormand Kutu Açılımı / Rün Yggdrasil)
  boxRitualBoard: {
    width: '100%',
    gap: 14,
  },
  boxRitualRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },

  // Ritual Slot Item
  ritualSlotItemWrap: {
    alignItems: 'center',
    width: 58,
    gap: 3,
  },
  ritualCardBtn: {
    position: 'relative',
    alignItems: 'center',
  },
  ritualIndexBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualIndexBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: NIGHT_CARD,
  },
  ritualMiniCardBox: {
    width: 48,
    height: 74,
    borderRadius: 6,
    borderWidth: 1.2,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
  },
  ritualMiniCardImg: {
    width: '100%',
    height: '100%',
  },
  ritualMiniPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  ritualMiniPlaceholderSymbol: {
    fontSize: 16,
  },
  ritualMiniPlaceholderName: {
    fontSize: 7.5,
    color: '#CBD5E1',
    fontWeight: '700',
    textAlign: 'center',
  },
  ritualCardNameText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ritualSlotLabelText: {
    fontSize: 8,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Ritual Legend List
  ritualLegendWrap: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  ritualLegendTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
  },
  legendRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendIndexPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendIndexText: {
    fontSize: 11,
    fontWeight: '900',
  },
  legendTextWrap: {
    flex: 1,
    gap: 1,
  },
  legendCardName: {
    fontSize: 12,
    fontWeight: '700',
  },
  legendOrientation: {
    fontSize: 10.5,
    color: TEXT_MUTED,
  },

  // Inspect Modal
  inspectBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 2, 10, 0.92)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inspectCardModal: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#120A24',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    padding: 20,
  },
  inspectCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectScroll: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  inspectPosition: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  inspectTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inspectOrientation: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  inspectImgWrap: {
    width: 130,
    height: 200,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  inspectImg: {
    width: '100%',
    height: '100%',
  },
  inspectPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1038',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  inspectSuit: {
    fontSize: 48,
  },
  inspectPlaceholderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  inspectDesc: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
    textAlign: 'center',
  },
  lexiconWrap: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  friendClientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 201, 60, 0.15)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  friendClientBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  keywordPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  keywordPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  keywordPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  storyCardBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
  },
  storyToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  storyToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyToggleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
  },
  storyBodyText: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 19,
    fontStyle: 'italic',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  lexiconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  lexiconBoxFriend: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  lexiconLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.6,
  },
  lexiconText: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  lockedExplainedBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 10,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: GOLD,
  },
  lockedDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 17,
  },
  upgradeInModalBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  upgradeInModalText: {
    fontSize: 13,
    fontWeight: '900',
    color: NIGHT_CARD,
  },

  // 🪙 Detaylı Analiz & Yetersiz Bakiye Onay Modalı Stilleri
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 12, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1035',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D97706',
    padding: 22,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  confirmModalHeader: {
    alignItems: 'center',
    gap: 8,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GOLD,
    textAlign: 'center',
  },
  confirmModalDesc: {
    fontSize: 13.5,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  confirmBalanceLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  confirmBalanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmBalanceText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: GOLD,
  },
  confirmModalActions: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  confirmPrimaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  confirmPrimaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: NIGHT_CARD,
    letterSpacing: 0.3,
  },
  confirmSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
  },

  // 2'li Karşılaştırmalı Tablo Stilleri (Görsel 3 Düzeltmesi)
  relComparisonTableWrap: {
    width: '100%',
    backgroundColor: 'rgba(15, 8, 30, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    overflow: 'hidden',
  },
  relTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 201, 60, 0.3)',
  },
  relTableColHead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  relTableColHeadText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  relTableCenterColHead: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    paddingVertical: 10,
  },
  relTableCenterColHeadText: {
    fontSize: 9,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
  },
  relTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 52,
  },
  relTableRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  relTableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 3,
  },
  relTableCellCardName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  relOrientationTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  relTagUpright: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  relTagReversed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  relOrientationTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  relTableEmpty: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  relTableCenterCell: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.12)',
    gap: 2,
  },
  relLayerBadge: {
    backgroundColor: 'rgba(255, 201, 60, 0.18)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  relLayerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: GOLD,
  },
  relLayerPosText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontWeight: '600',
  },
  relTableBridgeRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  relTableBridgeInner: {
    alignItems: 'center',
    gap: 4,
  },
  relTableBridgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  relTableBridgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
  },

  // Tam Ekran Uyum Skoru Animasyon Modalı Stilleri
  scoreSplashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070210',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSplashInner: {
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 22,
    paddingVertical: 20,
  },
  scoreSplashHeader: {
    alignItems: 'center',
    gap: 6,
  },
  scoreSplashTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  scoreSplashSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreSplashCircleWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  scoreSplashCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 6, 30, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  scoreSplashNumber: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreSplashPercentLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    marginTop: -2,
  },
  scoreSplashBadgeWrap: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  scoreSplashStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  scoreSplashStatusText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  scoreSplashDesc: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  scoreSplashProceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  scoreSplashProceedBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: NIGHT_CARD,
  },
  lockedModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 16,
  },
  lockedModeTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  lockedModeSub: {
    fontSize: 11.5,
    color: '#CBD5E1',
    marginTop: 2,
    lineHeight: 15,
  },
  relInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 14,
  },
  relInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#FCE7F3',
    lineHeight: 17,
    fontWeight: '600',
  },

  // 🃏 Boş Masa Yuvası & Sıradaki Yuva Stilleri
  emptyTableSlotBox: {
    width: 66,
    height: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(15, 7, 28, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 4,
  },
  emptyTableSlotBoxNext: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    shadowColor: '#FFC93C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  emptySlotNextPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  emptySlotNextPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  emptySlotPosTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    maxWidth: 72,
    marginTop: 4,
  },
  emptySlotWaitingText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },

  // 🌟 Masa ve Banner Stilleri
  tableContainer: {
    paddingBottom: 40,
  },
  tableBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableBannerText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  tableBannerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeSpreadAnimationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
  },
  seeSpreadAnimationBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
  personDockMiddleContainer: {
    backgroundColor: 'rgba(18, 8, 30, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    gap: 8,
  },
  personDockBottomContainer: {
    backgroundColor: 'rgba(12, 18, 36, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 8,
  },
  dockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockCounterText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // 🌟 Alt Sıralı Kart Tepsisi (Dock) Stilleri
  bottomDockContainer: {
    backgroundColor: 'rgba(18, 9, 36, 0.95)',
    borderRadius: 20,
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  dockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockStatusText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
  },
  quickDealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickDealText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dockCardsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dockCardItem: {
    width: 58,
    height: 88,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
    backgroundColor: '#0F081C',
  },
  dockCardCurrent: {
    width: 64,
    height: 94,
    borderWidth: 2,
    shadowColor: '#FFC93C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 8,
  },
  dockCardPlaced: {
    opacity: 0.55,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  dockCardLocked: {
    opacity: 0.4,
  },
  dockCardPressed: {
    transform: [{ scale: 0.94 }],
  },
  dockCardPlacedInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockCardActiveInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  dockCardLockedInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockCardThumbImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    borderRadius: 8,
  },
  dockPlacedCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockPlacedIndexText: {
    position: 'absolute',
    bottom: 3,
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  dockActiveGlowTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    zIndex: 2,
  },
  dockActiveGlowTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: NIGHT_CARD,
    letterSpacing: 0.5,
  },
  dockActivePosText: {
    fontSize: 8.5,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 3,
    borderRadius: 4,
    zIndex: 2,
    maxWidth: 58,
  },
  dockLockedIndexText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 5,
    borderRadius: 4,
  },

  // --- DOCK PERSON TABS ---
  dockPersonTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dockPersonTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dockPersonTabActiveP1: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  dockPersonTabActiveP2: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#F43F5E',
  },
  dockPersonTabActiveBridge: {
    backgroundColor: 'rgba(255, 201, 60, 0.2)',
    borderColor: '#FFC93C',
  },
  dockPersonTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // --- INDIVIDUAL CARDS OVERVIEW (2-COLUMN GRID) ---
  individualCardsSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  individualHeaderBadgeWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  individualHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    backgroundColor: 'rgba(20, 10, 36, 0.85)',
  },
  individualHeaderBadgeText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  twoColumnCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCardItemBox: {
    width: '48%',
    backgroundColor: 'rgba(24, 14, 46, 0.88)',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  gridCardPosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.8,
    marginBottom: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  gridCardPosIndex: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gridCardPosTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  gridCardImageWrapper: {
    width: '100%',
    height: 165,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: '#0F081C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridCardRealImage: {
    width: '100%',
    height: '100%',
  },
  gridCardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardPlaceholderSymbol: {
    fontSize: 28,
    color: '#FFC93C',
  },
  gridCardName: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridCardOrientPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  gridCardOrientText: {
    fontSize: 10,
    fontWeight: '800',
  },
  gridCardConceptualText: {
    fontSize: 11.5,
    color: '#E2E8F0',
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  gridCardKeywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  gridKeywordChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gridKeywordChipText: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  dockActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dockQuickBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  dockQuickBtnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dockQuickBtnTextAlt: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  // Spread animation modal
  spreadModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 1, 8, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  spreadModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0A0515',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    padding: 16,
    gap: 12,
  },
  spreadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spreadModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  spreadModalCloseBtn: {
    padding: 4,
  },
  spreadModalScrollContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  spreadModalTableWrap: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    padding: 14,
    overflow: 'hidden',
  },
  spreadReplayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
  },
  spreadReplayBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFC93C',
  },
  spreadCloseBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spreadCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // --- RELATIONSHIP SYNTHESIS & SCORE HERO ---
  relSynthesisContainer: {
    marginTop: 24,
    gap: 16,
  },
  scoreHeroCard: {
    backgroundColor: '#120A24',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    overflow: 'hidden',
  },
  scoreHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentText: {
    fontSize: 22,
    fontWeight: '900',
  },
  scoreLabelText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  scoreInfo: {
    flex: 1,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 16,
  },

  // --- PAIR BLOCK CARDS (KATMAN SENTEZLERİ) ---
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFC93C',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  pairBlockCard: {
    backgroundColor: 'rgba(18, 10, 36, 0.92)',
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
    gap: 12,
  },
  pairBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pairLevelBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 201, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairLevelNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFC93C',
  },
  pairHeaderTextWrap: {
    flex: 1,
  },
  pairTitle: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  pairPosSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  pairScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  pairScoreText: {
    fontSize: 11,
    fontWeight: '900',
  },

  // --- PAIR FRONT FACE: DUAL CARDS & CONTROLS ---
  pairFrontFaceWrap: {
    gap: 10,
  },
  pairVersusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  pairCardCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 14, 52, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
  },
  pairPersonHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  pairPersonHeaderNameLeft: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  pairPersonHeaderNameRight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F43F5E',
  },
  pairCardImageFrame: {
    width: 78,
    height: 118,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.2,
    backgroundColor: '#0B0612',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pairCardRealImg: {
    width: '100%',
    height: '100%',
  },
  pairCardRuneBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairCardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairCardPlaceholderSym: {
    fontSize: 24,
    color: '#FFC93C',
  },
  pairCardReversedBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pairCardReversedBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pairCardNameTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  pairOrientMiniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  pairOrientMiniText: {
    fontSize: 9,
    fontWeight: '800',
  },
  pairElementMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  pairElementMiniText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  pairKeywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  pairKeywordChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  pairKeywordChipText: {
    fontSize: 8,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  pairCenterControlCol: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  tableMatchPercentLabel: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '700',
  },
  pairFlipCenterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 4,
  },
  pairFlipCenterBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  pairFlipCenterBtnText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#F59E0B',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // --- PAIR BACK FACE: DEEP SYNTHESIS & ADVICE ---
  pairBackFaceWrap: {
    gap: 12,
  },
  pairFlipBackTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 0.8,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pairFlipBackTopText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  synthesisHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pairFlipBackBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  pairFlipBackBottomText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0B0612',
  },

  // --- GRID TABLE MATRIX (LEGACY/BACKFACE ARCHETYPE) ---
  gridTableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 8,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  tableHeaderColMid: {
    width: 80,
    alignItems: 'center',
  },
  tableVsText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFC93C',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#F43F5E',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableDataColLeft: {
    flex: 1,
    gap: 3,
  },
  tableCardNameLeft: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tableElementBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tableElementTextLeft: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  tableDataColMid: {
    width: 60,
    alignItems: 'center',
  },
  tableMatchCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  tableMatchPercent: {
    fontSize: 11,
    fontWeight: '900',
  },
  tableDataColRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  tableCardNameRight: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  tableElementTextRight: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F43F5E',
  },
  tableArchetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tableArchetypeColLeft: {
    flex: 1,
    gap: 2,
  },
  tableArchetypeLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  tableArchetypeText: {
    fontSize: 10.5,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  tableArchetypeColDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 6,
  },
  tableArchetypeColRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },

  // --- ELEMENT SYNERGY BAR & SYNTHESIS & ADVICE ---
  elementSynergyBanner: {
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    gap: 6,
  },
  synergyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  synergyBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFC93C',
  },
  synergyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  synergyFill: {
    height: '100%',
    borderRadius: 3,
  },
  synthesisBox: {
    backgroundColor: 'rgba(15, 8, 30, 0.75)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  synthesisHeading: {
    fontSize: 12,
    fontWeight: '900',
    color: '#C084FC',
  },
  pairSynthesisText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
  },
  pairAdviceBox: {
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    gap: 6,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adviceHeadingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFC93C',
  },
  pairAdviceText: {
    fontSize: 12.5,
    color: '#FDE68A',
    lineHeight: 18.5,
    fontWeight: '600',
  },
  bridgeFrontFaceWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  bridgeCardCol: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 16, 56, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 12,
    gap: 6,
  },
  bridgeCardImageFrame: {
    width: 90,
    height: 135,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#0B0612',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  bridgeCardRealImg: {
    width: '100%',
    height: '100%',
  },
  bridgeFlipActionBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  bridgeFlipActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  bridgeFlipActionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0B0612',
    letterSpacing: 0.3,
  },
});

