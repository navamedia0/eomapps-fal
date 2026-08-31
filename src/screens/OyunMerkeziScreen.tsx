import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { TabScreenProps } from '@/navigation/types';
import { GOLD, NIGHT_DEEP } from '@/theme/colors';

type Props = TabScreenProps;

export default function OyunMerkeziScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Oyun Merkezi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <LinearGradient colors={['#242426', '#0D0D0E']} style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="controller-classic-outline" size={48} color={GOLD} />
          </View>
          <Text style={styles.title}>Oyun Merkezi Yakında Açılıyor</Text>
          <Text style={styles.subtitle}>
            Okey gibi keyifli, klasik masa oyunları burada toplanacak. Şimdilik Mini Oyunlar bölümünden Coin kazanabilirsin.
          </Text>

          <View style={styles.badge}>
            <MaterialCommunityIcons name="hammer-wrench" size={16} color="#FDE68A" />
            <Text style={styles.badgeText}>YAPIM AŞAMASINDA</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NIGHT_DEEP,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF8A00',
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 138, 0, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#E8E2D0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
});
