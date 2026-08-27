import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, G, Line } from 'react-native-svg';
import type { KatinaSuit } from '@/services/katina';

const SUIT_SYMBOL: Record<KatinaSuit, string> = { kupa: '♥', karo: '♦', sinek: '♣', maca: '♠' };
const SUIT_COLOR: Record<KatinaSuit, string> = {
  kupa: '#c41935',
  karo: '#d12b3a',
  sinek: '#191c28',
  maca: '#14151f',
};

export const RANK_DISPLAY: Record<string, string> = {
  asi: 'A',
  ikilisi: '2',
  uclusu: '3',
  dortlusu: '4',
  beslisi: '5',
  altilisi: '6',
  yedilisi: '7',
  sekizlisi: '8',
  dokuzlusu: '9',
  onlusu: '10',
  valesi: 'J',
  kizi: 'Q',
  papazi: 'K',
};

type Props = { suit: KatinaSuit; rankSlug: string; size?: number };

/* -------------------------------------------------------------
   Kral / Papaz (K) Figürü
------------------------------------------------------------- */
function KingFigure({ color, suit }: { color: string; suit: KatinaSuit }) {
  return (
    <View style={styles.figureWrap}>
      <Svg width="54" height="66" viewBox="0 0 54 66" fill="none">
        {/* Taç */}
        <Path d="M12 20 L15 11 L21 16 L27 8 L33 16 L39 11 L42 20 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1.2" />
        <Circle cx="15" cy="11" r="1.5" fill="#ef4444" />
        <Circle cx="27" cy="8" r="1.8" fill="#3b82f6" />
        <Circle cx="39" cy="11" r="1.5" fill="#ef4444" />

        {/* Yüz & Sakal */}
        <Path d="M19 20 Q27 20 35 20 L35 28 Q27 38 19 28 Z" fill="#fed7aa" stroke="#ca8a04" strokeWidth="1" />
        <Path d="M21 28 Q27 40 33 28 L32 35 Q27 42 22 35 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
        {/* Gözler & Bıyık */}
        <Circle cx="23" cy="24" r="1" fill="#1e293b" />
        <Circle cx="31" cy="24" r="1" fill="#1e293b" />
        <Path d="M22 28 Q27 31 32 28" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />

        {/* Kral Pelerini & Giysi */}
        <Path d="M10 40 L16 28 L38 28 L44 40 L46 62 L8 62 Z" fill="#7e22ce" stroke="#581c87" strokeWidth="1.2" />
        {/* Ermin Yakalık */}
        <Path d="M15 28 Q27 34 39 28 L37 42 Q27 46 17 42 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <Circle cx="21" cy="35" r="1" fill="#1e293b" />
        <Circle cx="27" cy="38" r="1" fill="#1e293b" />
        <Circle cx="33" cy="35" r="1" fill="#1e293b" />

        {/* Altın Göğüs Deseni ve Asa */}
        <Path d="M22 44 L32 44 L27 58 Z" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
        <Path d="M43 32 L47 62" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <Circle cx="43" cy="32" r="3" fill="#eab308" stroke="#a16207" strokeWidth="1" />
      </Svg>
      <View style={[styles.namePill, { borderColor: color }]}>
        <Text style={[styles.namePillText, { color }]}>PAPAZ</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------
   Kraliçe / Kız (Q) Figürü
------------------------------------------------------------- */
function QueenFigure({ color, suit }: { color: string; suit: KatinaSuit }) {
  return (
    <View style={styles.figureWrap}>
      <Svg width="54" height="66" viewBox="0 0 54 66" fill="none">
        {/* Zarif Kraliçe Tacı */}
        <Path d="M15 19 L17 11 L23 15 L27 9 L31 15 L37 11 L39 19 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        <Circle cx="27" cy="9" r="1.5" fill="#ec4899" />
        <Circle cx="17" cy="11" r="1.2" fill="#3b82f6" />
        <Circle cx="37" cy="11" r="1.2" fill="#3b82f6" />

        {/* Saçlar */}
        <Path d="M14 20 Q11 32 16 38 L18 24 Q27 18 36 24 L38 38 Q43 32 40 20 Z" fill="#d97706" />

        {/* Yüz */}
        <Path d="M18 20 Q27 21 36 20 L35 28 Q27 36 19 28 Z" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1" />
        <Circle cx="23" cy="24" r="1" fill="#1e293b" />
        <Circle cx="31" cy="24" r="1" fill="#1e293b" />
        <Path d="M25 29 Q27 31 29 29" stroke="#f43f5e" strokeWidth="1.2" strokeLinecap="round" />

        {/* Elbise & Pelerin */}
        <Path d="M11 40 L17 28 L37 28 L43 40 L45 62 L9 62 Z" fill="#be185d" stroke="#831843" strokeWidth="1.2" />
        {/* İnci Kolye & Dantel Yaka */}
        <Path d="M18 28 Q27 36 36 28 L35 38 Q27 42 19 38 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <Circle cx="23" cy="34" r="1" fill="#f8fafc" />
        <Circle cx="27" cy="35" r="1.2" fill="#ec4899" />
        <Circle cx="31" cy="34" r="1" fill="#f8fafc" />

        {/* Elde Tutulan Gül / Çiçek */}
        <Path d="M39 48 L43 42 L47 48 Z" fill="#ef4444" />
        <Path d="M43 48 L43 62" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
      <View style={[styles.namePill, { borderColor: color }]}>
        <Text style={[styles.namePillText, { color }]}>KIZ</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------
   Vale / Şövalye (J) Figürü
------------------------------------------------------------- */
function JackFigure({ color, suit }: { color: string; suit: KatinaSuit }) {
  return (
    <View style={styles.figureWrap}>
      <Svg width="54" height="66" viewBox="0 0 54 66" fill="none">
        {/* Şövalye / Prens Şapkası ve Tüyü */}
        <Path d="M14 18 Q27 12 40 18 L38 21 L16 21 Z" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1" />
        <Path d="M36 18 Q44 6 42 2 L38 8 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
        <Circle cx="20" cy="18" r="1.5" fill="#facc15" />

        {/* Yüz */}
        <Path d="M19 21 Q27 21 35 21 L34 29 Q27 36 20 29 Z" fill="#fed7aa" stroke="#ca8a04" strokeWidth="1" />
        <Circle cx="24" cy="25" r="1" fill="#1e293b" />
        <Circle cx="30" cy="25" r="1" fill="#1e293b" />
        <Path d="M25 29 Q27 30 29 29" stroke="#9a3412" strokeWidth="1" strokeLinecap="round" />

        {/* Zırh / Ceket */}
        <Path d="M12 38 L18 28 L36 28 L42 38 L44 62 L10 62 Z" fill="#0f766e" stroke="#115e59" strokeWidth="1.2" />
        {/* Zırh Yaka ve Göğüs Çaprazı */}
        <Path d="M18 28 L36 44" stroke="#fbbf24" strokeWidth="1.8" />
        <Path d="M36 28 L18 44" stroke="#fbbf24" strokeWidth="1.8" />
        <Circle cx="27" cy="36" r="3" fill="#eab308" stroke="#a16207" strokeWidth="1" />

        {/* Kılıç / Kargı */}
        <Path d="M11 30 L11 62" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M7 36 L15 36" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round" />
        <Circle cx="11" cy="28" r="2.2" fill="#eab308" />
      </Svg>
      <View style={[styles.namePill, { borderColor: color }]}>
        <Text style={[styles.namePillText, { color }]}>VALE</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------
   As (A) Madalyonu
------------------------------------------------------------- */
function AceFigure({ color, symbol }: { color: string; symbol: string }) {
  return (
    <View style={styles.figureWrap}>
      <Svg width="54" height="66" viewBox="0 0 54 66" fill="none">
        {/* Güneş Işınları / Madalyon Halkası */}
        <Circle cx="27" cy="33" r="24" stroke="rgba(212, 175, 55, 0.45)" strokeWidth="1" strokeDasharray="3 2" />
        <Circle cx="27" cy="33" r="20" stroke="rgba(212, 175, 55, 0.7)" strokeWidth="1.2" />
        <Circle cx="27" cy="33" r="17" fill="rgba(250, 245, 230, 0.6)" />
      </Svg>
      <View style={styles.aceSymbolWrap}>
        <Text style={[styles.aceCenterSymbol, { color }]}>{symbol}</Text>
      </View>
      <View style={[styles.namePill, { borderColor: color }]}>
        <Text style={[styles.namePillText, { color }]}>AS</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------
   Sayı Kartları (2 - 10) Pip Düzeni
------------------------------------------------------------- */
function NumberPips({ rank, symbol, color }: { rank: string; symbol: string; color: string }) {
  const num = parseInt(rank, 10);

  // Basit ve zarif simetrik pip yerleşimi
  return (
    <View style={styles.pipsContainer}>
      {/* Hafif filigran arkaplan simgesi */}
      <Text style={[styles.pipWatermark, { color }]}>{symbol}</Text>

      <View style={styles.pipsRow}>
        <Text style={[styles.pipSymbol, { color }]}>{symbol}</Text>
        {num >= 4 && <Text style={[styles.pipSymbol, { color }]}>{symbol}</Text>}
      </View>

      {num % 2 === 1 && (
        <View style={styles.pipsCenterRow}>
          <Text style={[styles.pipSymbol, { color }]}>{symbol}</Text>
        </View>
      )}

      {num >= 8 && (
        <View style={styles.pipsCenterRow}>
          <Text style={[styles.pipSymbol, { color }]}>{symbol}</Text>
        </View>
      )}

      <View style={styles.pipsRow}>
        <Text style={[styles.pipSymbol, { color, transform: [{ rotate: '180deg' }] }]}>{symbol}</Text>
        {num >= 4 && (
          <Text style={[styles.pipSymbol, { color, transform: [{ rotate: '180deg' }] }]}>{symbol}</Text>
        )}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------
   Ana PlayingCardFace Bileşeni
------------------------------------------------------------- */
export default function PlayingCardFace({ suit, rankSlug, size = 100 }: Props) {
  const symbol = SUIT_SYMBOL[suit];
  const color = SUIT_COLOR[suit];
  const rank = RANK_DISPLAY[rankSlug] ?? '?';
  const width = size;
  const height = Math.round(size * 1.45);

  const isCourt = rank === 'J' || rank === 'Q' || rank === 'K';
  const isAce = rank === 'A';

  return (
    <View style={[styles.cardShadowWrap, { width, height, borderRadius: size * 0.09 }]}>
      {/* Zengin Antik Parşömen / Krem Keten Gradyanı */}
      <LinearGradient
        colors={['#fffefb', '#f7f1e4', '#ede2cb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardBackground, { borderRadius: size * 0.09 }]}
      >
        {/* İç İnce Altın Yaldız Çerçeve */}
        <View style={[styles.innerFrame, { borderRadius: size * 0.07 }]}>
          {/* Sol Üst Köşe */}
          <View style={styles.cornerTL}>
            <Text style={[styles.rankText, { color, fontSize: size * 0.17 }]}>{rank}</Text>
            <Text style={[styles.suitTextSmall, { color, fontSize: size * 0.13 }]}>{symbol}</Text>
          </View>

          {/* Orta Alan: Figür, As veya Pip Düzeni */}
          <View style={styles.centerStage}>
            {rank === 'K' ? (
              <KingFigure color={color} suit={suit} />
            ) : rank === 'Q' ? (
              <QueenFigure color={color} suit={suit} />
            ) : rank === 'J' ? (
              <JackFigure color={color} suit={suit} />
            ) : isAce ? (
              <AceFigure color={color} symbol={symbol} />
            ) : (
              <NumberPips rank={rank} symbol={symbol} color={color} />
            )}
          </View>

          {/* Sağ Alt Köşe (180 derece ters) */}
          <View style={styles.cornerBR}>
            <Text style={[styles.rankText, { color, fontSize: size * 0.17 }]}>{rank}</Text>
            <Text style={[styles.suitTextSmall, { color, fontSize: size * 0.13 }]}>{symbol}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadowWrap: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 5,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    padding: 3,
    borderWidth: 1.2,
    borderColor: 'rgba(190, 155, 75, 0.55)',
  },
  innerFrame: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(180, 140, 60, 0.35)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 3,
    left: 4,
    alignItems: 'center',
    zIndex: 10,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
    zIndex: 10,
  },
  rankText: {
    fontWeight: '900',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  suitTextSmall: {
    fontWeight: '800',
    marginTop: -3,
    includeFontPadding: false,
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  figureWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  namePill: {
    borderWidth: 0.8,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  namePillText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  aceSymbolWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 14,
  },
  aceCenterSymbol: {
    fontSize: 28,
    fontWeight: '900',
  },
  pipsContainer: {
    flex: 1,
    width: '64%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  pipWatermark: {
    position: 'absolute',
    fontSize: 52,
    opacity: 0.08,
    fontWeight: '900',
  },
  pipsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipsCenterRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipSymbol: {
    fontSize: 16,
    fontWeight: '900',
  },
});
