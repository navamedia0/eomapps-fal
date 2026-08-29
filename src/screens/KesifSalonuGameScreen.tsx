import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import GameEntryGate from '@/components/GameEntryGate';
import { addCoins } from '@/services/coins';
import { setLocalBestWaveIfHigher } from '@/services/kesifSalonu';
import { submitScore } from '@/services/games';
import { GOLD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'KesifSalonuOyun'>;
type BattlefieldProps = { navigation: Props['navigation'] };

const LOADING_LINES = ['Canavarlar toplanıyor…', 'Silahlar hazırlanıyor…', 'Sınır hattı kuruluyor…', 'Nöbetçiler konumlanıyor…'];

// ---- Oyun sabitleri --------------------------------------------------
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BASE_Y = SCREEN_H - 190;
const SPAWN_Y = 70;
const MONSTER_RADIUS = 24;
const PROJECTILE_RADIUS = 6;
const PLAYER_FIRE_INTERVAL_MS = 550;
const PLAYER_DAMAGE = 14;
const PROJECTILE_SPEED = 560; // px/sn
const TAP_DAMAGE = 22;
const TAP_COOLDOWN_MS = 320;
const WAVE_CLEAR_PAUSE_MS = 1400;
const MONSTER_BASE_DAMAGE = 14;
const BASE_MAX_HP = 100;

type Monster = { id: number; x: number; y: number; hp: number; maxHp: number; speed: number };
type Projectile = { id: number; x: number; y: number; vx: number; vy: number; dmg: number };
type Phase = 'playing' | 'wave-clear' | 'gameover';

type Engine = {
  phase: Phase;
  wave: number;
  baseHp: number;
  killCount: number;
  monsters: Monster[];
  projectiles: Projectile[];
  spawnCfg: { count: number; hp: number; speed: number; spawnGapMs: number };
  spawned: number;
  nextSpawnAt: number;
  lastFireAt: number;
  lastTapFireAt: number;
  waveClearAt: number;
  finalized: boolean;
  nextEntityId: number;
};

function waveConfig(wave: number) {
  return {
    count: Math.min(3 + Math.floor(wave * 1.15), 40),
    hp: Math.round(18 + wave * 7 + wave ** 1.15),
    speed: Math.min(44 + wave * 2.2, 130),
    spawnGapMs: Math.max(260, 700 - wave * 12),
  };
}

function freshEngine(): Engine {
  const now = Date.now();
  return {
    phase: 'playing',
    wave: 1,
    baseHp: BASE_MAX_HP,
    killCount: 0,
    monsters: [],
    projectiles: [],
    spawnCfg: waveConfig(1),
    spawned: 0,
    nextSpawnAt: now,
    lastFireAt: 0,
    lastTapFireAt: 0,
    waveClearAt: 0,
    finalized: false,
    nextEntityId: 1,
  };
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export default function KesifSalonuGameScreen({ navigation }: Props) {
  return (
    <GameEntryGate
      title="Keşif Salonu"
      subtitle="Dalga dalga gelen canavarlara karşı üsünü savun."
      icon="compass-outline"
      loadingLines={LOADING_LINES}
      initialPhase="loading"
      onExit={() => navigation.goBack()}
    >
      <KesifSalonuBattlefield navigation={navigation} />
    </GameEntryGate>
  );
}

function KesifSalonuBattlefield({ navigation }: BattlefieldProps) {
  const insets = useSafeAreaInsets();
  const engineRef = useRef<Engine>(freshEngine());
  const [snapshot, setSnapshot] = useState<Engine>(engineRef.current);

  const finalize = useCallback(async (waveReached: number) => {
    const bestLocal = await setLocalBestWaveIfHigher(waveReached);
    submitScore('kesif_salonu', waveReached).catch(() => {});
    const rewardCoins = Math.min(waveReached * 2, 200);
    if (rewardCoins > 0) await addCoins(rewardCoins);
    return { bestLocal, rewardCoins };
  }, []);

  useEffect(() => {
    let rafId: number;
    let lastTime = Date.now();

    const step = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const e = engineRef.current;

      if (e.phase === 'playing') {
        // Doğum (spawn)
        if (e.spawned < e.spawnCfg.count && now >= e.nextSpawnAt) {
          const x = 44 + Math.random() * (SCREEN_W - 88);
          e.monsters.push({
            id: e.nextEntityId++,
            x,
            y: SPAWN_Y,
            hp: e.spawnCfg.hp,
            maxHp: e.spawnCfg.hp,
            speed: e.spawnCfg.speed * (0.85 + Math.random() * 0.3),
          });
          e.spawned++;
          e.nextSpawnAt = now + e.spawnCfg.spawnGapMs;
        }

        // Canavar hareketi + üsse ulaşma
        e.monsters = e.monsters.filter((m) => {
          m.y += m.speed * dt;
          if (m.y >= BASE_Y) {
            e.baseHp = Math.max(0, e.baseHp - MONSTER_BASE_DAMAGE);
            return false;
          }
          return true;
        });

        // Otomatik ateş — üsse en yakın (en büyük y) canavarı hedefler
        if (e.monsters.length > 0 && now - e.lastFireAt >= PLAYER_FIRE_INTERVAL_MS) {
          const target = e.monsters.reduce((a, b) => (b.y > a.y ? b : a));
          const dx = target.x - SCREEN_W / 2;
          const dy = target.y - BASE_Y;
          const len = Math.hypot(dx, dy) || 1;
          e.projectiles.push({
            id: e.nextEntityId++,
            x: SCREEN_W / 2,
            y: BASE_Y,
            vx: (dx / len) * PROJECTILE_SPEED,
            vy: (dy / len) * PROJECTILE_SPEED,
            dmg: PLAYER_DAMAGE,
          });
          e.lastFireAt = now;
        }

        // Mermi hareketi
        e.projectiles = e.projectiles.filter((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          return p.x > -20 && p.x < SCREEN_W + 20 && p.y > -20 && p.y < SCREEN_H + 20;
        });

        // Çarpışmalar
        const deadProjectileIds = new Set<number>();
        for (const p of e.projectiles) {
          for (const m of e.monsters) {
            if (deadProjectileIds.has(p.id)) break;
            if (distance(p.x, p.y, m.x, m.y) < MONSTER_RADIUS + PROJECTILE_RADIUS) {
              m.hp -= p.dmg;
              deadProjectileIds.add(p.id);
            }
          }
        }
        if (deadProjectileIds.size > 0) {
          e.projectiles = e.projectiles.filter((p) => !deadProjectileIds.has(p.id));
        }
        const beforeCount = e.monsters.length;
        e.monsters = e.monsters.filter((m) => m.hp > 0);
        e.killCount += beforeCount - e.monsters.length;

        if (e.baseHp <= 0) {
          e.phase = 'gameover';
        } else if (e.spawned >= e.spawnCfg.count && e.monsters.length === 0) {
          e.phase = 'wave-clear';
          e.waveClearAt = now;
        }
      } else if (e.phase === 'wave-clear') {
        if (now - e.waveClearAt >= WAVE_CLEAR_PAUSE_MS) {
          e.wave += 1;
          e.spawnCfg = waveConfig(e.wave);
          e.spawned = 0;
          e.nextSpawnAt = now;
          e.phase = 'playing';
        }
      }

      setSnapshot({ ...e, monsters: [...e.monsters], projectiles: [...e.projectiles] });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (snapshot.phase === 'gameover' && !engineRef.current.finalized) {
      engineRef.current.finalized = true;
      finalize(snapshot.wave);
    }
  }, [snapshot.phase, snapshot.wave, finalize]);

  const fireBonusShot = useCallback(() => {
    const e = engineRef.current;
    if (e.phase !== 'playing' || e.monsters.length === 0) return;
    const now = Date.now();
    if (now - e.lastTapFireAt < TAP_COOLDOWN_MS) return;
    e.lastTapFireAt = now;
    const target = e.monsters.reduce((a, b) => (b.y > a.y ? b : a));
    const dx = target.x - SCREEN_W / 2;
    const dy = target.y - BASE_Y;
    const len = Math.hypot(dx, dy) || 1;
    e.projectiles.push({
      id: e.nextEntityId++,
      x: SCREEN_W / 2,
      y: BASE_Y,
      vx: (dx / len) * PROJECTILE_SPEED,
      vy: (dy / len) * PROJECTILE_SPEED,
      dmg: TAP_DAMAGE,
    });
  }, []);

  const restart = useCallback(() => {
    engineRef.current = freshEngine();
    setSnapshot(engineRef.current);
  }, []);

  const hpPct = Math.max(0, snapshot.baseHp / BASE_MAX_HP) * 100;

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={fireBonusShot}>
        {/* Canavarlar */}
        {snapshot.monsters.map((m) => (
          <View key={m.id} style={[styles.monsterWrap, { left: m.x - MONSTER_RADIUS, top: m.y - MONSTER_RADIUS }]}>
            <View style={styles.monsterHpTrack}>
              <View style={[styles.monsterHpFill, { width: `${Math.max(0, (m.hp / m.maxHp) * 100)}%` }]} />
            </View>
            <MaterialCommunityIcons name="ghost" size={MONSTER_RADIUS * 2} color="#E38A96" />
          </View>
        ))}

        {/* Mermiler */}
        {snapshot.projectiles.map((p) => (
          <View
            key={p.id}
            style={[
              styles.projectile,
              { left: p.x - PROJECTILE_RADIUS, top: p.y - PROJECTILE_RADIUS, backgroundColor: p.dmg === TAP_DAMAGE ? '#8FD8F2' : GOLD },
            ]}
          />
        ))}

        {/* Üs */}
        <View style={[styles.base, { top: BASE_Y - 26 }]}>
          <MaterialCommunityIcons name="shield-star" size={52} color={GOLD} />
        </View>
      </Pressable>

      {/* HUD */}
      <View style={[styles.hud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} style={styles.exitButton} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={20} color={TEXT_PRIMARY} />
        </Pressable>
        <View style={styles.hudCenter}>
          <Text style={styles.waveText}>Dalga {snapshot.wave}</Text>
          <View style={styles.hpTrack}>
            <View style={[styles.hpFill, { width: `${hpPct}%` }]} />
          </View>
        </View>
      </View>

      {snapshot.phase === 'wave-clear' && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayTitle}>Dalga {snapshot.wave} Tamamlandı!</Text>
          <Text style={styles.overlaySubtitle}>Sıradaki dalga geliyor…</Text>
        </View>
      )}

      {snapshot.phase === 'gameover' && (
        <View style={styles.gameOverCard}>
          <MaterialCommunityIcons name="skull-outline" size={40} color={GOLD} />
          <Text style={styles.overlayTitle}>Üs Düştü</Text>
          <Text style={styles.gameOverStat}>Ulaştığın Dalga: {snapshot.wave}</Text>
          <Text style={styles.gameOverStat}>Alt Ettiğin Canavar: {snapshot.killCount}</Text>
          <Text style={styles.gameOverReward}>+{Math.min(snapshot.wave * 2, 200)} Coin kazandın 🌙</Text>
          <View style={styles.gameOverButtons}>
            <Pressable onPress={restart} style={[styles.gameOverButton, styles.gameOverButtonPrimary]}>
              <Text style={styles.gameOverButtonPrimaryText}>Tekrar Oyna</Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()} style={styles.gameOverButton}>
              <Text style={styles.gameOverButtonText}>Çık</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NIGHT_DEEP,
  },
  monsterWrap: {
    position: 'absolute',
    width: MONSTER_RADIUS * 2,
    alignItems: 'center',
  },
  monsterHpTrack: {
    width: MONSTER_RADIUS * 1.6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 2,
  },
  monsterHpFill: {
    height: '100%',
    backgroundColor: '#E35D6A',
  },
  projectile: {
    position: 'absolute',
    width: PROJECTILE_RADIUS * 2,
    height: PROJECTILE_RADIUS * 2,
    borderRadius: PROJECTILE_RADIUS,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  base: {
    position: 'absolute',
    left: SCREEN_W / 2 - 26,
    alignItems: 'center',
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 17, 64, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudCenter: {
    flex: 1,
  },
  waveText: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
    marginBottom: 4,
  },
  hpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  overlaySubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 6,
  },
  gameOverCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '30%',
    backgroundColor: 'rgba(21, 15, 48, 0.96)',
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  gameOverStat: {
    fontSize: 13.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  gameOverReward: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 8,
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  gameOverButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.35)',
  },
  gameOverButtonPrimary: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  gameOverButtonPrimaryText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1a0d33',
  },
  gameOverButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
});
