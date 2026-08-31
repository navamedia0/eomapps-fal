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
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
};

type TestItem = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  accent: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  badgeText: string;
};

const PSYCHOLOGY_TESTS: TestItem[] = [
  {
    id: 'attachment_style',
    title: 'Aşk & Bağlanma Stili Testi',
    subtitle: 'Güvenli mi, Kaygılı mı, Kaçıngan mısın? İlişki bilinçaltın',
    tags: ['İlişki Dinamiği', 'Bağlanma Kodu', 'Aşk Bilinçaltı'],
    accent: '#EC4899',
    iconName: 'heart-pulse',
    badgeText: '🔥 En Çok Çözülen',
  },
  {
    id: 'mbti_archetype',
    title: '16 Kişilik & Gölge Arketip Testi',
    subtitle: 'Carl Jung arketipleriyle maskenin ardındaki gerçek benliğin',
    tags: ['16 Kişilik', 'Gölge Benlik', 'Jung Arketipleri'],
    accent: '#A855F7',
    iconName: 'account-group-outline',
    badgeText: '🧠 Derin Analiz',
  },
  {
    id: 'soul_age',
    title: 'Ruh Yaşı & Zihinsel Olgunluk',
    subtitle: 'Biyolojik yaşınla ruhsal olgunluğun arasındaki gerçek fark',
    tags: ['Ruh Yaşı', 'Zihinsel Olgunluk', 'Karmik Seviye'],
    accent: '#F59E0B',
    iconName: 'timer-sand',
    badgeText: '⏳ Popüler',
  },
  {
    id: 'eq_resilience',
    title: 'Duygusal Zeka (EQ) & Stres Haritası',
    subtitle: 'Baskı altında karar alma gücün ve duygusal dayanıklılığın',
    tags: ['Duygusal Zeka', 'Stres Yönetimi', 'Empati Puanı'],
    accent: '#06B6D4',
    iconName: 'chart-bell-curve-cumulative',
    badgeText: '📊 Kapsamlı Rapor',
  },
  {
    id: 'chakra_blockage',
    title: 'Çakra Blokaj & Enerji Tıkanıklığı Testi',
    subtitle: 'Hangi çakran kapalı? Beden ve zihin enerji akışını tespit et',
    tags: ['7 Çakra', 'Enerji Blokajı', 'Ruhsal Denge'],
    accent: '#10B981',
    iconName: 'meditation',
    badgeText: '✨ Şifa & Denge',
  },
];

export default function PsychologyTestsModal({ visible, onClose, navigation }: Props) {
  const handleTestPress = (test: TestItem) => {
    onClose();
    if (test.id === 'chakra_blockage') {
      navigation.navigate('AuraEnergy');
    } else {
      navigation.navigate('Tasks');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.container}>
          <LinearGradient
            colors={['#1E1035', '#120824', '#080314']}
            style={StyleSheet.absoluteFillObject}
          />

          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={TEXT_MUTED} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="brain" size={26} color="#A855F7" />
            </View>
            <Text style={styles.title}>Psikolojik & Kişilik Testleri</Text>
            <Text style={styles.subtitle}>
              Bilinçaltının derinliklerine inin, gerçek potansiyelinizi ve ilişkinizi keşfedin
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {PSYCHOLOGY_TESTS.map((test) => (
              <Pressable
                key={test.id}
                onPress={() => handleTestPress(test)}
                style={({ pressed }) => [
                  styles.testCard,
                  { borderColor: test.accent + '44' },
                  pressed && styles.testCardPressed,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.testIcon, { backgroundColor: test.accent + '22', borderColor: test.accent + '66' }]}>
                    <MaterialCommunityIcons name={test.iconName} size={20} color={test.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.testTitle, { color: test.accent }]}>{test.title}</Text>
                    <Text style={styles.testSub}>{test.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.tagWrap}>
                    {test.tags.map((t, i) => (
                      <View key={i} style={[styles.tag, { borderColor: test.accent + '33' }]}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.startPill, { backgroundColor: test.accent + '25', borderColor: test.accent + '77' }]}>
                    <Text style={[styles.startText, { color: test.accent }]}>Teste Başla</Text>
                    <Ionicons name="arrow-forward" size={12} color={test.accent} />
                  </View>
                </View>
              </Pressable>
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
    backgroundColor: 'rgba(4, 2, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 28,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 138, 0, 0.4)',
    overflow: 'hidden',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255, 138, 0, 0.15)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 138, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  list: {
    gap: 10,
    paddingBottom: 10,
  },
  testCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 12,
    backgroundColor: 'rgba(15, 8, 30, 0.8)',
    gap: 10,
  },
  testCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  testIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  testSub: {
    fontSize: 11.5,
    color: '#CBD5E1',
    marginTop: 2,
    lineHeight: 15,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    backgroundColor: 'rgba(10, 5, 20, 0.7)',
  },
  tagText: {
    fontSize: 9.5,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  startPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 0.8,
  },
  startText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
