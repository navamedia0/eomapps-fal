import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addCoins } from '@/services/coins';
import { canPlayRewarded, markGamePlayed } from '@/services/miniGamesCooldown';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const SLICES = [
  { id: 0, label: '10 Coin', type: 'coin', value: 10, color: '#1a103c', stroke: '#F59E0B', textColor: '#FBBF24', icon: 'star' },
  { id: 1, label: '5 Coin', type: 'coin', value: 5, color: '#130d2d', stroke: '#38BDF8', textColor: '#7DD3FC', icon: 'star-outline' },
  { id: 2, label: '25 Coin', type: 'coin', value: 25, color: '#2a1a4e', stroke: '#F2C879', textColor: '#F2C879', isJackpot: true, icon: 'crown' },
  { id: 3, label: '1 Kredi', type: 'credit', value: 1, color: '#130d2d', stroke: '#A855F7', textColor: '#C084FC', icon: 'crystal-ball' },
  { id: 4, label: '15 Coin', type: 'coin', value: 15, color: '#1a103c', stroke: '#EC4899', textColor: '#F472B6', icon: 'star' },
  { id: 5, label: 'Mistik Mesaj', type: 'message', value: 0, color: '#130d2d', stroke: '#10B981', textColor: '#34D399', icon: 'book-open-variant' },
  { id: 6, label: '10 Coin', type: 'coin', value: 10, color: '#1a103c', stroke: '#F59E0B', textColor: '#FBBF24', icon: 'star' },
  { id: 7, label: '5 Coin', type: 'coin', value: 5, color: '#130d2d', stroke: '#38BDF8', textColor: '#7DD3FC', icon: 'star-outline' },
];

const MYSTIC_MESSAGES = [
  'Bugün evren senin için beklenmedik bir kapı aralıyor. İç sesine güven!',
  'Yıldızlar bugün niyetlerinin arkasında duruyor; cesur ol!',
  'Geçmişin yüklerini bırak, yeni bir döngü başlıyor.',
  'Bugün karşına çıkacak bir işaret sana doğru yolu fısıldayacak.',
];

const SLICE_ANGLE = 360 / SLICES.length; // 45 derece

export default function FortuneWheelGame({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(width - 64, 320);
  const center = wheelSize / 2;
  const radius = center - 8;

  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [wonPrize, setWonPrize] = useState<(typeof SLICES)[0] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  useEffect(() => {
    canPlayRewarded('wheel').then(setCanSpin);
  }, []);

  const handleSpin = () => {
    if (spinning || !canSpin) return;

    setSpinning(true);
    setWonPrize(null);
    setMessage(null);

    // Rastgele kazanan dilim seçimi
    const winningIndex = Math.floor(Math.random() * SLICES.length);
    const selectedPrize = SLICES[winningIndex];

    // Dilimin ibrenin (üst noktanın: 270 derece veya 0 derece) altına gelmesi için hesaplanan açı
    // Dilim i, [i*45, (i+1)*45] arasındadır. Merkez açısı: i*45 + 22.5
    // Üstteki ibreye (270°) denk getirmek için:
    const targetSliceAngle = winningIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    const extraRounds = 5 * 360; // 5 tam tur
    const finalAngle = extraRounds + (360 - targetSliceAngle) + 270;

    currentRotation.current = finalAngle;

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: finalAngle,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setSpinning(false);
      setWonPrize(selectedPrize);
      setCanSpin(false);

      // Ödül tanımlama
      if (selectedPrize.type === 'coin') {
        await addCoins(selectedPrize.value);
      } else if (selectedPrize.type === 'message') {
        const randMsg = MYSTIC_MESSAGES[Math.floor(Math.random() * MYSTIC_MESSAGES.length)];
        setMessage(randMsg);
      }
      await markGamePlayed('wheel');
    });
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, currentRotation.current || 360],
    outputRange: ['0deg', `${currentRotation.current || 360}deg`],
  });

  // SVG Dilim Yolu (Wedge) Hesaplama
  const makeArcPath = (index: number) => {
    const startAngle = (index * SLICE_ANGLE * Math.PI) / 180;
    const endAngle = ((index + 1) * SLICE_ANGLE * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    return `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} Z`;
  };

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="star-shooting" size={20} color={GOLD} />
          <Text style={styles.headerTitle}>Kozmik Şans Çarkı</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={GOLD} />
        </Pressable>
      </View>

      <Text style={styles.subtext}>
        Günde bir kez kozmik çarkı çevir, şansını dene ve anında Coin kazan!
      </Text>

      {/* ÇARK VE İBRE ALANI */}
      <View style={styles.wheelArea}>
        {/* Üst Sabit İbre */}
        <View style={styles.pointerWrap}>
          <MaterialCommunityIcons name="menu-down" size={42} color={GOLD} />
        </View>

        {/* Dönen Çark */}
        <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
          <Svg width={wheelSize} height={wheelSize}>
            {/* Dış Altın Halka */}
            <Circle cx={center} cy={center} r={radius + 4} stroke={GOLD} strokeWidth={3} fill="none" />

            {SLICES.map((slice, i) => {
              const midAngle = ((i * SLICE_ANGLE + SLICE_ANGLE / 2) * Math.PI) / 180;
              const textR = radius * 0.65;
              const tx = center + textR * Math.cos(midAngle);
              const ty = center + textR * Math.sin(midAngle);

              return (
                <G key={slice.id}>
                  <Path
                    d={makeArcPath(i)}
                    fill={slice.color}
                    stroke={slice.stroke}
                    strokeWidth={1.5}
                  />
                  <SvgText
                    x={tx}
                    y={ty}
                    fill={slice.textColor}
                    fontSize={11}
                    fontWeight="800"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${i * SLICE_ANGLE + SLICE_ANGLE / 2 + 90}, ${tx}, ${ty})`}
                  >
                    {slice.label}
                  </SvgText>
                </G>
              );
            })}

            {/* Merkez Göbek Rozeti */}
            <Circle cx={center} cy={center} r={24} fill="#0d0922" stroke={GOLD} strokeWidth={2.5} />
            <SvgText
              x={center}
              y={center + 4}
              fill={GOLD}
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              ★
            </SvgText>
          </Svg>
        </Animated.View>
      </View>

      {/* KAZANILAN ÖDÜL KARTI */}
      {wonPrize && (
        <View style={styles.prizeCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="party-popper" size={28} color={GOLD} />
          <Text style={styles.prizeCardTitle}>Tebrikler!</Text>
          <Text style={styles.prizeCardValue}>
            {wonPrize.type === 'coin'
              ? `+${wonPrize.value} Coin Hesabına Eklendi!`
              : wonPrize.type === 'credit'
              ? '+1 Günlük Kredi Kazandın!'
              : 'Günün Mistik Mesajı Açıldı!'}
          </Text>
          {message && <Text style={styles.prizeCardMessage}>"{message}"</Text>}
        </View>
      )}

      {/* BUTON VEYA BEKLEME MESAJI */}
      <View style={styles.actionWrap}>
        {canSpin ? (
          <Pressable
            onPress={handleSpin}
            disabled={spinning}
            style={({ pressed }) => [
              styles.spinButton,
              spinning && { opacity: 0.7 },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialCommunityIcons name="rotate-right" size={20} color="#1A0D33" />
            <Text style={styles.spinButtonText}>{spinning ? 'Dönüyor...' : 'Çarkı Çevir'}</Text>
          </Pressable>
        ) : (
          <View style={styles.cooldownBox}>
            <Ionicons name="time-outline" size={18} color={GOLD} />
            <Text style={styles.cooldownText}>
              Bugünkü hakkını kullandın! Yarın tekrar gelerek yeni coinler kazanabilirsin.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  subtext: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  wheelArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  pointerWrap: {
    position: 'absolute',
    top: -24,
    zIndex: 10,
  },
  prizeCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: GOLD,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    width: '100%',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  prizeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
  },
  prizeCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  prizeCardMessage: {
    fontSize: 12,
    color: GOLD_SOFT,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  actionWrap: {
    width: '100%',
    marginTop: 6,
  },
  spinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
  },
  spinButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A0D33',
    letterSpacing: 0.3,
  },
  cooldownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    padding: 14,
  },
  cooldownText: {
    flex: 1,
    fontSize: 12,
    color: GOLD_SOFT,
    lineHeight: 17,
  },
});
