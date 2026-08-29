import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 340);

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
};

export default function SozlerKoskuDrawerModal({ visible, onClose, navigation }: Props) {
  const insets = useSafeAreaInsets();

  const handleNavigate = (screen: string, params?: any) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screen, params);
    }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop Tap to Close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Slide-in Drawer Container */}
        <View style={[styles.drawer, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleRow}>
              <MaterialCommunityIcons name="book-open-page-variant" size={24} color={GOLD} />
              <Text style={styles.drawerTitle}>Mistik Menü</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color={GOLD} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>
            {/* 1. SÖZLER KÖŞKÜ (Müstakil Anlamlı Sözler Ekranı) */}
            <Pressable
              onPress={() => handleNavigate('SozlerKosku')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(242, 200, 121, 0.15)' }]}>
                <MaterialCommunityIcons name="feather" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Sözler Köşkü</Text>
                <Text style={styles.menuItemDesc}>Günün anlamlı sözleri ve popüler liste</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* 2. BİLGİ KÖŞESİ (Müstakil 7.500 Bilgi Kartı Ekranı) */}
            <Pressable
              onPress={() => handleNavigate('BilgiKosesi')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
                <Ionicons name="library-outline" size={20} color="#C084FC" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Bilgi Köşesi</Text>
                <Text style={styles.menuItemDesc}>7.500 kadim bilgi kartı ve arama</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* 3. HAFTANIN EN SEVİLENLERİ (Sözler & Bilgiler - Pazartesi 08:00) */}
            <Pressable
              onPress={() => handleNavigate('HaftaninSevilenleri')}
              style={({ pressed }) => [styles.menuItem, styles.highlightMenuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.18)' }]}>
                <Ionicons name="flame" size={20} color="#EF4444" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuItemTitle, { color: '#FCA5A5' }]}>Haftanın En Sevilenleri</Text>
                <Text style={styles.menuItemDesc}>Haftalık 15 popüler söz ve bilgi kartı</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            <View style={styles.divider} />

            {/* KADİM BİLGİ KARTLARI & REHBERLER */}
            <Text style={styles.sectionHeading}>KADİM KART & REHBER DETAYLARI</Text>

            {/* Tarot Kartları */}
            <Pressable
              onPress={() => handleNavigate('KartAnlamlari', { deck: 'tarot' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
                <MaterialCommunityIcons name="cards-outline" size={20} color="#C084FC" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Tarot Kartları ve Anlamları</Text>
                <Text style={styles.menuItemDesc}>78 kartlık Rider-Waite destesi</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* İskambil Kartları */}
            <Pressable
              onPress={() => handleNavigate('KartAnlamlari', { deck: 'iskambil' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <MaterialCommunityIcons name="cards-playing-outline" size={20} color="#60A5FA" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>İskambil Kartları Dili</Text>
                <Text style={styles.menuItemDesc}>52 kartın kadim fal anlamları</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* Burçların Kökeni ve 4 Element */}
            <Pressable
              onPress={() => handleNavigate('BilgiMakale', { topic: 'burc_kokeni' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <MaterialCommunityIcons name="zodiac-leo" size={20} color="#FBBF24" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Burçların Kökeni & 4 Element</Text>
                <Text style={styles.menuItemDesc}>Zodyak tarihi ve element döngüsü</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* Kahve Falı Tarihi */}
            <Pressable
              onPress={() => handleNavigate('BilgiMakale', { topic: 'kahve_tarihi' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(180, 83, 9, 0.15)' }]}>
                <MaterialCommunityIcons name="coffee-outline" size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Kahve Telvesinin Tarihi</Text>
                <Text style={styles.menuItemDesc}>Osmanlı'dan günümüze fal geleneği</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: 'rgba(22, 12, 42, 0.98)',
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(242, 200, 121, 0.35)',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
    marginBottom: 8,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  drawerContent: {
    paddingVertical: 8,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 24, 70, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    padding: 11,
    gap: 10,
  },
  highlightMenuItem: {
    backgroundColor: 'rgba(48, 20, 58, 0.95)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(58, 36, 106, 0.95)',
    transform: [{ scale: 0.98 }],
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  menuItemDesc: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD_SOFT,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
});
