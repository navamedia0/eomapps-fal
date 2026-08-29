import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';
import { addCoins } from '@/services/coins';
import { unlockCosmetic, type PlayerProfile, savePlayerProfile } from '@/services/characterCosmetics';
import { showAlert } from '@/services/themedAlert';

const { width: SCREEN_W } = Dimensions.get('window');

const DAILY_REWARDS = [
  { day: 1, label: '100 Altın', coins: 100, icon: 'circle-multiple' },
  { day: 2, label: '25 Elmas', diamonds: 25, icon: 'diamond' },
  { day: 3, label: '300 Altın', coins: 300, icon: 'circle-multiple' },
  { day: 4, label: '50 Elmas', diamonds: 50, icon: 'diamond' },
  { day: 5, label: '600 Altın', coins: 600, icon: 'circle-multiple' },
  { day: 6, label: '100 Elmas', diamonds: 100, icon: 'diamond' },
  { day: 7, label: 'Melek Kanadı', cosmeticId: 'wings_holy_angel', icon: 'feather' },
];

type Props = {
  visible: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onClaimed: (updated: PlayerProfile) => void;
};

export default function DailyRewardModal({ visible, profile, onClose, onClaimed }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimed = profile.lastDailyClaimDate === todayStr;
  const currentDayIndex = (profile.consecutiveDailyDays % 7);
  const todayReward = DAILY_REWARDS[currentDayIndex];

  const handleClaim = async () => {
    if (alreadyClaimed) {
      showAlert('Zaten Alındı', 'Bugünkü günlük ödülünü zaten aldın! Yarın tekrar gel.');
      return;
    }

    if (todayReward.coins) {
      await addCoins(todayReward.coins);
    } else if (todayReward.diamonds) {
      await addCoins(todayReward.diamonds * 10);
    }
    if (todayReward.cosmeticId) {
      await unlockCosmetic(todayReward.cosmeticId);
    }

    const nextDays = profile.consecutiveDailyDays + 1;
    const updated: PlayerProfile = {
      ...profile,
      exp: profile.exp + 100,
      lastDailyClaimDate: todayStr,
      consecutiveDailyDays: nextDays,
    };
    await savePlayerProfile(updated);
    onClaimed(updated);
    showAlert('Ödül Alındı!', `Tebrikler! ${todayReward.label} ve +100 EXP kazandın.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <LinearGradient colors={['#2D1B69', '#140D36']} style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="gift-open" size={24} color={GOLD} />
              <Text style={styles.titleText}>Günlük Giriş Ödülü</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.subtitle}>
              Her gün giriş yaparak kasaba hazinesinden ödülleri topla! 7. günde efsanevi kanat kazan!
            </Text>

            <View style={styles.grid}>
              {DAILY_REWARDS.map((reward, i) => {
                const isToday = i === currentDayIndex && !alreadyClaimed;
                const isClaimedPast = i < currentDayIndex || (i === currentDayIndex && alreadyClaimed);

                return (
                  <View
                    key={reward.day}
                    style={[
                      styles.rewardCard,
                      reward.day === 7 && styles.rewardCardDay7,
                      isToday && styles.rewardCardToday,
                    ]}
                  >
                    <Text style={styles.dayText}>{reward.day}. Gün</Text>
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons
                        name={reward.icon as never}
                        size={reward.day === 7 ? 28 : 22}
                        color={reward.day === 7 ? '#F59E0B' : reward.diamonds ? '#67E8F9' : GOLD}
                      />
                    </View>
                    <Text style={styles.rewardLabel}>{reward.label}</Text>
                    {isClaimedPast && (
                      <View style={styles.claimedOverlay}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={handleClaim}
              disabled={alreadyClaimed}
              style={[styles.claimButton, alreadyClaimed && styles.claimButtonDisabled]}
            >
              <MaterialCommunityIcons name="star-face" size={20} color={alreadyClaimed ? TEXT_MUTED : '#140D36'} />
              <Text style={[styles.claimButtonText, alreadyClaimed && styles.claimButtonTextDisabled]}>
                {alreadyClaimed ? 'Bugün Alındı' : 'Günün Ödülünü Al'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: NIGHT_DEEP,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
    alignItems: 'center',
    gap: 14,
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  rewardCard: {
    width: (SCREEN_W - 80) / 4,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  rewardCardDay7: {
    width: (SCREEN_W - 80) / 2 + 4,
    borderColor: GOLD,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  rewardCardToday: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  iconCircle: {
    marginBottom: 2,
  },
  rewardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  claimedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 5, 25, 0.7)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 12,
    marginTop: 6,
  },
  claimButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#140D36',
  },
  claimButtonTextDisabled: {
    color: TEXT_MUTED,
  },
});
