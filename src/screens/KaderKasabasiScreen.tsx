import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { TabScreenProps } from '@/navigation/types';
import GameEntryGate from '@/components/GameEntryGate';
import CharacterWardrobeModal from '@/components/game/CharacterWardrobeModal';
import DailyRewardModal from '@/components/game/DailyRewardModal';
import TarotCardShopModal from '@/components/game/TarotCardShopModal';
import CharacterAvatarView from '@/components/game/CharacterAvatarView';
import Town3DCanvas from '@/components/game/Town3DCanvas';
import {
  type PlayerProfile,
  subscribePlayerProfile,
} from '@/services/characterCosmetics';
import { getCoins, subscribeCoins } from '@/services/coins';
import { subscribeWallet } from '@/services/shop';
import {
  type TownBuildingData,
  subscribeTownBuildings,
  repairBuilding,
  upgradeBuilding,
  toggleStoreBuilding,
} from '@/services/townBuildings';
import { getUnlockedTarotCards, calculateCollectionStats } from '@/services/tarotCollection';
import { showAlert } from '@/services/themedAlert';
import { GOLD, NIGHT_DEEP, TEXT_MUTED } from '@/theme/colors';

const MASCOT_FOX = require('@/assets/kasaba/mystic_fox_transparent.png');

const LOADING_LINES = [
  'Büyülü kasaba aydınlanıyor…',
  'Yıldız fenerleri yakılıyor…',
  'Tarot kartları diziliyor…',
  'Kahramanlar toplanıyor…',
];

const MASCOT_TIPS = [
  'Binalara dokunarak seçim yapabilir, harabeleri onarabilir ve geliştirebilirsin!',
  'Mistik Kart Tapınağından özel tarot kartları alıp koleksiyon puanını katla!',
  'Büyü Dükkanından karakterine yeni kanat ve zırh kuşanmayı unutma!',
  'İki parmağınla kasabayı detaylı incelemek için yakınlaştırabilirsin.',
  'Beni ekranda istediğin yere sürükleyip bırakabilirsin.',
];

const TOWN_ANNOUNCEMENTS = [
  { id: '1', title: 'Mistik Kart Tapınağı Açıldı!', text: 'Özel Tarot Kartlarını toplayıp koleksiyon unvanlarını kazan!', tag: 'Yeni' },
  { id: '2', title: 'Bina Onarım & Geliştirme', text: 'Harabeleri onararak kasabana yeni özellikler ve savaş gücü kazandır.', tag: 'Sistem' },
  { id: '3', title: 'Giriş Bonusu', text: '7 gün üst üste giriş yap, efsanevi kanat kazan!', tag: 'Ödül' },
];

type Props = TabScreenProps;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function KaderKasabasiScreen({ navigation }: Props) {
  return (
    <GameEntryGate
      title="Kader Kasabası"
      subtitle="Binaları inşa et, tarot kartlarını topla, karakterini giydir ve kasabanın hükümdarı ol!"
      icon="castle"
      buttonLabel="Kasabaya Gir"
      loadingLines={LOADING_LINES}
      onExit={() => navigation.goBack()}
    >
      <KaderKasabasiHub navigation={navigation} />
    </GameEntryGate>
  );
}

function KaderKasabasiHub({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [buildings, setBuildings] = useState<Record<string, TownBuildingData>>({});
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [tarotShopOpen, setTarotShopOpen] = useState(false);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [collectionScore, setCollectionScore] = useState(0);

  // Draggable Mascot Position
  const mascotPan = useRef(new Animated.ValueXY({ x: SCREEN_W * 0.42, y: SCREEN_H * 0.45 })).current;

  // Selection bounce animation for active building
  const selectBounceAnim = useRef(new Animated.Value(1)).current;

  const updateTarotStats = async () => {
    const cards = await getUnlockedTarotCards();
    const stats = calculateCollectionStats(cards);
    setCollectionScore(stats.totalPoints);
  };

  useEffect(() => {
    const unsubProfile = subscribePlayerProfile(setProfile);
    const unsubCoins = subscribeCoins(setCoins);
    const unsubBuildings = subscribeTownBuildings(setBuildings);
    const unsubWallet = subscribeWallet((balances: { crystal: number }) => {
      setDiamonds(balances.crystal);
    });
    getCoins().then(setCoins);
    updateTarotStats();

    return () => {
      unsubProfile();
      unsubCoins();
      unsubBuildings();
      unsubWallet();
    };
  }, []);

  const handleSelectBuilding = (buildingKey: string | null) => {
    setSelectedBuildingId(buildingKey);
    if (buildingKey) {
      selectBounceAnim.setValue(0.92);
      Animated.spring(selectBounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleRepairBuilding = async (buildingKey: string) => {
    const result = await repairBuilding(buildingKey);
    showAlert(result.success ? 'İnşaat Tamamlandı!' : 'İşlem Başarısız', result.message);
  };

  const handleUpgradeBuilding = async (buildingKey: string) => {
    const result = await upgradeBuilding(buildingKey);
    showAlert(result.success ? 'Bina Yükseltildi!' : 'Yetersiz Kaynak', result.message);
  };

  const handleToggleStoreBuilding = async (buildingKey: string) => {
    const result = await toggleStoreBuilding(buildingKey);
    showAlert('Depo Durumu', result.message);
  };

  const handleEnterBuilding = (buildingKey: string) => {
    switch (buildingKey) {
      case 'birlik-kulubu':
      case 'onur-listesi':
        showAlert('Klan Kalesi', 'Klan Savaşları ve Lonca Sezonu çok yakında başlıyor!');
        break;
      case 'oyun-salonu':
        navigation.navigate('MiniGames');
        break;
      case 'kart-dukkani':
        setTarotShopOpen(true);
        break;
      case 'ciftlik':
        showAlert('Mistik Çiftlik', 'Bitkilerini ektin! 4 saat sonra 250 Altın ve Şans İksiri hasat edebilirsin.');
        break;
      case 'kesif-rihtimi':
        showAlert('Keşif Rıhtımı', 'Geminiz mistik adalara doğru yola çıktı. 6 saat sonra ödüllerle dönecek!');
        break;
      case 'karakter-kulubu':
      case 'alisveris-merkezi':
        setWardrobeOpen(true);
        break;
      default:
        showAlert('Bina Girişi', 'Bu binanın gizemli kapıları açılıyor…');
    }
  };

  const activeSelectedBuilding = selectedBuildingId ? buildings[selectedBuildingId] : null;

  // Sürüklenebilir Tilki Maskotu
  const mascotPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        mascotPan.setOffset({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          x: (mascotPan.x as any)._value,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          y: (mascotPan.y as any)._value,
        });
        mascotPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: mascotPan.x, dy: mascotPan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        mascotPan.flattenOffset();
      },
    })
  ).current;

  return (
    <View style={styles.root}>
      {/* 100% SAF 3D THREE.JS KASABA MOTORU */}
      <Town3DCanvas onBuildingSelected={handleSelectBuilding} />

      {/* DRAGGABLE MİSTİK TİLKİ MASKOTU */}
      <Animated.View
        style={[
          styles.draggableMascotWrap,
          {
            transform: [{ translateX: mascotPan.x }, { translateY: mascotPan.y }],
          },
        ]}
        {...mascotPanResponder.panHandlers}
      >
        <Pressable
          onPress={() => {
            const randomTip = MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)];
            showAlert('Mistik Tilki', randomTip);
          }}
        >
          <Image source={MASCOT_FOX} style={styles.mascotFoxImage} resizeMode="contain" />
        </Pressable>
      </Animated.View>

      {/* ÜST OYUN HUD */}
      <View style={[styles.topHud, { top: insets.top + 6 }]} pointerEvents="box-none">
        {/* Sol: Avatar, Seviye, Güç */}
        <Pressable onPress={() => setWardrobeOpen(true)} style={styles.playerProfileCard}>
          <View style={styles.avatarBorder}>
            {profile && <CharacterAvatarView equipped={profile.equipped} size={36} showAura={false} />}
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>Lv.{profile?.level || 12}</Text>
            </View>
          </View>

          <View style={styles.playerInfoCol}>
            <View style={styles.vipRow}>
              <Text style={styles.vipText}>VIP {profile?.vipLevel || 3}</Text>
              <Text style={styles.playerNameText} numberOfLines={1}>
                {profile?.title || 'Kasaba Muhafızı'}
              </Text>
            </View>
            <View style={styles.powerPill}>
              <MaterialCommunityIcons name="sword-cross" size={12} color="#F59E0B" />
              <Text style={styles.powerText}>⚔️ {profile?.combatPower.toLocaleString() || '1,850'}</Text>
            </View>
          </View>
        </Pressable>

        {/* Sağ: Altın, Elmas, Tarot Puanı & Geri */}
        <View style={styles.walletGroup}>
          <Pressable onPress={() => setTarotShopOpen(true)} style={styles.tarotScorePill}>
            <MaterialCommunityIcons name="cards-playing-outline" size={13} color="#F59E0B" />
            <Text style={styles.tarotScoreText}>{collectionScore} P</Text>
          </Pressable>

          <Pressable onPress={() => setDailyModalOpen(true)} style={styles.currencyPill}>
            <MaterialCommunityIcons name="circle-multiple" size={14} color={GOLD} />
            <Text style={styles.currencyText}>{coins.toLocaleString()}</Text>
          </Pressable>

          <Pressable onPress={() => setDailyModalOpen(true)} style={styles.currencyPill}>
            <Ionicons name="diamond" size={12} color="#67E8F9" />
            <Text style={styles.currencyText}>{diamonds.toLocaleString()}</Text>
          </Pressable>

          {/* Duyurular Butonu */}
          <Pressable onPress={() => setAnnouncementsOpen(true)} style={styles.hudIconBtn} hitSlop={8}>
            <MaterialCommunityIcons name="bullhorn" size={17} color={GOLD} />
          </Pressable>

          {/* Çıkış / Geri Butonu */}
          <Pressable onPress={() => navigation.goBack()} style={styles.hudIconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={17} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* CLASH OF CLANS STİLİ: SEÇİLEN BİNA AKSİYON KARTI */}
      {activeSelectedBuilding && (
        <View style={[styles.buildingSheetWrap, { bottom: insets.bottom + 70 }]}>
          <LinearGradient colors={['#2A185C', '#130C30']} style={styles.buildingSheetCard}>
            <View style={styles.buildingSheetHeader}>
              <View style={[styles.sheetIconCircle, { borderColor: activeSelectedBuilding.glowColor }]}>
                <MaterialCommunityIcons name={activeSelectedBuilding.icon as never} size={22} color={activeSelectedBuilding.glowColor} />
              </View>

              <View style={styles.sheetInfoCol}>
                <View style={styles.sheetTitleRow}>
                  <Text style={styles.sheetTitle}>{activeSelectedBuilding.title}</Text>
                  {activeSelectedBuilding.status === 'ruined' ? (
                    <View style={styles.sheetRuinedBadge}>
                      <Text style={styles.sheetRuinedText}>Harabe / Kilitli</Text>
                    </View>
                  ) : (
                    <View style={styles.sheetLevelBadge}>
                      <Text style={styles.sheetLevelText}>Seviye {activeSelectedBuilding.level}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sheetSubtitle}>{activeSelectedBuilding.subtitle}</Text>
              </View>

              <Pressable onPress={() => setSelectedBuildingId(null)} style={styles.sheetCloseBtn} hitSlop={10}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </Pressable>
            </View>

            <Text style={styles.sheetDescription} numberOfLines={2}>
              {activeSelectedBuilding.description}
            </Text>

            {/* Aksiyon Butonları: İnşa Et / Onar vs Giriş Yap & Yükselt & Depola */}
            <View style={styles.sheetActionRow}>
              {activeSelectedBuilding.status === 'ruined' ? (
                <Pressable
                  onPress={() => handleRepairBuilding(activeSelectedBuilding.id)}
                  style={styles.sheetRepairBtn}
                >
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.sheetActionGradient}>
                    <MaterialCommunityIcons name="hammer-wrench" size={18} color="#fff" />
                    <Text style={styles.sheetActionBtnText}>
                      Onar & İnşa Et ({activeSelectedBuilding.repairCostCoins} Altın)
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    onPress={() => handleEnterBuilding(activeSelectedBuilding.id)}
                    style={[styles.sheetEnterBtn, { flex: 1.4 }]}
                  >
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.sheetActionGradient}>
                      <MaterialCommunityIcons name="door-open" size={18} color="#140D36" />
                      <Text style={[styles.sheetActionBtnText, { color: '#140D36' }]}>Giriş Yap</Text>
                    </LinearGradient>
                  </Pressable>

                  {activeSelectedBuilding.level < activeSelectedBuilding.maxLevel && (
                    <Pressable
                      onPress={() => handleUpgradeBuilding(activeSelectedBuilding.id)}
                      style={[styles.sheetUpgradeBtn, { flex: 1.2 }]}
                    >
                      <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.sheetActionGradient}>
                        <MaterialCommunityIcons name="arrow-up-bold-circle" size={16} color="#FDE68A" />
                        <Text style={styles.sheetActionBtnText}>
                          Yükselt ({activeSelectedBuilding.upgradeCostCoins})
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => handleToggleStoreBuilding(activeSelectedBuilding.id)}
                    style={styles.sheetStoreBtn}
                  >
                    <MaterialCommunityIcons
                      name={activeSelectedBuilding.status === 'stored' ? 'archive-arrow-up' : 'archive-arrow-down'}
                      size={18}
                      color="#A78BFA"
                    />
                  </Pressable>
                </>
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ALT OYUN MENÜSÜ */}
      <View style={[styles.bottomHudWrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
        <LinearGradient colors={['rgba(26, 16, 60, 0.95)', 'rgba(10, 6, 26, 0.98)']} style={styles.bottomHudGlass}>
          <Pressable onPress={() => setWardrobeOpen(true)} style={styles.hudActionItem}>
            <View style={[styles.hudIconBg, { backgroundColor: '#F59E0B' }]}>
              <MaterialCommunityIcons name="shield-account" size={18} color="#140D36" />
            </View>
            <Text style={styles.hudItemLabel}>Karakter</Text>
          </Pressable>

          <Pressable onPress={() => setTarotShopOpen(true)} style={styles.hudActionItem}>
            <View style={[styles.hudIconBg, { backgroundColor: '#8B5CF6' }]}>
              <MaterialCommunityIcons name="cards-playing" size={18} color="#fff" />
            </View>
            <Text style={styles.hudItemLabel}>Tarot Kart</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Tasks')} style={styles.hudActionItem}>
            <View style={[styles.hudIconBg, { backgroundColor: '#10B981' }]}>
              <MaterialCommunityIcons name="clipboard-check" size={18} color="#fff" />
            </View>
            <Text style={styles.hudItemLabel}>Görevler</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('CoinShop')} style={styles.hudActionItem}>
            <View style={[styles.hudIconBg, { backgroundColor: '#EC4899' }]}>
              <MaterialCommunityIcons name="store" size={18} color="#fff" />
            </View>
            <Text style={styles.hudItemLabel}>Dükkan</Text>
          </Pressable>

          <Pressable onPress={() => showAlert('Sıralama', 'Liderlik tablosu yeni sezonda açılıyor!')} style={styles.hudActionItem}>
            <View style={[styles.hudIconBg, { backgroundColor: '#38BDF8' }]}>
              <MaterialCommunityIcons name="trophy" size={18} color="#140D36" />
            </View>
            <Text style={styles.hudItemLabel}>Sıralama</Text>
          </Pressable>

          <Pressable onPress={() => setDailyModalOpen(true)} style={styles.hudActionItem}>
            <View style={[styles.hudIconBg, { backgroundColor: '#FB923C' }]}>
              <MaterialCommunityIcons name="gift" size={18} color="#140D36" />
            </View>
            <Text style={styles.hudItemLabel}>Ödül</Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* KARAKTER GARDIROP MODALI */}
      {wardrobeOpen && profile && (
        <CharacterWardrobeModal
          visible={wardrobeOpen}
          profile={profile}
          onClose={() => setWardrobeOpen(false)}
          onProfileUpdated={setProfile}
        />
      )}

      {/* TAROT KART TAPINAĞI MODALI */}
      {tarotShopOpen && (
        <TarotCardShopModal
          visible={tarotShopOpen}
          onClose={() => {
            setTarotShopOpen(false);
            updateTarotStats();
          }}
        />
      )}

      {/* GÜNLÜK ÖDÜL MODALI */}
      {dailyModalOpen && profile && (
        <DailyRewardModal
          visible={dailyModalOpen}
          profile={profile}
          onClose={() => setDailyModalOpen(false)}
          onClaimed={setProfile}
        />
      )}

      {/* KASABA DUYURULARI MODALI */}
      <Modal visible={announcementsOpen} transparent animationType="fade" onRequestClose={() => setAnnouncementsOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAnnouncementsOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <LinearGradient colors={['#2A185C', '#140D36']} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <MaterialCommunityIcons name="bullhorn-outline" size={22} color={GOLD} />
                  <Text style={styles.modalTitle}>Kasaba Fermanı</Text>
                </View>
                <Pressable onPress={() => setAnnouncementsOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color={TEXT_MUTED} />
                </Pressable>
              </View>

              <View style={styles.announcementList}>
                {TOWN_ANNOUNCEMENTS.map((item) => (
                  <View key={item.id} style={styles.announcementItem}>
                    <View style={styles.announcementTop}>
                      <Text style={styles.announcementTitle}>{item.title}</Text>
                      <View style={styles.announcementTag}>
                        <Text style={styles.announcementTagText}>{item.tag}</Text>
                      </View>
                    </View>
                    <Text style={styles.announcementBody}>{item.text}</Text>
                  </View>
                ))}
              </View>

              <Pressable onPress={() => setAnnouncementsOpen(false)} style={styles.announcementCloseBtn}>
                <Text style={styles.announcementCloseBtnText}>Anladım</Text>
              </Pressable>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NIGHT_DEEP,
  },

  // ÜST OYUN HUD
  topHud: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 13, 54, 0.88)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1.2,
    borderColor: '#7C3AED',
    gap: 7,
    maxWidth: SCREEN_W * 0.42,
  },
  avatarBorder: {
    position: 'relative',
  },
  levelTag: {
    position: 'absolute',
    bottom: -4,
    left: -2,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  levelTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
  playerInfoCol: {
    flexShrink: 1,
  },
  vipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vipText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F43F5E',
  },
  playerNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    flexShrink: 1,
  },
  powerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  powerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
  },

  walletGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 13, 54, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3D2A7A',
    gap: 3,
  },
  currencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  tarotScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 13, 54, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 3,
  },
  tarotScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
  },
  hudIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(20, 13, 54, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D2A7A',
  },

  // SÜRÜKLENEBİLİR MİSTİK TİLKİ MASKOTU
  draggableMascotWrap: {
    position: 'absolute',
    zIndex: 25,
    width: 58,
    height: 58,
  },
  mascotFoxImage: {
    width: 58,
    height: 58,
  },

  // CLASH OF CLANS SEÇİLEN BİNA AKSİYON KARTI
  buildingSheetWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 35,
  },
  buildingSheetCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buildingSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 13, 54, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  sheetInfoCol: {
    flex: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  sheetRuinedBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sheetRuinedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  sheetLevelBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sheetLevelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDE68A',
  },
  sheetSubtitle: {
    fontSize: 10,
    color: '#A78BFA',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetDescription: {
    fontSize: 11,
    color: '#D1D5DB',
    lineHeight: 15,
    marginBottom: 10,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetRepairBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sheetEnterBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sheetUpgradeBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sheetStoreBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 13, 54, 0.8)',
    borderWidth: 1,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  sheetActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },

  // ALT OYUN MENÜSÜ
  bottomHudWrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    zIndex: 20,
  },
  bottomHudGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 24,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderWidth: 1.2,
    borderColor: '#7C3AED',
  },
  hudActionItem: {
    alignItems: 'center',
    gap: 2,
  },
  hudIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  hudItemLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E0E7FF',
  },

  // MODAL STİLLERİ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  modalGradient: {
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
  },
  announcementList: {
    gap: 10,
    marginBottom: 14,
  },
  announcementItem: {
    backgroundColor: 'rgba(20, 13, 54, 0.7)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3D2A7A',
  },
  announcementTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  announcementTag: {
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  announcementTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FDE68A',
  },
  announcementBody: {
    fontSize: 10,
    color: '#C4B5FD',
    lineHeight: 14,
  },
  announcementCloseBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  announcementCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
});
