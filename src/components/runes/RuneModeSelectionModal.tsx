import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GOLD, GOLD_SOFT, TEXT_MUTED } from '@/theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectClothReading: () => void;
  onSelectTableReading: () => void;
};

export default function RuneModeSelectionModal({
  visible,
  onClose,
  onSelectClothReading,
  onSelectTableReading,
}: Props) {
  const handleSelect = (mode: 'cloth' | 'table') => {
    onClose();
    if (mode === 'cloth') onSelectClothReading();
    else onSelectTableReading();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.container}>
          <LinearGradient
            colors={['#102235', '#0B1626', '#060D18']}
            style={StyleSheet.absoluteFillObject}
          />

          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={TEXT_MUTED} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="triangle-outline" size={26} color="#38BDF8" />
            </View>
            <Text style={styles.title}>Nordik Runik Taşlar</Text>
            <Text style={styles.subtitle}>
              24 Kadim Elder Futhark Taşı · Açılım ve Kehanet Modunuzu Seçin
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {/* 1. MOD: Keseden Dökülsün & Kutsal Kumaş */}
            <View style={[styles.modeCard, { borderColor: '#38BDF855' }]}>
              <LinearGradient
                colors={['rgba(56, 189, 248, 0.08)', 'rgba(56, 189, 248, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: '#38BDF822', borderColor: '#38BDF866' }]}>
                  <Text style={[styles.badgeText, { color: '#38BDF8' }]}>1. MOD · KUMAŞ ÇEKİMİ</Text>
                </View>
                <MaterialCommunityIcons name="hand-back-left" size={22} color="#38BDF8" />
              </View>

              <Text style={styles.cardTitle}>Keseden Dökülsün & Kutsal Kumaş</Text>
              <Text style={styles.cardSubtitle}>Vikinglerin kutsal kehanet kumaşı üzerinde rün çekimi</Text>

              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>✦ Kutsal Viking kesesinden taşları niyetinle dök</Text>
                <Text style={styles.bulletItem}>✦ 1, 3 veya 5 taşlık kadim kumaş dizilimi ile kaderini öğren</Text>
                <Text style={styles.bulletItem}>✦ Elder Futhark sembolizminin kadim yorumu</Text>
              </View>

              <Pressable
                onPress={() => handleSelect('cloth')}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#38BDF8' }, pressed && styles.actionBtnPressed]}
              >
                <Text style={styles.actionBtnText}>Kumaşta Taşları Dök & Başla</Text>
                <Ionicons name="arrow-forward" size={16} color="#060D18" />
              </Pressable>
            </View>

            {/* 2. MOD: Kendin Seç & Rün Masası */}
            <View style={[styles.modeCard, { borderColor: '#0284C755' }]}>
              <LinearGradient
                colors={['rgba(2, 132, 199, 0.08)', 'rgba(2, 132, 199, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: '#0284C722', borderColor: '#0284C766' }]}>
                  <Text style={[styles.badgeText, { color: '#0284C7' }]}>2. MOD · KEHANET ATÖLYESİ</Text>
                </View>
                <MaterialCommunityIcons name="table-furniture" size={22} color="#0284C7" />
              </View>

              <Text style={styles.cardTitle}>Kendin Seç & Rün Masası</Text>
              <Text style={styles.cardSubtitle}>24 Futhark taşını masada tek tek inceleme ve serim</Text>

              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>✦ 24 kutsal taşı masada tek tek incele, çevir ve dizilimi öğren</Text>
                <Text style={styles.bulletItem}>✦ Taşların ezoterik anlamlarını, düz/ters enerjilerini keşfet</Text>
                <Text style={styles.bulletItem}>✦ (Sembolizm ve taş dizilimi atölyesidir)</Text>
              </View>

              <Pressable
                onPress={() => handleSelect('table')}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#0284C7' }, pressed && styles.actionBtnPressed]}
              >
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Rün Masasına Geç</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 6, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 32,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    overflow: 'hidden',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  closeBtn: {
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
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  list: {
    gap: 12,
    paddingBottom: 8,
  },
  modeCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 18, 24, 0.94)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginBottom: 8,
  },
  bulletList: {
    gap: 4,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 11.5,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  actionBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#060D18',
  },
});
