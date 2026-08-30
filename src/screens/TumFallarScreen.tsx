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
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { EKOLLER_DATA, type EkolData } from '@/constants/ekollerData';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TumFallar'>;

export default function TumFallarScreen({ navigation }: Props) {
  return (
    <MysticTableBackground variant="general">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="earth" size={22} color={GOLD} />
          <Text style={styles.headerTitle}>Tüm Fal Çeşitleri</Text>
        </View>
        <Text style={styles.headerCaption}>
          Dünyanın dört bir yanından kadim kehanet ekolleri vitrini
        </Text>

        {/* 6 Standart Boyutlu Görsel Ekol Vitrin Kartı */}
        <View style={styles.ekolList}>
          {EKOLLER_DATA.map((ekol) => (
            <Pressable
              key={ekol.key}
              onPress={() => navigation.navigate('EkolDetay', { ekolKey: ekol.key })}
              style={({ pressed }) => [
                styles.showcaseCard,
                pressed && styles.showcaseCardPressed,
              ]}
            >
              <ImageBackground
                source={ekol.sectionBg}
                style={styles.showcaseBg}
                imageStyle={styles.showcaseImage}
                resizeMode="cover"
              >
                {/* Mistik Karartma Gradient */}
                <LinearGradient
                  colors={[
                    'rgba(8, 4, 18, 0.45)',
                    'rgba(8, 4, 18, 0.65)',
                    'rgba(8, 4, 18, 0.88)',
                  ]}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Kart İçeriği */}
                <View style={styles.showcaseContent}>
                  {/* Üst Başlık & Çizgi */}
                  <View style={styles.topRow}>
                    <View style={styles.titleWrap}>
                      <View style={[styles.headBar, { backgroundColor: ekol.accent }]} />
                      <Text style={[styles.ekolTitle, { color: ekol.accent }]}>
                        {ekol.title}
                      </Text>
                    </View>
                    <View style={[styles.chevronWrap, { backgroundColor: ekol.accent + '25', borderColor: ekol.accent + '66' }]}>
                      <Ionicons name="chevron-forward" size={18} color={ekol.accent} />
                    </View>
                  </View>

                  {/* Alt Ekol Keşfet Buton Şeridi */}
                  <View style={styles.bottomRow}>
                    <View
                      style={[
                        styles.explorePill,
                        {
                          backgroundColor: ekol.accent + '22',
                          borderColor: ekol.accent + '66',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="cards-playing-outline" size={14} color={ekol.accent} />
                      <Text style={[styles.explorePillText, { color: ekol.accent }]}>
                        {ekol.items.length} Fal Çeşidi · İncele
                      </Text>
                      <Ionicons name="arrow-forward" size={13} color={ekol.accent} />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 48,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  headerCaption: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  ekolList: {
    width: '100%',
    gap: 18,
  },
  showcaseCard: {
    width: '100%',
    height: 235, // %50 artırılmış standart vitrin kartı boyutu
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 7,
  },
  showcaseCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  showcaseBg: {
    width: '100%',
    height: '100%',
  },
  showcaseImage: {
    borderRadius: 22,
  },
  showcaseContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  headBar: {
    width: 38,
    height: 3.5,
    borderRadius: 2,
  },
  ekolTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekolSub: {
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '600',
    lineHeight: 19,
    marginVertical: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  explorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  explorePillText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
