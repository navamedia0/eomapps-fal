import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import { EKOLLER_DATA, type EkolData } from '@/constants/ekollerData';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'EkolDetay'>;

export default function EkolDetayScreen({ route, navigation }: Props) {
  const { ekolKey } = route.params;
  const ekol = EKOLLER_DATA.find((e) => e.key === ekolKey) || EKOLLER_DATA[0];

  return (
    <View style={styles.container}>
      <ImageBackground
        source={ekol.sectionBg}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(8, 4, 18, 0.65)', 'rgba(8, 4, 18, 0.85)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color={GOLD} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <View style={[styles.headBar, { backgroundColor: ekol.accent }]} />
              <Text style={[styles.headerTitle, { color: ekol.accent }]}>
                {ekol.title}
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Fal Listesi — Her Satırda Ortalı 1 Tane */}
          <View style={styles.listContainer}>
            {ekol.items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  navigation.navigate(item.route as any, item.params);
                }}
                style={({ pressed }) => [
                  styles.fortuneCard,
                  { borderColor: ekol.accent + '77' },
                  pressed && styles.fortuneCardPressed,
                ]}
              >
                {/* 3D PNG Feature Icon */}
                <View style={styles.iconWrap}>
                  <FeatureIcon
                    source={FEATURE_ICONS[item.key]}
                    fallback={<MaterialCommunityIcons name="cards-playing-outline" size={28} color={GOLD} />}
                    size={56}
                  />
                </View>

                {/* Başlık ve Açıklama */}
                <View style={styles.textWrap}>
                  <Text style={styles.fortuneTitle}>{item.title}</Text>
                  <Text style={styles.fortuneSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </View>

                {/* Aksiyon İkonu */}
                <View
                  style={[
                    styles.actionPill,
                    { backgroundColor: ekol.accent + '22', borderColor: ekol.accent + '66' },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={18} color={ekol.accent} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0614',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headBar: {
    width: 40,
    height: 3.5,
    borderRadius: 2,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  listContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 14,
  },
  fortuneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 12, 42, 0.76)',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  fortuneCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(34, 18, 64, 0.9)',
  },
  iconWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  fortuneTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  fortuneSubtitle: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
