import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addCoins } from '@/services/coins';
import { canPlayRewarded, markGamePlayed } from '@/services/miniGamesCooldown';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type FallingObject = {
  id: number;
  lane: number; // 0: sol, 1: orta, 2: sağ
  y: number; // 0'dan 100'e (yüzde)
  type: 'star' | 'meteor';
};

const TARGET_STARS = 10;
const MAX_LIVES = 3;

export default function StarshipGame({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const gameWidth = Math.min(width - 48, 360);
  const laneWidth = gameWidth / 3;

  const [shipLane, setShipLane] = useState(1); // 0, 1, 2
  const [lives, setLives] = useState(MAX_LIVES);
  const [starsCollected, setStarsCollected] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [canReward, setCanReward] = useState(true);

  const objectsRef = useRef<FallingObject[]>([]);
  const [renderObjects, setRenderObjects] = useState<FallingObject[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    canPlayRewarded('starship').then(setCanReward);
  }, []);

  const startGame = () => {
    setShipLane(1);
    setLives(MAX_LIVES);
    setStarsCollected(0);
    setIsGameOver(false);
    setIsWon(false);
    objectsRef.current = [];
    setRenderObjects([]);
    setIsPlaying(true);
  };

  // Oyun Döngüsü (Game Loop)
  useEffect(() => {
    if (!isPlaying) return;

    let frameCount = 0;
    const interval = setInterval(() => {
      frameCount++;

      // Yeni nesne üretimi (her 18 frame'de bir)
      if (frameCount % 18 === 0) {
        const randLane = Math.floor(Math.random() * 3);
        const isStar = Math.random() > 0.45; // %55 yıldız, %45 meteor
        objectsRef.current.push({
          id: nextId.current++,
          lane: randLane,
          y: 0,
          type: isStar ? 'star' : 'meteor',
        });
      }

      // Nesneleri aşağı kaydır
      const updated: FallingObject[] = [];
      for (const obj of objectsRef.current) {
        const nextY = obj.y + 4.5;

        // Çarpışma kontrolü (Gemi y=80..95 arasında durur)
        if (nextY >= 80 && nextY <= 92 && obj.lane === shipLane) {
          if (obj.type === 'star') {
            setStarsCollected((prev) => {
              const next = prev + 1;
              if (next >= TARGET_STARS) {
                handleVictory();
              }
              return next;
            });
          } else {
            setLives((prev) => {
              const next = prev - 1;
              if (next <= 0) {
                handleDefeat();
              }
              return next;
            });
          }
          // Çarpışan nesneyi listeden çıkar
          continue;
        }

        // Ekrandan çıkmadıysa koru
        if (nextY < 100) {
          updated.push({ ...obj, y: nextY });
        }
      }

      objectsRef.current = updated;
      setRenderObjects([...updated]);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, shipLane]);

  const handleVictory = async () => {
    setIsPlaying(false);
    setIsWon(true);
    if (canReward) {
      await addCoins(15);
      await markGamePlayed('starship');
      setCanReward(false);
    }
  };

  const handleDefeat = () => {
    setIsPlaying(false);
    setIsGameOver(true);
  };

  const moveLeft = () => {
    setShipLane((l) => Math.max(0, l - 1));
  };

  const moveRight = () => {
    setShipLane((l) => Math.min(2, l + 1));
  };

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
          <Text style={styles.headerTitle}>Kozmik Yıldız Avcısı</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={GOLD} />
        </Pressable>
      </View>

      {/* Durum Göstergesi */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Yıldızlar:</Text>
          <Text style={styles.statValue}>
            {starsCollected} / {TARGET_STARS} ⭐
          </Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Kalkan:</Text>
          <Text style={styles.statValue}>{'❤️'.repeat(Math.max(0, lives))}</Text>
        </View>
        <View style={styles.statPill}>
          <MaterialCommunityIcons name="star-crescent" size={14} color={GOLD} />
          <Text style={[styles.statValue, { color: canReward ? GOLD : TEXT_MUTED }]}>
            {canReward ? '+15 Coin' : 'Alındı'}
          </Text>
        </View>
      </View>

      {/* OYUN ALANI (3 KORİDOR) */}
      <View style={[styles.gameBox, { width: gameWidth, height: 320 }]}>
        <CornerTicks />

        {/* 3 Koridor Çizgileri */}
        <View style={[styles.laneDivider, { left: laneWidth }]} />
        <View style={[styles.laneDivider, { left: laneWidth * 2 }]} />

        {/* Düşen Nesneler */}
        {renderObjects.map((obj) => (
          <View
            key={obj.id}
            style={[
              styles.fallingItem,
              {
                left: obj.lane * laneWidth + laneWidth / 2 - 16,
                top: `${obj.y}%`,
              },
            ]}
          >
            {obj.type === 'star' ? (
              <MaterialCommunityIcons name="star-four-points" size={24} color="#FBBF24" />
            ) : (
              <MaterialCommunityIcons name="meteor" size={24} color="#EF4444" />
            )}
          </View>
        ))}

        {/* Uzay Gemisi (Altta) */}
        <View
          style={[
            styles.shipWrap,
            {
              left: shipLane * laneWidth + laneWidth / 2 - 20,
            },
          ]}
        >
          <MaterialCommunityIcons name="rocket-launch" size={36} color={GOLD} />
        </View>

        {/* BAŞLANGIÇ OVERLAY */}
        {!isPlaying && !isWon && !isGameOver && (
          <View style={styles.overlayCenter}>
            <MaterialCommunityIcons name="rocket" size={48} color={GOLD} />
            <Text style={styles.overlayTitle}>Kozmik Görev</Text>
            <Text style={styles.overlaySubtitle}>
              Meteorlardan kaç, 10 altın yıldızı topla ve 15 Coin kazan!
            </Text>
            <Pressable onPress={startGame} style={styles.startBtn}>
              <Text style={styles.startBtnText}>Görevi Başlat</Text>
            </Pressable>
          </View>
        )}

        {/* ZAFER OVERLAY */}
        {isWon && (
          <View style={styles.overlayCenter}>
            <MaterialCommunityIcons name="trophy" size={48} color={GOLD} />
            <Text style={styles.overlayTitle}>Görev Başarılı!</Text>
            <Text style={styles.overlaySubtitle}>
              Tüm kozmik yıldızları topladın ve uzay fırtınasını atlattın!
            </Text>
            {canReward && <Text style={styles.wonRewardText}>+15 Coin Hesabına Eklendi!</Text>}
            <Pressable onPress={startGame} style={styles.startBtn}>
              <Text style={styles.startBtnText}>Tekrar Oyna</Text>
            </Pressable>
          </View>
        )}

        {/* YENİLGİ OVERLAY */}
        {isGameOver && (
          <View style={styles.overlayCenter}>
            <MaterialCommunityIcons name="alert-octagon" size={48} color="#EF4444" />
            <Text style={[styles.overlayTitle, { color: '#EF4444' }]}>Kalkan Düştü!</Text>
            <Text style={styles.overlaySubtitle}>
              Gemin meteor yağmuruna yakalandı. Yıldızları toplamak için yeniden dene!
            </Text>
            <Pressable onPress={startGame} style={[styles.startBtn, { backgroundColor: '#EF4444' }]}>
              <Text style={[styles.startBtnText, { color: '#FFFFFF' }]}>Yeniden Dene</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* KONTROL BUTONLARI (SOL - SAĞ) */}
      <View style={[styles.controlsRow, { width: gameWidth }]}>
        <Pressable
          onPress={moveLeft}
          disabled={!isPlaying}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnPressed]}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.controlBtnText}>SOL</Text>
        </Pressable>

        <Pressable
          onPress={moveRight}
          disabled={!isPlaying}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.controlBtnPressed]}
        >
          <Text style={styles.controlBtnText}>SAĞ</Text>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </Pressable>
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  statValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
  },
  gameBox: {
    position: 'relative',
    backgroundColor: '#05030e',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    overflow: 'hidden',
  },
  laneDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderStyle: 'dashed',
  },
  fallingItem: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipWrap: {
    position: 'absolute',
    bottom: 14,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderWidth: 1.2,
    borderColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
  },
  controlBtnPressed: {
    backgroundColor: 'rgba(242, 200, 121, 0.25)',
    transform: [{ scale: 0.98 }],
  },
  controlBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 3, 15, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
  },
  overlaySubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 6,
  },
  wonRewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 6,
  },
  startBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0D33',
  },
});
