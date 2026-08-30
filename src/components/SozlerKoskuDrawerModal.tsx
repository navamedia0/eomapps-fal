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
            {/* 1. SÖZLER KÖŞKÜ */}
            <Pressable
              onPress={() => handleNavigate('SozlerKosku')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(242, 200, 121, 0.18)' }]}>
                <MaterialCommunityIcons name="feather" size={22} color={GOLD} />
              </View>
              <Text style={styles.menuItemTitle}>Sözler Köşkü</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </Pressable>

            {/* 2. BİLGİ KÖŞESİ */}
            <Pressable
              onPress={() => handleNavigate('BilgiKosesi')}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(147, 51, 234, 0.18)' }]}>
                <Ionicons name="library-outline" size={22} color="#C084FC" />
              </View>
              <Text style={styles.menuItemTitle}>Bilgi Köşesi</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </Pressable>

            {/* 3. HAFTANIN EN SEVİLENLERİ */}
            <Pressable
              onPress={() => handleNavigate('HaftaninSevilenleri')}
              style={({ pressed }) => [styles.menuItem, styles.highlightMenuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="flame" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.menuItemTitle, { color: '#FCA5A5' }]}>Haftanın En Sevilenleri</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </Pressable>

            <View style={styles.divider} />

            {/* KADİM BİLGİ KARTLARI & REHBERLER */}
            <Text style={styles.sectionHeading}>KADİM KART & REHBERLER</Text>

            {/* Tarot Kartları */}
            <Pressable
              onPress={() => handleNavigate('KartAnlamlari', { deck: 'tarot' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(147, 51, 234, 0.18)' }]}>
                <MaterialCommunityIcons name="cards-outline" size={22} color="#C084FC" />
              </View>
              <Text style={styles.menuItemTitle}>Tarot Kartları ve Anlamları</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </Pressable>

            {/* İskambil Kartları */}
            <Pressable
              onPress={() => handleNavigate('KartAnlamlari', { deck: 'iskambil' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
                <MaterialCommunityIcons name="cards-playing-outline" size={22} color="#60A5FA" />
              </View>
              <Text style={styles.menuItemTitle}>İskambil Kartları Dili</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </Pressable>

            {/* Burçların Kökeni ve 4 Element */}
            <Pressable
              onPress={() => handleNavigate('BilgiMakale', { topic: 'burc_kokeni' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.18)' }]}>
                <MaterialCommunityIcons name="zodiac-leo" size={22} color="#FBBF24" />
              </View>
              <Text style={styles.menuItemTitle}>Burçların Kökeni & 4 Element</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </Pressable>

            {/* Kahve Falı Tarihi */}
            <Pressable
              onPress={() => handleNavigate('BilgiMakale', { topic: 'kahve_tarihi' })}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(180, 83, 9, 0.18)' }]}>
                <MaterialCommunityIcons name="coffee-outline" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.menuItemTitle}>Kahve Telvesinin Tarihi</Text>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
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
    fontSize: 17,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.4,
  },
  closeBtn: {
    padding: 4,
  },
  drawerContent: {
    paddingVertical: 8,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 24, 70, 0.88)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.22)',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '900',
    color: GOLD_SOFT,
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 2,
  },
});
