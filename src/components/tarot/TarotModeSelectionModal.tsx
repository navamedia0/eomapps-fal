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
  onSelectRelationshipSpread: () => void;
  onSelectQuickSpread: () => void;
  onSelectDeckTable: () => void;
};

type ModeItem = {
  id: 'relationship' | 'quick' | 'table';
  badge: string;
  isPopular?: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  bullets: string[];
};

const TAROT_MODES: ModeItem[] = [
  // 1. EN POPÜLER VE YILDIZ MOD (EN ÜSTTE)
  {
    id: 'relationship',
    badge: '👑 EN ÇOK TERCİH EDİLEN · 10 KATMANLI SENTEZ',
    isPopular: true,
    title: 'Karşılıklı Uyum Açılımı',
    subtitle: 'İki Kişilik Derin Sentez · 10 Ayrı Kademede Aşk & Kadersel Bağ',
    ctaText: 'Karşılıklı Uyuma Bak',
    iconName: 'heart-multiple',
    accent: GOLD,
    bullets: [
      '✦ Senin ve partnerinin enerjisini karşılıklı masaya yatırır',
      '✦ 10 ayrı kadersel seviyeyi (bilinçaltı, hisler, engeller, gelecek) sentezler',
      '✦ Tüm kartlara tek tek dokunarak detaylı aşk analizini açığa çıkarır',
    ],
  },
  // 2. KLASİK ÇEKİM
  {
    id: 'quick',
    badge: '2. MOD · KLASİK ÇEKİM',
    title: 'Sen Seç, Biz Yorumlayalım',
    subtitle: 'Hızlı Dijital Çekim & Klasik Açılım',
    ctaText: 'Hızlı Açılıma Başla',
    iconName: 'cards-playing',
    accent: '#F59E0B',
    bullets: [
      '✦ 78 kartlık desteden odaklanarak 3, 5 veya 7 kartını çek',
      '✦ Geçmiş, şimdi ve geleceğe dair birleşik kader yorumu al',
      '✦ Günlük rehberlik ve niyetine dair net kehanet',
    ],
  },
  // 3. KEHANET ATÖLYESİ & DİZİLİM ÖĞRENME
  {
    id: 'table',
    badge: '3. MOD · KEHANET ATÖLYESİ',
    title: 'Deste Masası & Masa Dizilimi Öğren',
    subtitle: 'Sembolizm, Ezoterik Anlamlar & Masa Dizilimi',
    ctaText: 'Deste Masasına Geç',
    iconName: 'table-furniture',
    accent: '#A1A1AA',
    bullets: [
      '✦ Gerçek bir fal masasında kartları tek tek çevir ve dizilimi incele',
      '✦ Her bir kartın ezoterik sembollerini ve düz/ters anlamlarını öğren',
      '✦ (Kart yorumlama içermez; sembolizm ve masa dizilimi atölyesidir)',
    ],
  },
];

export default function TarotModeSelectionModal({
  visible,
  onClose,
  onSelectRelationshipSpread,
  onSelectQuickSpread,
  onSelectDeckTable,
}: Props) {
  const handleAction = (id: 'relationship' | 'quick' | 'table') => {
    onClose();
    if (id === 'relationship') onSelectRelationshipSpread();
    else if (id === 'quick') onSelectQuickSpread();
    else if (id === 'table') onSelectDeckTable();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <LinearGradient
            colors={['#181820', '#101014', '#08080A']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Kapatma Butonu */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={TEXT_MUTED} />
          </Pressable>

          {/* Başlık ve Süsleme */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="cards-playing-outline" size={26} color={GOLD} />
            </View>
            <Text style={styles.title}>Klasik Rider-Waite Tarot</Text>
            <Text style={styles.subtitle}>
              78 Kadim Arkana · Açılım ve Deneyim Modunuzu Seçin
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {TAROT_MODES.map((mode) => (
              <View
                key={mode.id}
                style={[
                  styles.modeCard,
                  { borderColor: mode.id === 'relationship' ? GOLD : mode.id === 'quick' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.15)' },
                  mode.isPopular && styles.modeCardPopular,
                ]}
              >
                <LinearGradient
                  colors={
                    mode.isPopular
                      ? ['rgba(229, 169, 60, 0.12)', 'rgba(229, 169, 60, 0.02)']
                      : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']
                  }
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Üst Satır: Rozet & İkon */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: mode.id === 'relationship' ? 'rgba(229, 169, 60, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        borderColor: mode.id === 'relationship' ? GOLD : 'rgba(255, 255, 255, 0.2)',
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: mode.id === 'relationship' ? GOLD : '#E4E4E7' }]}>{mode.badge}</Text>
                  </View>
                  <MaterialCommunityIcons name={mode.iconName} size={22} color={mode.id === 'relationship' ? GOLD : mode.accent} />
                </View>

                <Text style={styles.cardTitle}>{mode.title}</Text>
                <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>

                {/* Öne Çıkan Özellikler (Liste Formatında) */}
                <View style={styles.bulletList}>
                  {mode.bullets.map((b, idx) => (
                    <Text key={idx} style={styles.bulletItem}>
                      {b}
                    </Text>
                  ))}
                </View>

                {/* Eyleme Geçiş Butonu */}
                <Pressable
                  onPress={() => handleAction(mode.id)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    mode.id === 'relationship'
                      ? styles.actionBtnGold
                      : mode.id === 'quick'
                      ? styles.actionBtnAmber
                      : styles.actionBtnDark,
                    pressed && styles.actionBtnPressed,
                  ]}
                >
                  <Text style={[styles.actionBtnText, mode.id === 'table' ? { color: '#FFFFFF' } : { color: '#000000' }]}>
                    {mode.ctaText}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={mode.id === 'table' ? '#FFFFFF' : '#000000'}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 8, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 32,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '94%',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.45)',
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
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 1.2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollList: {
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
  modeCardPopular: {
    borderWidth: 1.5,
    borderColor: GOLD,
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
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#A1A1AA',
    marginBottom: 8,
  },
  bulletList: {
    gap: 3.5,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 11.5,
    color: '#E4E4E7',
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
  actionBtnGold: {
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnAmber: {
    backgroundColor: '#F59E0B',
  },
  actionBtnDark: {
    backgroundColor: 'rgba(30, 30, 38, 0.95)',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.4)',
  },
  actionBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
  },
});
