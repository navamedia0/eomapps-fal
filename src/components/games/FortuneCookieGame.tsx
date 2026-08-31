import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addCoins } from '@/services/coins';
import { canPlayRewarded, markGamePlayed } from '@/services/miniGamesCooldown';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const DESTINY_MESSAGES = [
  { text: 'Bugün kalbinden geçen sessiz niyet, evrenin en güçlü frekansına ulaşıyor. İnancını koru!', luckyNum: 7, color: 'Zümrüt Yeşili' },
  { text: 'Beklediğin haber ummadığın bir anda kapını çalacak; gözlerini ve sezgilerini açık tut.', luckyNum: 3, color: 'Safir Mavisi' },
  { text: 'Korktuğun o cesur adım, hayatının en büyük bereketine açılan kapıdır.', luckyNum: 9, color: 'Güneş Sarısı' },
  { text: 'Rüzgarın yönünü değiştiremezsin ama niyetlerini her zaman güzelleştirebilirsin.', luckyNum: 11, color: 'Ametist Moru' },
  { text: 'Bugün birine yapacağın içten bir tebessüm, sana katbekat şans olarak dönecektir.', luckyNum: 8, color: 'Yakut Kırmızısı' },
  { text: 'Eski döngü kapanıyor; ruhunu hafiflet ve yeni başlangıçlara kollarını aç.', luckyNum: 5, color: 'Ay Beyazı' },
];

export default function FortuneCookieGame({ onClose }: { onClose: () => void }) {
  const [canOpen, setCanOpen] = useState(true);
  const [isBroken, setIsBroken] = useState(false);
  const [destiny, setDestiny] = useState<(typeof DESTINY_MESSAGES)[0] | null>(null);
  const [awardedCoins, setAwardedCoins] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    canPlayRewarded('cookie').then(setCanOpen);
  }, []);

  const handleCrackCookie = async () => {
    if (!canOpen || isBroken) return;

    // Shake animasyonu
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(async () => {
      setIsBroken(true);
      const chosen = DESTINY_MESSAGES[Math.floor(Math.random() * DESTINY_MESSAGES.length)];
      const coins = Math.floor(Math.random() * 5) + 4; // 4 ile 8 coin arası

      setDestiny(chosen);
      setAwardedCoins(coins);

      await addCoins(coins);
      await markGamePlayed('cookie');
      setCanOpen(false);
    });
  };

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="cookie" size={20} color={GOLD} />
          <Text style={styles.headerTitle}>Günün Fal Kurabiyesi</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={GOLD} />
        </Pressable>
      </View>

      <Text style={styles.subtext}>
        Günde bir kez niyetini tut, kozmik kurabiyeni kır; hem günün kehanetini öğren hem de Coin kazan!
      </Text>

      {/* KURABİYE ALANI */}
      {!isBroken ? (
        <View style={styles.cookieCenterArea}>
          <Animated.View
            style={{
              transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
            }}
          >
            <Pressable
              onPress={handleCrackCookie}
              disabled={!canOpen}
              style={({ pressed }) => [
                styles.cookieTouchWrap,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <View style={styles.cookieAuraCircle}>
                <MaterialCommunityIcons
                  name="cookie"
                  size={96}
                  color={canOpen ? GOLD : TEXT_MUTED}
                />
              </View>
            </Pressable>
          </Animated.View>

          {canOpen ? (
            <View style={styles.promptWrap}>
              <MaterialCommunityIcons name="gesture-tap" size={22} color={GOLD} />
              <Text style={styles.promptText}>Kırmak İçin Dokun</Text>
            </View>
          ) : (
            <View style={styles.cooldownBox}>
              <Ionicons name="time-outline" size={16} color={GOLD} />
              <Text style={styles.cooldownText}>
                Bugünkü fal kurabiyeni açtın! Yarın yeni bir kehanet ve coin için tekrar gel.
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* AÇILMIŞ PARŞÖMEN VE ÖDÜL */
        <View style={styles.scrollCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="script-text-outline" size={32} color={GOLD} />
          <Text style={styles.scrollHeader}>GÜNÜN KOZMİK KEHANETİ</Text>

          {destiny && (
            <>
              <Text style={styles.destinyText}>"{destiny.text}"</Text>

              <View style={styles.destinyMetaRow}>
                <View style={styles.destinyPill}>
                  <Text style={styles.destinyPillLabel}>Şanslı Sayın:</Text>
                  <Text style={styles.destinyPillVal}>{destiny.luckyNum}</Text>
                </View>
                <View style={styles.destinyPill}>
                  <Text style={styles.destinyPillLabel}>Şanslı Rengin:</Text>
                  <Text style={styles.destinyPillVal}>{destiny.color}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.coinAwardBox}>
            <MaterialCommunityIcons name="star-circle" size={20} color={GOLD} />
            <Text style={styles.coinAwardText}>+{awardedCoins} Coin Hesabına Eklendi!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    gap: 14,
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
    marginBottom: 6,
  },
  cookieCenterArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 18,
    width: '100%',
  },
  cookieTouchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookieAuraCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 201, 60, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  promptWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 201, 60, 0.15)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  promptText: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
  },
  scrollCard: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 32, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginVertical: 10,
  },
  scrollHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
  },
  destinyText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 6,
  },
  destinyMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  destinyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 7, 8, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  destinyPillLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  destinyPillVal: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  coinAwardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  coinAwardText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10B981',
  },
  cooldownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    padding: 14,
    width: '90%',
  },
  cooldownText: {
    flex: 1,
    fontSize: 12,
    color: GOLD_SOFT,
    lineHeight: 17,
  },
});
