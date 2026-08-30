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
import RelationshipSpreadTable from '@/components/RelationshipSpreadTable';
import { analyzeRelationshipSpread } from '@/utils/relationshipCompatibilityEngine';
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
    name: 'Karşılıklı İlişki Aynası (3 + 3 = 6 Kart)',
    cardCount: 6,
    desc: 'Her iki taraf için 3 temel boyut: 1. Zihin, 2. Kalp, 3. Gelecek.',
    positions: ['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek'],
  },
  {
    id: 'rel_bridge_7',
    name: 'Kadersel Köprü Açılımı (3 + 3 + 1 = 7 Kart)',
    cardCount: 7,
    desc: '3+3 Karşılıklı Ayna + Ortak Kadersel Kesişim ve Çiftin Enerji Köprüsü.',
    positions: ['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek', 'Ortak Kadersel Köprü'],
  },
  {
    id: 'rel_mirror_10',
    name: 'Ruh Eşi & 5 Boyutlu Aşk Aynası (5 + 5 = 10 Kart)',
    cardCount: 10,
    desc: '5 derin boyut: 1. Zihin, 2. Kalp, 3. Bilinçaltı/Korkular, 4. Tutku/Çekim, 5. Gelecek/Birlik.',
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
    name: 'Kozmik Çift & İkiz Alev Büyük Kehaneti (10 + 10 = 20 Kart)',
    cardCount: 20,
    desc: 'Dünyanın en kapsamlı 20 kartlık Kelt İkiz Alevi çift açılımı; tüm kadersel boyutlar.',
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
  const { deckId } = route.params;
  const deck: CardDeckInfo = useMemo(() => {
    return POPULAR_CARD_DECKS.find((d) => d.id === deckId) || POPULAR_CARD_DECKS[0];
  }, [deckId]);

  const [tier, setTier] = useState<DeckTier>('none');
  const [coins, setCoins] = useState(100);
  const [showSplash, setShowSplash] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>('self');
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
  const [selectedSpread, setSelectedSpread] = useState<SpreadOption>(SPREAD_OPTIONS[1]); // 3 card default
  const [selectedLayout, setSelectedLayout] = useState<TarotLayoutId>('fullgrid');
  const [phase, setPhase] = useState<'setup' | 'shuffling' | 'picking' | 'table'>('setup');
  const [showRitualSpread, setShowRitualSpread] = useState(false);
  const [isFloatingExpanded, setIsFloatingExpanded] = useState(true);
  const [deckPool, setDeckPool] = useState<DeckCardItem[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [inspectedCard, setInspectedCard] = useState<DrawnCard | null>(null);
  const [showStoryDetail, setShowStoryDetail] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [confirmAnalysisModalVisible, setConfirmAnalysisModalVisible] = useState(false);
  const [insufficientCoinModalVisible, setInsufficientCoinModalVisible] = useState(false);

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
      const entries = Object.entries(katinaData as any);
      return entries.map(([key, val]: [string, any]) => {
        const isKupa = key.startsWith('kupa');
        const isKaro = key.startsWith('karo');
        const isSinek = key.startsWith('sinek');
        const symbol = isKupa ? '♥' : isKaro ? '♦' : isSinek ? '♣' : '♠';
        const color = isKupa || isKaro ? '#E11D48' : '#10B981';
        return {
          id: key,
          name: key.replace('-', ' ').toUpperCase(),
          suitSymbol: symbol,
          rankLabel: symbol,
          themeColor: color,
        };
      });
    }

    if (deck.id === 'lenormand') {
      return LENORMAND_FULL_CARDS.map((c) => ({
        id: c.id,
        name: c.name,
        suitSymbol: c.symbol,
        rankLabel: 'Lenormand',
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

  useEffect(() => {
    if (showRitualSpread) {
      playRitualDealingAnimation();
    }
  }, [showRitualSpread, playRitualDealingAnimation]);

  // Kart Anlamını Çek (Kişisel vs Karşılıklı Uyum Ayrımıyla)
  const getCardDetails = (cardId: string) => {
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

    // 2. Runes
    if (deck.id === 'rune') {
      const rList = (runesData as any).runes || [];
      const rune = rList.find((r: any) => r.id === cardId);
      if (rune) {
        return {
          upright: rune.upright,
          reversed: rune.reversed,
          love: isRelationship
            ? `${targetName}'e söyle: 'Aşk hayatında kadersel bir dönüm noktası ve sağlamlaşma var.'`
            : `Bu rün aşkta güçlü bir dönüm noktasını ve kararlılığı simgeliyor.`,
          career: rune.meaning,
          advice: isRelationship
            ? `🗣️ Rehberlik: 'Ona de ki: ${rune.advice}'`
            : rune.advice,
          story: `Elder Futhark alfabesinde ${rune.name} rünü, Viking bilgeliğinde kaderin dokusunu değiştiren kadim kozmik güçleri simgeler.`,
          keywords: [rune.name, 'Viking Gücü', 'Koruma', 'Kader'],
        };
      }
    }

    // 3. Iskambil
    if (deck.id === 'iskambil') {
      const isItem = (iskambilData as any)[cardId];
      if (isItem) {
        return {
          upright: isItem.meaning,
          reversed: `Enerjinin dengelenmesi gerekiyor; tedbiri elden bırakma.`,
          love: isItem.element || isItem.meaning,
          career: isItem.figure ? `Etkili figür: ${isItem.figure}` : 'Maddi fırsat kapısı',
          advice: isRelationship
            ? `🗣️ Rehberlik: '${targetName}, kartın sana uyarısı: ${isItem.advice}'`
            : isItem.advice,
          story: `Saray iskambil falında bu kart, hanedanların kader kararlarında baktığı geleneksel kartomansi sembollerindendir.`,
          keywords: [isItem.name || 'Saray Kartı', 'Hanedan', 'Kader'],
        };
      }
    }

    // 4. Katina
    if (deck.id === 'katina') {
      const kat = (katinaData as any)[cardId];
      if (kat) {
        return {
          upright: kat,
          reversed: `İlişkide geçici bir tıkanıklık ya da bekleyiş enerjisi hakim.`,
          love: isRelationship
            ? `${targetName}'e söyle: '${kat}'`
            : kat,
          career: `Maddi konularda stratejik ve sabırlı olma dönemi.`,
          advice: isRelationship
            ? `🗣️ Rehberlik: 'Aklındaki kişiyle ilgili sezgilerine güvenmesini ve fevri olmamasını söyle.'`
            : `Kalbinin sesine güven, acele kararlardan kaçın.`,
          story: `Deste-i Katina, İzmir ve Ege saraylarının aşk, tutku ve ruh eşi bağlarını en berrak gösteren efsanevi aşk kehanet destesi olarak bilinir.`,
          keywords: ['Aşk & Tutku', 'Ruh Eşi', 'Gizli Hisler', 'Yüzleşme'],
        };
      }
    }

    // 5. Lenormand
    if (deck.id === 'lenormand') {
      const len = LENORMAND_FULL_CARDS.find((l) => l.id === cardId);
      if (len) {
        return {
          upright: len.desc,
          reversed: `Gelişmeler biraz zaman alabilir; detayları gözden kaçırma.`,
          love: isRelationship
            ? `${targetName}'e müjdele: 'İlişkinizde somut ve sevindirici gelişmeler çok yakın.'`
            : `İlişkinizde somut ve net gelişmelerin yaşanacağı bir dönem.`,
          career: len.desc,
          advice: isRelationship
            ? `🗣️ Rehberlik: 'Ona işaretleri doğru okumasını ve fırsatları kaçırmamasını tembihle.'`
            : `İşaretleri doğru oku ve pratik çözümlere odaklan.`,
          story: `Mlle Lenormand'ın 19. yüzyıl Paris saraylarında Napolyon ve aristokratlara baktığı doğrudan, somut ve şaşmaz kehanet kartı.`,
          keywords: [len.name, 'Somut İşaret', 'Haber', 'Netlik'],
        };
      }
    }

    // 6. Osho Zen
    if (deck.id === 'osho_zen') {
      const zen = OSHO_ZEN_FULL_CARDS.find((z) => z.id === cardId);
      if (zen) {
        return {
          upright: zen.desc,
          reversed: `Zihnin karmaşasından uzaklaşıp sadece nefesine ve ana odaklan.`,
          love: `Kelimelerin ötesinde derin bir ruhsal uyum ve kabulleniş.`,
          career: `Yaratıcılığını serbest bırak, alışılmış kalıpların dışına çık.`,
          advice: isRelationship
            ? `🗣️ Rehberlik: '${targetName}, hayatın akışına direnme, her şey kendi zamanında olgunlaşıyor de.'`
            : `Her şey tam da olması gerektiği gibi akıyor; güven.`,
          story: `Zen bilgeliğinde her kart, zihnin illüzyonlarını aşarak 'Şimdi'nin saf farkındalığına ve içsel aydınlanmaya uyanışın bir kapısıdır.`,
          keywords: ['Farkındalık', 'İç Huzur', 'Dönüşüm', 'Akış'],
        };
      }
    }

    // 7. Thoth
    if (deck.id === 'thoth_egypt') {
      const th = THOTH_FULL_CARDS.find((t) => t.id === cardId);
      if (th) {
        return {
          upright: th.desc,
          reversed: `Görünenin ardındaki gizli sırları ve niyetleri fark et.`,
          love: `Kadersel bağlar ve derin bir ruhsal çekim enerjisi.`,
          career: `Bilgelik ve stratejiyle büyük bir başarı inşa etme fırsatı.`,
          advice: isRelationship
            ? `🗣️ Rehberlik: 'Ona içindeki gücü hatırlat, kadersel terazide hak ettiği sonuç yakında de.'`
            : `İçindeki kadim simyaya ve sezgilerine güven.`,
          story: `Antik Mısır tapınaklarının İskenderiye Hermetizmi ile harmanlandığı, ilahi yazman Thoth ve Anubis'in hakikat terazisini yansıtan ezoterik arketip.`,
          keywords: ['Antik Mısır', 'Simya', 'Hakikat Terazisi', 'Kozmik'],
        };
      }
    }

    // 8. Tarot (Modern, Otantik ve Zengin Ezoterik Yorumlar)
    const modern = getModernTarotMeaning(cardId);
    const tarotMeaning = getTarotMeaning(cardId);
    const keywords = getTarotKeywordList(cardId, 'upright');
    const lexiconDeck = (cardDecksLexicon as any).tarot || {};
    const lex = lexiconDeck[cardId];

    if (modern) {
      return {
        upright: modern.upright,
        reversed: modern.reversed,
        love: isRelationship ? `${targetName}'in kalbindeki yansıma: ${modern.love}` : modern.love,
        career: isRelationship ? `${targetName} için kadersel vizyon: ${modern.career}` : modern.career,
        advice: isRelationship ? `🗣️ Rehberlik: '${modern.advice}'` : modern.advice,
        story: modern.story,
        keywords: modern.keywords.length > 0 ? modern.keywords : keywords,
      };
    }

    if (tarotMeaning || lex) {
      const cleanUpright = tarotMeaning?.upright || lex?.upright || 'Doğrudan aydınlık ve açılan kapılar.';
      return {
        upright: cleanUpright,
        reversed: tarotMeaning?.reversed || lex?.reversed || 'İçsel gecikme veya dönüşüm sınavı.',
        love: isRelationship
          ? `${targetName}'in kalbindeki yansıma: ${lex?.love || 'Aşk ve duygusal çekimde önemli bir dönüm noktası.'}`
          : lex?.love || 'Aşk ve duygusal çekimde önemli bir dönüm noktası.',
        career: isRelationship
          ? `${targetName} için gelecek vizyonu: ${lex?.career || 'Hedeflerinize ulaşırken kararlılık ve sağduyu ile hareket etme vakti.'}`
          : lex?.career || 'Hedeflerinize ulaşırken kararlılık ve sağduyu ile hareket etme vakti.',
        advice: isRelationship
          ? `🗣️ Rehberlik: '${lex?.advice || 'Sezgilerinize ve kalbinizin rehberliğine güvenin.'}'`
          : lex?.advice || 'Sezgilerinize ve kalbinizin rehberliğine güvenin.',
        story: tarotMeaning?.story || `${cardId} kartı, Tarot'un kadim arkana yolculuğunda önemli bir kadersel basamağı simgeler.`,
        keywords: keywords.length > 0 ? keywords : ['Kader', 'Arkana', 'Aydınlanma'],
      };
    }

    return null;
  };

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

    const targetSpreadId = allCards.length as any;
    navigation.navigate('TarotResult', {
      spreadId: targetSpreadId,
      picks: mappedPicks,
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
            <Text style={styles.sectionLabel}>1. FAL MODUNU SEÇ</Text>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => {
                  setReadingMode('self');
                  setSelectedSpread(SPREAD_OPTIONS[1]);
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
            </View>

            {/* Karşılıklı Uyum Moduna Özel Çift Bilgi Girişi */}
            {readingMode === 'relationship' && (
              <View style={[styles.friendInputCard, { borderColor: deck.accent + '66' }]}>
                <View style={styles.friendHeaderRow}>
                  <MaterialCommunityIcons name="heart-pulse" size={18} color={deck.accent} />
                  <Text style={[styles.friendInputTitle, { color: deck.accent }]}>
                    Karşılıklı Uyum Çift Bilgileri
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: deck.accent, fontWeight: '700', marginBottom: 4 }}>1. Kişi (Sen / Üst)</Text>
                    <TextInput
                      placeholder="İsminiz (Örn: Hakan)"
                      placeholderTextColor={TEXT_MUTED}
                      value={p1Name}
                      onChangeText={setP1Name}
                      style={styles.friendTextInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#E08A8A', fontWeight: '700', marginBottom: 4 }}>2. Kişi (Partner / Alt)</Text>
                    <TextInput
                      placeholder="Partnerin İsmi (Örn: Ayşe)"
                      placeholderTextColor={TEXT_MUTED}
                      value={p2Name}
                      onChangeText={setP2Name}
                      style={styles.friendTextInput}
                    />
                  </View>
                </View>
                <TextInput
                  placeholder="İlişki Niyeti / Odak (Örn: Aşk & Evlilik Uyumu, Geleceğimiz)..."
                  placeholderTextColor={TEXT_MUTED}
                  value={relFocus}
                  onChangeText={setRelFocus}
                  style={[styles.friendTextInput, { marginTop: 6 }]}
                />
              </View>
            )}

            {/* 2. Açılım Tipi Seçimi */}
            <Text style={styles.sectionLabel}>2. AÇILIM VE KART SAYISINI SEÇ</Text>
            <View style={styles.spreadList}>
              {(readingMode === 'relationship' ? RELATIONSHIP_SPREAD_OPTIONS : SPREAD_OPTIONS).map((spread) => {
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
                      <View style={styles.spreadTitleRow}>
                        <View style={[styles.spreadCountPill, { backgroundColor: deck.accent + '25' }]}>
                          <Text style={[styles.spreadCountText, { color: deck.accent }]}>
                            {spread.cardCount} Kart
                          </Text>
                        </View>
                        <Text style={[styles.spreadName, isSelected && { color: deck.accent }]}>
                          {spread.name}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={deck.accent} />}
                    </View>
                    <Text style={styles.spreadDesc}>{spread.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 3. Kart Dizilim Düzeni */}
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

            {/* Masaya Aç Butonu */}
            <Pressable
              onPress={startShuffle}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: deck.accent },
                pressed && styles.btnPressed,
              ]}
            >
              <MaterialCommunityIcons name="cards-playing-outline" size={22} color={NIGHT_CARD} />
              <Text style={styles.startBtnText}>Desteyi Karıştır ve Masaya Aç ({deckPool.length} Kart)</Text>
              <Ionicons name="arrow-forward" size={18} color={NIGHT_CARD} />
            </Pressable>
          </View>
        )}

        {/* PHASE 2: SHUFFLING & PICKING (KARIŞTIRMA VE KART SEÇİMİ) */}
        {(phase === 'shuffling' || phase === 'picking') && (
          <View style={styles.pickContainer}>
            <Text style={[styles.pickHeaderTitle, { color: deck.accent }]}>
              {phase === 'shuffling'
                ? 'Deste Karıştırılıyor & Enerjiler Arınıyor...'
                : readingMode === 'relationship'
                ? relTurn === 'p1'
                  ? `✨ 1. TUR: ${p1Name} 3 Kart Seçiyor (${p1DrawnCards.length}/3)`
                  : relTurn === 'transition'
                  ? `💖 ${p1Name}'in kartları seçildi! Şimdi telefonu ${p2Name}'e verin.`
                  : relTurn === 'p2'
                  ? `✨ 2. TUR: ${p2Name} 3 Kart Seçiyor (${p2DrawnCards.length}/3)`
                  : `🔮 ORTAK TUR: Kadersel Köprü Kartını Seçin`
                : `Niyetine odaklan ve ${selectedSpread.cardCount - drawnCards.length} kart seç`}
            </Text>
            <Text style={styles.pickHeaderSubtitle}>
              {readingMode === 'relationship'
                ? relTurn === 'p1'
                  ? `Sırayla: ${['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek'][p1DrawnCards.length] || 'Hazır'}`
                  : relTurn === 'p2'
                  ? `Sırayla: ${['1. Zihin & Düşünce', '2. Kalp & Hisler', '3. Beklenti & Gelecek'][p2DrawnCards.length] || 'Hazır'}`
                  : relTurn === 'transition'
                  ? `Şimdi telefonu ${p2Name}'e verin`
                  : 'Ortak Kadersel Kesişim Kartı'
                : `${drawnCards.length} / ${selectedSpread.cardCount} Kart Seçildi · (Deste: ${deckPool.length} Kart)`}
            </Text>

            {phase === 'shuffling' ? (
              <Animated.View
                style={[
                  styles.shuffleWrap,
                  {
                    transform: [{ rotate: shuffleSpin }, { scale: shuffleScale }],
                  },
                ]}
              >
                <Image source={deck.cardBackImage} style={styles.shuffleCardBack} resizeMode="cover" />
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
                        : `Kalan ${selectedSpread.cardCount - drawnCards.length} Kartı Rastgele Çek 🎲`}
                    </Text>
                  </Pressable>
                )}

                {/* 1. DİZİLİM: BÜYÜK MASA IZGARASI (GENİŞ VE FERAH DÜZEN) */}
                {selectedLayout === 'fullgrid' && (
                  <View style={styles.fullGridBoard}>
                    <Text style={styles.fullGridNotice}>Kartlar geniş masaya dizildi, hissettiğine dokun:</Text>
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
                              isPicked && styles.fullGridTilePicked,
                              { borderColor: isPicked ? GOLD : 'rgba(242, 200, 121, 0.3)' },
                            ]}
                          >
                            <Image source={deck.cardBackImage} style={styles.fullGridTileImg} resizeMode="cover" />
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
                            isPicked && styles.fanCardPicked,
                          ]}
                        >
                          <Image source={deck.cardBackImage} style={styles.fanCardImg} resizeMode="cover" />
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
                            selectedLayout === 'fan' && {
                              transform: [{ translateY: rise }, { rotate: `${angle}deg` }],
                              marginLeft: index === 0 ? 12 : -22,
                              zIndex: index + 1,
                            },
                            isPicked && styles.fanCardPicked,
                            pressed && styles.fanCardPressed,
                          ]}
                        >
                          <Image source={deck.cardBackImage} style={styles.fanCardImg} resizeMode="cover" />
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
              </View>
            )}
          </View>
        )}

        {/* PHASE 3: MASADAKİ KARTLAR (TABLE VIEW) */}
        {phase === 'table' && readingMode === 'relationship' && (
          <RelationshipSpreadTable
            p1Name={p1Name}
            p2Name={p2Name}
            p1Cards={p1DrawnCards.map((c) => ({
              id: c.id,
              name: c.name,
              image: c.image,
              orientation: c.isReversed ? 'reversed' : 'upright',
              keywords: getCardDetails(c.id)?.keywords,
              story: getCardDetails(c.id)?.story,
            }))}
            p2Cards={p2DrawnCards.map((c) => ({
              id: c.id,
              name: c.name,
              image: c.image,
              orientation: c.isReversed ? 'reversed' : 'upright',
              keywords: getCardDetails(c.id)?.keywords,
              story: getCardDetails(c.id)?.story,
            }))}
            bridgeCard={bridgeDrawnCard ? {
              id: bridgeDrawnCard.id,
              name: bridgeDrawnCard.name,
              image: bridgeDrawnCard.image,
              orientation: bridgeDrawnCard.isReversed ? 'reversed' : 'upright',
              keywords: getCardDetails(bridgeDrawnCard.id)?.keywords,
              story: getCardDetails(bridgeDrawnCard.id)?.story,
            } : undefined}
            accentColor={deck.accent}
            onNewReading={() => {
              setPhase('setup');
              setP1DrawnCards([]);
              setP2DrawnCards([]);
              setBridgeDrawnCard(null);
              setRelTurn('p1');
            }}
            onRequestDetailedAI={handleLaunchAiReading}
          />
        )}

        {phase === 'table' && readingMode === 'self' && (
          <View style={styles.tableContainer}>
            <View style={styles.tableBanner}>
              <MaterialCommunityIcons name="star-face" size={20} color={deck.accent} />
              <Text style={[styles.tableBannerText, { color: deck.accent }]}>
                Kartların üzerine dokunarak çevir ve detaylı incele
              </Text>
            </View>

            {/* Hızlı Tümünü Aç Butonu */}
            {!allRevealed && (
              <Pressable onPress={revealAllCards} style={[styles.revealAllBtn, { borderColor: deck.accent }]}>
                <Ionicons name="eye-outline" size={15} color={deck.accent} />
                <Text style={[styles.revealAllBtnText, { color: deck.accent }]}>Tüm Kartları Çevir & Aç</Text>
              </Pressable>
            )}

            {/* Kart Yuvaları */}
            <View style={styles.spreadSlotsContainer}>
              {drawnCards.map((card, idx) => {
                const rotateY = card.flipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                });

                return (
                  <View key={`${card.id}-${idx}`} style={styles.slotCardWrap}>
                    <Text style={[styles.slotPositionTitle, { color: deck.accent }]}>
                      {card.positionName}
                    </Text>

                    <Pressable
                      onPress={() => {
                        if (!card.isRevealed) {
                          revealCard(idx);
                        } else {
                          setInspectedCard(card);
                        }
                      }}
                      style={styles.cardFlipBox}
                    >
                      <Animated.View
                        style={[
                          styles.cardFaceBox,
                          {
                            borderColor: deck.accent,
                            transform: [{ rotateY }],
                          },
                        ]}
                      >
                        {card.isRevealed ? (
                          <View
                            style={[
                              styles.cardFrontContent,
                              card.isReversed && { transform: [{ rotate: '180deg' }] },
                            ]}
                          >
                            {card.image ? (
                              <Image source={card.image} style={styles.cardRealImg} resizeMode="cover" />
                            ) : (
                              <LinearGradient
                                colors={['rgba(36, 20, 68, 0.95)', 'rgba(18, 9, 36, 0.98)']}
                                style={styles.cardGraphicBox}
                              >
                                <Text style={[styles.cardSuitSymbol, { color: card.themeColor || deck.accent }]}>
                                  {card.suitSymbol}
                                </Text>
                                <Text style={[styles.cardRankLabel, { color: deck.accent }]}>
                                  {card.name}
                                </Text>
                              </LinearGradient>
                            )}
                          </View>
                        ) : (
                          <Image source={deck.cardBackImage} style={styles.cardRealImg} resizeMode="cover" />
                        )}
                      </Animated.View>
                    </Pressable>

                    {/* Kart İsmi & Durumu */}
                    <Text style={styles.cardBottomName} numberOfLines={2}>
                      {card.isRevealed ? card.name : 'Açmak için dokun'}
                    </Text>
                    {card.isRevealed && (
                      <View
                        style={[
                          styles.orientPill,
                          { backgroundColor: card.isReversed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.orientText,
                            { color: card.isReversed ? '#F87171' : '#34D399' },
                          ]}
                        >
                          {card.isReversed ? 'Ters Açıldı' : 'Düz Açıldı'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* 1. Buton: Falı Tamamla & Yeni Açılım Yap */}
            <Pressable
              onPress={() => {
                setPhase('setup');
                setDrawnCards([]);
              }}
              style={styles.resetBtn}
            >
              <Ionicons name="refresh" size={18} color={GOLD} />
              <Text style={styles.resetBtnText}>Falı Tamamla & Yeni Açılım Yap</Text>
            </Pressable>

            {/* 2. Buton: DAHA DETAYLI ANALİZ AL (50 COIN) */}
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
        )}
      </ScrollView>

      {/* SAĞ TARAFTA YÜZEN MASADAKİ DİZİLİMİ GÖR `>` BUTONU */}
      {phase === 'table' && !showRitualSpread && (
        <Pressable
          onPress={() => setShowRitualSpread(true)}
          style={[
            styles.floatingSpreadBtn,
            !isFloatingExpanded && styles.floatingSpreadBtnMini,
            { borderColor: deck.accent },
          ]}
        >
          <LinearGradient
            colors={['rgba(32, 18, 64, 0.95)', 'rgba(16, 8, 36, 0.98)']}
            style={[
              styles.floatingSpreadGradient,
              !isFloatingExpanded && styles.floatingSpreadGradientMini,
            ]}
          >
            {isFloatingExpanded && (
              <View style={styles.floatingSpreadTextWrap}>
                <MaterialCommunityIcons name="cards-playing" size={16} color={deck.accent} />
                <Text style={[styles.floatingSpreadText, { color: deck.accent }]}>
                  Masadaki Dizilimi Gör
                </Text>
              </View>
            )}
            <View style={[styles.floatingSpreadArrow, { backgroundColor: deck.accent }]}>
              <Ionicons name="chevron-forward" size={18} color={NIGHT_CARD} />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* MASADAKİ DİZİLİMİ GÖR — MİSTİK MASA SERİM RİTÜELİ TAM EKRAN GÖRÜNÜMÜ */}
      {showRitualSpread && (
        <View style={styles.ritualModalBackdrop}>
          <Image source={deck.sectionBg} style={styles.bgFullImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(6, 2, 14, 0.85)', 'rgba(12, 6, 24, 0.92)', 'rgba(6, 2, 12, 0.98)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Üst Bar: Geri Dön & Yeniden Ser */}
          <View style={styles.ritualTopBar}>
            <Pressable
              onPress={() => setShowRitualSpread(false)}
              style={styles.ritualBackBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={deck.accent} />
              <Text style={[styles.ritualBackText, { color: deck.accent }]}>Kart Detaylarına Dön</Text>
            </Pressable>

            <Pressable onPress={playRitualDealingAnimation} style={styles.ritualReplayBtn}>
              <Ionicons name="refresh" size={15} color={GOLD} />
              <Text style={styles.ritualReplayText}>Dizilimi Yeniden İzle</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.ritualScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.ritualHeader}>
              <Text style={[styles.ritualMainTitle, { color: deck.accent }]}>
                {selectedSpread.name} Masadaki Dizilimi
              </Text>
              <Text style={styles.ritualSubtitle}>
                Kartların masaya konma sırası ve kadersel yerleşim kuralları:
              </Text>
            </View>

            {/* 1. EĞER KARŞILIKLI UYUM AÇILIMI İSE (ÇİFT MASA DÜZENİ) */}
            {readingMode === 'relationship' ? (
              <View style={styles.pistiTableWrapper}>
                <CornerTicks />
                {/* Lüks Yeşil Çuha Masası Gradyanı */}
                <LinearGradient
                  colors={['#0F3822', '#0A2617', '#04130A']}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                />

                {/* --- ÜST BÖLÜM: 2. KİŞİ (PARTNER) --- */}
                <View style={styles.pistiPlayerSection}>
                  <View style={styles.pistiPlayerBadgeTop}>
                    <View style={styles.pistiAvatarCircle}>
                      <MaterialCommunityIcons name="account-heart" size={22} color="#F43F5E" />
                    </View>
                    <View style={styles.pistiPlayerInfo}>
                      <Text style={styles.pistiPlayerName} numberOfLines={1}>{p2Name.trim() || '2. Kişi (Partner)'}</Text>
                      <Text style={styles.pistiPlayerRole}>Partner (Karşı Taraf)</Text>
                    </View>
                    <View style={styles.pistiScoreChip}>
                      <Text style={styles.pistiScoreChipText}>{p2DrawnCards.length} Kart</Text>
                    </View>
                  </View>

                  {/* 20 KARTLIK (10+10) İSE: PARTNER KELT HAÇI GEOMETRİSİ */}
                  {selectedSpread.id === 'rel_cosmic_20' && p2DrawnCards.length >= 10 ? (
                    <View style={styles.celticCrossBoard}>
                      {/* Sol Haç Bölümü */}
                      <View style={styles.celticCrossLeft}>
                        {/* Kart 5: Taç / Olası Gelecek */}
                        <RitualSlotItem card={p2DrawnCards[4]} index={4} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[4])} />
                        {/* Orta Satır: Kart 4 (Sol), Kart 1 & 2 (Merkez Çapraz), Kart 6 (Sağ) */}
                        <View style={styles.celticCrossMidRow}>
                          <RitualSlotItem card={p2DrawnCards[3]} index={3} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[3])} />
                          <View style={styles.celticCenterStack}>
                            <RitualSlotItem card={p2DrawnCards[0]} index={0} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[0])} />
                            {p2DrawnCards[1] && (
                              <Animated.View
                                style={[
                                  styles.celticCrossCardOverlay,
                                  {
                                    opacity: p2DrawnCards[1].dealAnim,
                                    transform: [
                                      {
                                        scale: p2DrawnCards[1].dealAnim.interpolate({
                                          inputRange: [0, 1],
                                          outputRange: [0.6, 1],
                                        }),
                                      },
                                      { rotate: '90deg' },
                                    ],
                                  },
                                ]}
                              >
                                <Pressable onPress={() => setInspectedCard(p2DrawnCards[1])}>
                                  <Image
                                    source={p2DrawnCards[1].image || deck.cardBackImage}
                                    style={styles.ritualMiniCardImg}
                                    resizeMode="cover"
                                  />
                                </Pressable>
                              </Animated.View>
                            )}
                          </View>
                          <RitualSlotItem card={p2DrawnCards[5]} index={5} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[5])} />
                        </View>
                        {/* Kart 3: Bilinçaltı & Kök Temel */}
                        <RitualSlotItem card={p2DrawnCards[2]} index={2} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[2])} />
                      </View>
                      {/* Sağ Sütun / Asa (Kart 10, 9, 8, 7) */}
                      <View style={styles.celticStaffColumn}>
                        {[9, 8, 7, 6].map((slotIdx) => {
                          const c = p2DrawnCards[slotIdx];
                          if (!c) return null;
                          return <RitualSlotItem key={`p2-staff-${slotIdx}`} card={c} index={slotIdx} deck={deck} onPress={() => setInspectedCard(c)} />;
                        })}
                      </View>
                    </View>
                  ) : selectedSpread.id === 'rel_mirror_10' && p2DrawnCards.length >= 5 ? (
                    /* 10 KARTLIK (5+5) İSE: PARTNER 5-KART HAÇ GEOMETRİSİ */
                    <View style={styles.fiveCrossBoard}>
                      <RitualSlotItem card={p2DrawnCards[1]} index={1} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[1])} />
                      <View style={styles.fiveCrossMidRow}>
                        <RitualSlotItem card={p2DrawnCards[2]} index={2} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[2])} />
                        <RitualSlotItem card={p2DrawnCards[0]} index={0} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[0])} />
                        <RitualSlotItem card={p2DrawnCards[3]} index={3} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[3])} />
                      </View>
                      <RitualSlotItem card={p2DrawnCards[4]} index={4} deck={deck} onPress={() => setInspectedCard(p2DrawnCards[4])} />
                    </View>
                  ) : (
                    /* 6 & 7 KARTLIK İSE: PARTNER 3-KART EL DİZİLİMİ */
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pistiCardsHandRow}>
                      {p2DrawnCards.map((card, idx) => (
                        <Animated.View
                          key={`p2_deal_${card.id}_${idx}`}
                          style={[
                            styles.pistiCardSlotAnim,
                            {
                              opacity: card.dealAnim,
                              transform: [
                                {
                                  translateY: card.dealAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-50, 0],
                                  }),
                                },
                                {
                                  scale: card.dealAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.6, 1],
                                  }),
                                },
                              ],
                            },
                          ]}
                        >
                          <Pressable
                            onPress={() => setInspectedCard(card)}
                            style={styles.pistiCardPressable}
                          >
                            <Text style={styles.pistiPosLabel}>
                              {selectedSpread.positions[idx] || `${idx + 1}. Katman`}
                            </Text>
                            <View style={[styles.pistiCardImageFrame, { borderColor: 'rgba(244, 63, 94, 0.8)' }]}>
                              {card.image ? (
                                <Image source={card.image} style={styles.pistiCardImg} resizeMode="cover" />
                              ) : (
                                <View style={styles.pistiPlaceholderCard}>
                                  <MaterialCommunityIcons name="cards-outline" size={22} color="#F43F5E" />
                                </View>
                              )}
                            </View>
                            <Text style={styles.pistiCardName} numberOfLines={1}>{card.name}</Text>
                          </Pressable>
                        </Animated.View>
                      ))}
                    </ScrollView>
                  )}
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

                  {/* Varsa Ortak Köprü Kartı */}
                  {bridgeDrawnCard && (
                    <Animated.View
                      style={[
                        styles.pistiBridgeWrap,
                        {
                          opacity: bridgeDrawnCard.dealAnim,
                          transform: [
                            {
                              scale: bridgeDrawnCard.dealAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => setInspectedCard(bridgeDrawnCard)}
                        style={styles.pistiBridgePressable}
                      >
                        <View style={styles.pistiBridgePill}>
                          <Ionicons name="sparkles" size={12} color={GOLD} />
                          <Text style={styles.pistiBridgePillText}>Ortak Kadersel Köprü</Text>
                        </View>
                        <View style={[styles.pistiCardImageFrame, { borderColor: GOLD, width: 68, height: 102 }]}>
                          {bridgeDrawnCard.image ? (
                            <Image source={bridgeDrawnCard.image} style={styles.pistiCardImg} resizeMode="cover" />
                          ) : (
                            <View style={styles.pistiPlaceholderCard}>
                              <MaterialCommunityIcons name="cards" size={24} color={GOLD} />
                            </View>
                          )}
                        </View>
                        <Text style={[styles.pistiCardName, { color: GOLD }]} numberOfLines={1}>
                          {bridgeDrawnCard.name}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>

                {/* --- ALT BÖLÜM: 1. KİŞİ (SEN) --- */}
                <View style={styles.pistiPlayerSection}>
                  {/* 20 KARTLIK (10+10) İSE: DANIŞAN KELT HAÇI GEOMETRİSİ */}
                  {selectedSpread.id === 'rel_cosmic_20' && p1DrawnCards.length >= 10 ? (
                    <View style={styles.celticCrossBoard}>
                      {/* Sol Haç Bölümü */}
                      <View style={styles.celticCrossLeft}>
                        {/* Kart 5: Taç / Olası Gelecek */}
                        <RitualSlotItem card={p1DrawnCards[4]} index={4} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[4])} />
                        {/* Orta Satır: Kart 4 (Sol), Kart 1 & 2 (Merkez Çapraz), Kart 6 (Sağ) */}
                        <View style={styles.celticCrossMidRow}>
                          <RitualSlotItem card={p1DrawnCards[3]} index={3} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[3])} />
                          <View style={styles.celticCenterStack}>
                            <RitualSlotItem card={p1DrawnCards[0]} index={0} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[0])} />
                            {p1DrawnCards[1] && (
                              <Animated.View
                                style={[
                                  styles.celticCrossCardOverlay,
                                  {
                                    opacity: p1DrawnCards[1].dealAnim,
                                    transform: [
                                      {
                                        scale: p1DrawnCards[1].dealAnim.interpolate({
                                          inputRange: [0, 1],
                                          outputRange: [0.6, 1],
                                        }),
                                      },
                                      { rotate: '90deg' },
                                    ],
                                  },
                                ]}
                              >
                                <Pressable onPress={() => setInspectedCard(p1DrawnCards[1])}>
                                  <Image
                                    source={p1DrawnCards[1].image || deck.cardBackImage}
                                    style={styles.ritualMiniCardImg}
                                    resizeMode="cover"
                                  />
                                </Pressable>
                              </Animated.View>
                            )}
                          </View>
                          <RitualSlotItem card={p1DrawnCards[5]} index={5} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[5])} />
                        </View>
                        {/* Kart 3: Bilinçaltı & Kök Temel */}
                        <RitualSlotItem card={p1DrawnCards[2]} index={2} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[2])} />
                      </View>
                      {/* Sağ Sütun / Asa (Kart 10, 9, 8, 7) */}
                      <View style={styles.celticStaffColumn}>
                        {[9, 8, 7, 6].map((slotIdx) => {
                          const c = p1DrawnCards[slotIdx];
                          if (!c) return null;
                          return <RitualSlotItem key={`p1-staff-${slotIdx}`} card={c} index={slotIdx} deck={deck} onPress={() => setInspectedCard(c)} />;
                        })}
                      </View>
                    </View>
                  ) : selectedSpread.id === 'rel_mirror_10' && p1DrawnCards.length >= 5 ? (
                    /* 10 KARTLIK (5+5) İSE: DANIŞAN 5-KART HAÇ GEOMETRİSİ */
                    <View style={styles.fiveCrossBoard}>
                      <RitualSlotItem card={p1DrawnCards[1]} index={1} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[1])} />
                      <View style={styles.fiveCrossMidRow}>
                        <RitualSlotItem card={p1DrawnCards[2]} index={2} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[2])} />
                        <RitualSlotItem card={p1DrawnCards[0]} index={0} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[0])} />
                        <RitualSlotItem card={p1DrawnCards[3]} index={3} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[3])} />
                      </View>
                      <RitualSlotItem card={p1DrawnCards[4]} index={4} deck={deck} onPress={() => setInspectedCard(p1DrawnCards[4])} />
                    </View>
                  ) : (
                    /* 6 & 7 KARTLIK İSE: DANIŞAN 3-KART EL DİZİLİMİ */
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pistiCardsHandRow}>
                      {p1DrawnCards.map((card, idx) => (
                        <Animated.View
                          key={`p1_deal_${card.id}_${idx}`}
                          style={[
                            styles.pistiCardSlotAnim,
                            {
                              opacity: card.dealAnim,
                              transform: [
                                {
                                  translateY: card.dealAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                  }),
                                },
                                {
                                  scale: card.dealAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.6, 1],
                                  }),
                                },
                              ],
                            },
                          ]}
                        >
                          <Pressable
                            onPress={() => setInspectedCard(card)}
                            style={styles.pistiCardPressable}
                          >
                            <Text style={[styles.pistiPosLabel, { color: '#38BDF8' }]}>
                              {selectedSpread.positions[idx] || `${idx + 1}. Katman`}
                            </Text>
                            <View style={[styles.pistiCardImageFrame, { borderColor: 'rgba(56, 189, 248, 0.8)' }]}>
                              {card.image ? (
                                <Image source={card.image} style={styles.pistiCardImg} resizeMode="cover" />
                              ) : (
                                <View style={styles.pistiPlaceholderCard}>
                                  <MaterialCommunityIcons name="cards-outline" size={22} color="#38BDF8" />
                                </View>
                              )}
                            </View>
                            <Text style={styles.pistiCardName} numberOfLines={1}>{card.name}</Text>
                          </Pressable>
                        </Animated.View>
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.pistiPlayerBadgeBottom}>
                    <View style={[styles.pistiAvatarCircle, { borderColor: '#38BDF8' }]}>
                      <MaterialCommunityIcons name="account" size={22} color="#38BDF8" />
                    </View>
                    <View style={styles.pistiPlayerInfo}>
                      <Text style={[styles.pistiPlayerName, { color: '#38BDF8' }]} numberOfLines={1}>
                        {p1Name.trim() || '1. Kişi (Sen)'}
                      </Text>
                      <Text style={styles.pistiPlayerRole}>Danışan (Sen)</Text>
                    </View>
                    <View style={[styles.pistiScoreChip, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                      <Text style={[styles.pistiScoreChipText, { color: '#38BDF8' }]}>{p1DrawnCards.length} Kart</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              /* MASA ÖRTÜSÜ & YERLEŞİM GEOMETRİSİ (BİREYSEL) */
              <View style={styles.altarClothBoard}>
                {/* 10 KARTLIK KELT HAÇI YERLEŞİMİ */}
                {drawnCards.length === 10 ? (
                  <View style={styles.celticCrossBoard}>
                    {/* Sol Haç Bölümü */}
                    <View style={styles.celticCrossLeft}>
                      {/* Kart 5: Taç / Olası Gelecek (Üst) */}
                      <RitualSlotItem
                        card={drawnCards[4]}
                        index={4}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[4])}
                      />

                      {/* Orta Satır: Kart 4 (Sol), Kart 1 & 2 (Merkez Çapraz), Kart 6 (Sağ) */}
                      <View style={styles.celticCrossMidRow}>
                        <RitualSlotItem
                          card={drawnCards[3]}
                          index={3}
                          deck={deck}
                          onPress={() => setInspectedCard(drawnCards[3])}
                        />

                        {/* Merkezde Kart 1 ve Üzerine Çapraz Kapanan Kart 2 */}
                        <View style={styles.celticCenterStack}>
                          <RitualSlotItem
                            card={drawnCards[0]}
                            index={0}
                            deck={deck}
                            onPress={() => setInspectedCard(drawnCards[0])}
                          />
                          {drawnCards[1] && (
                            <Animated.View
                              style={[
                                styles.celticCrossCardOverlay,
                                {
                                  opacity: drawnCards[1].dealAnim,
                                  transform: [
                                    {
                                      scale: drawnCards[1].dealAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.6, 1],
                                      }),
                                    },
                                    { rotate: '90deg' },
                                  ],
                                },
                              ]}
                            >
                              <Pressable onPress={() => setInspectedCard(drawnCards[1])}>
                                <Image
                                  source={drawnCards[1].image || deck.cardBackImage}
                                  style={styles.ritualMiniCardImg}
                                  resizeMode="cover"
                                />
                              </Pressable>
                            </Animated.View>
                          )}
                        </View>

                        <RitualSlotItem
                          card={drawnCards[5]}
                          index={5}
                          deck={deck}
                          onPress={() => setInspectedCard(drawnCards[5])}
                        />
                      </View>

                      {/* Kart 3: Bilinçaltı & Kök Temel (Alt) */}
                      <RitualSlotItem
                        card={drawnCards[2]}
                        index={2}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[2])}
                      />
                    </View>

                    {/* Sağ Sütun / Asa (Kart 10, 9, 8, 7 Yukarıdan Aşağıya) */}
                    <View style={styles.celticStaffColumn}>
                      {[9, 8, 7, 6].map((slotIdx) => {
                        const card = drawnCards[slotIdx];
                        if (!card) return null;
                        return (
                          <RitualSlotItem
                            key={`staff-${slotIdx}`}
                            card={card}
                            index={slotIdx}
                            deck={deck}
                            onPress={() => setInspectedCard(card)}
                          />
                        );
                      })}
                    </View>
                  </View>
                ) : drawnCards.length === 5 ? (
                  /* 5 KARTLIK HAÇ DİZİLİMİ */
                  <View style={styles.fiveCrossBoard}>
                    {/* Üst: Kart 2 */}
                    <RitualSlotItem
                      card={drawnCards[1]}
                      index={1}
                      deck={deck}
                      onPress={() => setInspectedCard(drawnCards[1])}
                    />

                    {/* Orta: Sol (Kart 3) - Merkez (Kart 1) - Sağ (Kart 4) */}
                    <View style={styles.fiveCrossMidRow}>
                      <RitualSlotItem
                        card={drawnCards[2]}
                        index={2}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[2])}
                      />
                      <RitualSlotItem
                        card={drawnCards[0]}
                        index={0}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[0])}
                      />
                      <RitualSlotItem
                        card={drawnCards[3]}
                        index={3}
                        deck={deck}
                        onPress={() => setInspectedCard(drawnCards[3])}
                      />
                    </View>

                    {/* Alt: Kart 5 */}
                    <RitualSlotItem
                      card={drawnCards[4]}
                      index={4}
                      deck={deck}
                      onPress={() => setInspectedCard(drawnCards[4])}
                    />
                  </View>
                ) : drawnCards.length === 7 ? (
                  /* 7 KARTLIK AT NALI (HORSESHOE) DİZİLİMİ */
                  <View style={styles.horseshoeRitualBoard}>
                    <View style={styles.horseshoeArcWrap}>
                      {[
                        { idx: 0, top: 10, left: 10 },
                        { idx: 1, top: 80, left: 35 },
                        { idx: 2, top: 155, left: 70 },
                        { idx: 3, top: 195, left: 125 },
                        { idx: 4, top: 155, left: 180 },
                        { idx: 5, top: 80, left: 215 },
                        { idx: 6, top: 10, left: 240 },
                      ].map((slot) => {
                        const card = drawnCards[slot.idx];
                        if (!card) return null;
                        return (
                          <View
                            key={`hs-${slot.idx}`}
                            style={[styles.horseshoeRitualSlot, { top: slot.top, left: slot.left }]}
                          >
                            <RitualSlotItem
                              card={card}
                              index={slot.idx}
                              deck={deck}
                              onPress={() => setInspectedCard(card)}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  /* 1 VEYA 3 KARTLIK KLASİK DİZİLİM */
                  <View style={styles.generalRitualRow}>
                    {drawnCards.map((card, index) => (
                      <RitualSlotItem
                        key={`gen-${index}`}
                        card={card}
                        index={index}
                        deck={deck}
                        onPress={() => setInspectedCard(card)}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* DİZİLİM TABLOSU (ÇİFTLER İÇİN 2'Lİ TABLO / BİREYSEL İÇİN LİSTE) */}
            <View style={styles.ritualLegendWrap}>
              <Text style={styles.ritualLegendTitle}>
                {readingMode === 'relationship' ? '📜 DİZİLİM SIRASI VE KARŞILIKLI KART TABLOSU' : '📜 DİZİLİM SIRASI VE ANLAMI'}
              </Text>

              {readingMode === 'relationship' ? (
                <View style={styles.relComparisonTableWrap}>
                  {/* Başlık Sütunları */}
                  <View style={styles.relTableHeaderRow}>
                    <View style={[styles.relTableColHead, { borderTopLeftRadius: 12 }]}>
                      <MaterialCommunityIcons name="account" size={14} color="#38BDF8" />
                      <Text style={[styles.relTableColHeadText, { color: '#38BDF8' }]} numberOfLines={1}>
                        {p1Name.trim() || '1. Kişi (Sen)'}
                      </Text>
                    </View>
                    <View style={styles.relTableCenterColHead}>
                      <Text style={styles.relTableCenterColHeadText}>SIRA / KATMAN</Text>
                    </View>
                    <View style={[styles.relTableColHead, { borderTopRightRadius: 12 }]}>
                      <MaterialCommunityIcons name="account-heart" size={14} color="#F43F5E" />
                      <Text style={[styles.relTableColHeadText, { color: '#F43F5E' }]} numberOfLines={1}>
                        {p2Name.trim() || '2. Kişi (Partner)'}
                      </Text>
                    </View>
                  </View>

                  {/* Satırlar */}
                  {Array.from({ length: Math.max(p1DrawnCards.length, p2DrawnCards.length) }).map((_, idx) => {
                    const p1C = p1DrawnCards[idx];
                    const p2C = p2DrawnCards[idx];
                    const posLabel = selectedSpread.positions[idx] || `${idx + 1}. Katman`;

                    return (
                      <View key={`rel_tab_row_${idx}`} style={[styles.relTableRow, idx % 2 === 1 && styles.relTableRowAlt]}>
                        {/* Sol: 1. Kişi */}
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

                        {/* Orta: Katman Numarası & Başlığı */}
                        <View style={styles.relTableCenterCell}>
                          <View style={styles.relLayerBadge}>
                            <Text style={styles.relLayerBadgeText}>#{idx + 1}</Text>
                          </View>
                          <Text style={styles.relLayerPosText} numberOfLines={2}>{posLabel}</Text>
                        </View>

                        {/* Sağ: 2. Kişi */}
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

                  {/* Varsa Ortak Köprü Kartı */}
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
              ) : (
                drawnCards.map((card, index) => (
                  <View key={`leg-${index}`} style={styles.legendRowItem}>
                    <View style={[styles.legendIndexPill, { backgroundColor: deck.accent + '25' }]}>
                      <Text style={[styles.legendIndexText, { color: deck.accent }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.legendTextWrap}>
                      <Text style={[styles.legendCardName, { color: deck.accent }]}>
                        {card.positionName}: <Text style={{ color: '#FFFFFF' }}>{card.name}</Text>
                      </Text>
                      <Text style={styles.legendOrientation}>
                        {card.isReversed ? '⚡ Ters Konumda Açıldı' : '✨ Düz Konumda Açıldı'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      )}

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

              {/* Kart Görseli */}
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

              {/* Açıklamalı İçerik vs Görsel Kısıtlaması */}
              {tier === 'explained' ? (
                (() => {
                  const details = getCardDetails(inspectedCard.id);
                  if (!details) {
                    return (
                      <Text style={styles.inspectDesc}>
                        {inspectedCard.isReversed
                          ? 'Bu kart ters konumda engelleri ve içsel dönüşümü işaret ediyor.'
                          : 'Bu kart düz konumda doğrudan enerjiyi ve açık fırsatları simgeliyor.'}
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
                          {details.keywords.map((kw, idx) => (
                            <View key={idx} style={[styles.keywordPill, { borderColor: deck.accent + '66' }]}>
                              <Text style={[styles.keywordPillText, { color: deck.accent }]}>{kw}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* 2. KARTIN HİKAYESİ VE MİTOLOJİSİ (BUTON HALİNDE) */}
                      {details.story && (
                        <View style={styles.storyCardBox}>
                          <Pressable
                            onPress={() => setShowStoryDetail(!showStoryDetail)}
                            style={styles.storyToggleHeader}
                          >
                            <View style={styles.storyToggleLeft}>
                              <Ionicons name="book-outline" size={16} color={GOLD} />
                              <Text style={styles.storyToggleTitle}>Kartın Hikayesi & Arketipi</Text>
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
                    Bu kartın Kavramlarını, Mitolojik Hikayesini, Aşk/Kariyer ve Falcı Repliklerini görmek için Açıklamalı Sürüme yükseltin.
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
function RitualSlotItem({
  card,
  index,
  deck,
  onPress,
}: {
  card?: DrawnCard;
  index: number;
  deck: CardDeckInfo;
  onPress: () => void;
}) {
  if (!card) return null;

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
                outputRange: [0.3, 1],
              }),
            },
            {
              translateY: card.dealAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-40, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable onPress={onPress} style={styles.ritualCardBtn}>
        <View style={[styles.ritualIndexBadge, { backgroundColor: deck.accent }]}>
          <Text style={styles.ritualIndexBadgeText}>{index + 1}</Text>
        </View>
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
      </Pressable>
      <Text style={styles.ritualCardNameText} numberOfLines={1}>
        {card.name}
      </Text>
      <Text style={styles.ritualSlotLabelText} numberOfLines={1}>
        {card.positionName}
      </Text>
    </Animated.View>
  );
}

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
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
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
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
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
    borderColor: 'rgba(242, 200, 121, 0.2)',
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
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
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
    backgroundColor: 'rgba(10, 5, 24, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  spreadList: {
    gap: 10,
  },
  spreadCard: {
    backgroundColor: 'rgba(22, 12, 44, 0.82)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.2)',
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
    borderColor: 'rgba(242, 200, 121, 0.2)',
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
    borderColor: 'rgba(242, 200, 121, 0.3)',
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

  // Phase 3: Table
  tableContainer: {
    paddingTop: 10,
    gap: 14,
  },
  tableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tableBannerText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
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
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
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
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
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
    width: 46,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GOLD,
    overflow: 'hidden',
    backgroundColor: '#0F091F',
  },
  celticStaffColumn: {
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(242, 200, 121, 0.2)',
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
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
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
    borderColor: 'rgba(242, 200, 121, 0.25)',
    overflow: 'hidden',
  },
  relTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.3)',
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
    borderColor: 'rgba(242, 200, 121, 0.2)',
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
    borderColor: 'rgba(242, 200, 121, 0.12)',
    gap: 2,
  },
  relLayerBadge: {
    backgroundColor: 'rgba(242, 200, 121, 0.18)',
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
});
