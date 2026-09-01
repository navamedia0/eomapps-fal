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
import { GOLD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 320);

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

        {/* Slide-in Drawer Container (OLED Saf Siyah Zemin) */}
        <View style={[styles.drawer, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleRow}>
              <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
              <Text style={styles.drawerTitle}>Mistik Menü</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color={GOLD} />
            </Pressable>
          </View>
          <Text style={styles.drawerSubtitle}>Kadim Bilgiler & Mistik Rehberler</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>
            {/* BÖLÜM 1: MİSTİK KÖŞKLER */}
            <Text style={styles.sectionHeading}>MİSTİK KÖŞKLER</Text>

            {/* 1. SÖZLER KÖŞKÜ */}
            <Pressable
              onPress={() => handleNavigate('SozlerKosku')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="feather" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Sözler Köşkü</Text>
                <Text style={styles.menuItemSub}>Günün mistik sözleri & ilham</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* 2. BİLGİ KÖŞESİ */}
            <Pressable
              onPress={() => handleNavigate('BilgiKosesi')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="library-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Bilgi Köşesi</Text>
                <Text style={styles.menuItemSub}>Ezoterik makaleler ve sırlar</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* 3. HAFTANIN EN SEVİLENLERİ */}
            <Pressable
              onPress={() => handleNavigate('HaftaninSevilenleri')}
              style={({ pressed }) => [styles.menuItem, styles.highlightMenuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(255, 201, 60, 0.18)' }]}>
                <Ionicons name="flame" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuItemTitle, { color: GOLD }]}>Haftanın En Sevilenleri</Text>
                <Text style={styles.menuItemSub}>En popüler sözler & paylaşımlar</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            <View style={styles.divider} />

            {/* BÖLÜM 2: KADİM BİLGİ KARTLARI & REHBERLER */}
            <Text style={styles.sectionHeading}>KADİM KARTLAR & REHBERLER</Text>

            {/* Tarot Kartları */}
            <Pressable
              onPress={() => handleNavigate('KartAnlamlari', { deck: 'tarot' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="cards-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Tarot Kartları</Text>
                <Text style={styles.menuItemSub}>78 kartın detaylı rehberi</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* İskambil Kartları */}
            <Pressable
              onPress={() => handleNavigate('KartAnlamlari', { deck: 'iskambil' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="cards-playing-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>İskambil Kartları</Text>
                <Text style={styles.menuItemSub}>52 kart ve hanedan anlamları</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* Burçların Kökeni ve 4 Element */}
            <Pressable
              onPress={() => handleNavigate('BilgiMakale', { topic: 'burc_kokeni' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="zodiac-leo" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Burçlar & 4 Element</Text>
                <Text style={styles.menuItemSub}>Ateş, Toprak, Hava, Su</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </Pressable>

            {/* Kahve Falı Tarihi */}
            <Pressable
              onPress={() => handleNavigate('BilgiMakale', { topic: 'kahve_tarihi' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="coffee-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemTitle}>Kahve Falı Tarihi</Text>
                <Text style={styles.menuItemSub}>Osmanlı'dan günümüze telve</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  drawerSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    paddingVertical: 4,
    gap: 9,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  highlightMenuItem: {
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    borderColor: 'rgba(255, 201, 60, 0.4)',
  },
  menuItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  menuItemSub: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
});
