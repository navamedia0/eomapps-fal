import { useState } from 'react';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

const SOCIAL_ACCOUNTS = [
  { key: 'google', name: 'Google', icon: <MaterialCommunityIcons name="google" size={20} color={GOLD} /> },
  { key: 'facebook', name: 'Facebook', icon: <FontAwesome name="facebook" size={18} color={GOLD} /> },
  { key: 'instagram', name: 'Instagram', icon: <FontAwesome name="instagram" size={18} color={GOLD} /> },
  { key: 'whatsapp', name: 'WhatsApp', icon: <FontAwesome name="whatsapp" size={18} color={GOLD} /> },
];

export default function ProfilScreen({ navigation }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        <View style={styles.list}>
          <Pressable
            onPress={() => navigation.navigate('ProfileChat')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon
              source={FEATURE_ICONS.profileChat}
              fallback={<Ionicons name="chatbubble-ellipses-outline" size={22} color={GOLD} />}
            />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Kendinden Bahset</Text>
              <Text style={styles.cardSubtitle}>Seni tanıyalım, daha kişisel yorumlar sunalım</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Tasks')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon source={FEATURE_ICONS.tasks} fallback={<Ionicons name="ribbon-outline" size={22} color={GOLD} />} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Görevler</Text>
              <Text style={styles.cardSubtitle}>Video izleyerek bonus kredi kazan</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Favorites')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="star-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Favorilerim</Text>
              <Text style={styles.cardSubtitle}>Kaydettiğin sözler ve bilgi kartları</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('History')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Geçmiş</Text>
              <Text style={styles.cardSubtitle}>Baktırdığın falların geçmişi (cihazında saklanır)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('NotificationSettings')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon
              source={FEATURE_ICONS.notificationSettings}
              fallback={<Ionicons name="notifications-outline" size={22} color={GOLD} />}
            />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Bildirim Ayarları</Text>
              <Text style={styles.cardSubtitle}>Günlük hatırlatmaları yönet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Bağlı Hesaplar</Text>
        <Text style={styles.sectionHint}>
          Bu özellik yakında aktif olacak — hesap bağlama şu an sadece önizleme amaçlı gösteriliyor.
        </Text>
        <View style={styles.socialList}>
          {SOCIAL_ACCOUNTS.map((account) => (
            <View key={account.key} style={styles.socialRow}>
              <View style={styles.socialIconWrap}>{account.icon}</View>
              <Text style={styles.socialName}>{account.name}</Text>
              <Pressable
                onPress={() => setNotice(`${account.name} hesabı bağlama özelliği yakında aktif olacak.`)}
                style={styles.socialConnectButton}
              >
                <Text style={styles.socialConnectButtonText}>Bağla</Text>
              </Pressable>
            </View>
          ))}
        </View>
        {notice && <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  list: {
    gap: 14,
    marginBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
    marginBottom: 14,
  },
  socialList: {
    gap: 10,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  socialIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  socialConnectButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  socialConnectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
  },
  notice: {
    fontSize: 11.5,
    color: GOLD,
    textAlign: 'center',
    marginTop: 12,
  },
});
