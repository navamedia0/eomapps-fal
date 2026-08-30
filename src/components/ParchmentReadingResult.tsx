import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageBackground,
  Image,
  Dimensions,
  Modal,
  PanResponder,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShareButton from '@/components/ShareButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export type ReadingSection = {
  title: string;
  body: string;
  cardImage?: ImageSourcePropType;
  cardName?: string;
  cardOrientation?: 'upright' | 'reversed';
  keywords?: string[];
  story?: string;
  posLabel?: string;
};

type Props = {
  visible: boolean;
  badge: string;
  sections: ReadingSection[];
  shareTextPrefix: string;
  parchmentBg: ImageSourcePropType;
  accentColor?: string;
  onHomePress: () => void;
  onNewReadingPress: () => void;
  onSpreadLayoutPress?: () => void;
  spreadLayoutModalContent?: React.ReactNode;
};

export default function ParchmentReadingResult({
  visible,
  badge,
  sections,
  shareTextPrefix,
  parchmentBg,
  accentColor = '#B45309',
  onHomePress,
  onNewReadingPress,
  onSpreadLayoutPress,
  spreadLayoutModalContent,
}: Props) {
  const insets = useSafeAreaInsets();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [spreadModalVisible, setSpreadModalVisible] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ziyaret edilen sayfaları hafızada tut — bir kez yazılan yazı geri dönüldüğünde TEKRAR YAZILMAZ
  const seenSectionsRef = useRef<Set<number>>(new Set());

  const currentSection = sections[sectionIndex] || { title: badge, body: '' };
  const isLast = sectionIndex === sections.length - 1;

  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.96);

  // Typewriter effect — Sadece ilk kez görülen sayfada tek bir kez çalışır
  useEffect(() => {
    if (!visible || !currentSection.body) return;

    if (typingTimer.current) clearInterval(typingTimer.current);

    contentOpacity.value = 0;
    contentScale.value = 0.96;
    contentOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    contentScale.value = withSpring(1, { damping: 14, stiffness: 120 });

    const fullBody = currentSection.body;

    // Eğer bu sayfa daha önce görüldüyse / yazıldıysa TEKRAR YAZMA, doğrudan göster!
    if (seenSectionsRef.current.has(sectionIndex)) {
      setDisplayedText(fullBody);
      setIsTyping(false);
      return;
    }

    // İlk kez gelindiyse listeye ekle ve daktilo ile akıcı yazdır
    seenSectionsRef.current.add(sectionIndex);

    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    const stepSize = Math.max(1, Math.min(2, Math.floor(fullBody.length / 120)));
    typingTimer.current = setInterval(() => {
      charIndex += stepSize;
      if (charIndex >= fullBody.length) {
        setDisplayedText(fullBody);
        setIsTyping(false);
        if (typingTimer.current) clearInterval(typingTimer.current);
      } else {
        setDisplayedText(fullBody.slice(0, charIndex));
      }
    }, 30);

    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, [sectionIndex, visible, currentSection.body, contentOpacity, contentScale]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const handleNext = () => {
    if (isTyping) {
      if (typingTimer.current) clearInterval(typingTimer.current);
      setDisplayedText(currentSection.body);
      setIsTyping(false);
      return;
    }
    if (!isLast) {
      setSectionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (sectionIndex > 0) {
      setSectionIndex((prev) => prev - 1);
    }
  };

  // Kitap sayfası gibi sağa-sola kaydırarak (Swipe) kartları gezme
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 30;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -45) {
            // Sola çekildi -> Sonraki Kart
            if (!isLast) {
              setSectionIndex((prev) => prev + 1);
            }
          } else if (gestureState.dx > 45) {
            // Sağa çekildi -> Önceki Kart
            if (sectionIndex > 0) {
              setSectionIndex((prev) => prev - 1);
            }
          }
        },
      }),
    [isLast, sectionIndex]
  );

  if (!visible) return null;

  const fullReadingText = sections.map((s) => `${s.title}\n${s.body}`).join('\n\n');

  const hasSpreadLayout = Boolean(onSpreadLayoutPress || spreadLayoutModalContent);

  const handleMiddleButtonPress = () => {
    if (onSpreadLayoutPress) {
      onSpreadLayoutPress();
    } else if (spreadLayoutModalContent) {
      setSpreadModalVisible(true);
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Full-Screen Cropped Royal Parchment Background */}
      <ImageBackground
        source={parchmentBg}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }]}>
          {/* Top VIP Navigation Bar */}
          <View style={styles.topBar}>
            <Pressable onPress={onHomePress} style={styles.homeBtn} hitSlop={10}>
              <Ionicons name="home" size={17} color="#451A03" />
              <Text style={styles.homeBtnText}>Ana Sayfa</Text>
            </Pressable>

            {/* Ortadaki Buton: Masadaki Dizilimi Gör (veya Standart Badge) */}
            {hasSpreadLayout ? (
              <Pressable
                onPress={handleMiddleButtonPress}
                style={styles.spreadLayoutBtn}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="cards-playing-outline" size={15} color="#451A03" />
                <Text style={styles.spreadLayoutBtnText} numberOfLines={1}>
                  Masadaki Dizilimi Gör
                </Text>
                <Ionicons name="chevron-forward" size={13} color="#451A03" />
              </Pressable>
            ) : (
              <View style={styles.badgePill}>
                <MaterialCommunityIcons name="feather" size={13} color="#92400E" />
                <Text style={styles.badgePillText} numberOfLines={1} ellipsizeMode="tail">
                  {badge}
                </Text>
              </View>
            )}

            <Pressable onPress={onNewReadingPress} style={styles.newReadingBtn} hitSlop={10}>
              <Ionicons name="refresh" size={16} color="#451A03" />
              <Text style={styles.newReadingBtnText}>Yeni Fal</Text>
            </Pressable>
          </View>

          {/* Section Indicator Dots (Kitap Sayfası Takibi) */}
          {sections.length > 1 && (
            <View style={styles.dotsRow}>
              {sections.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSectionIndex(i)}
                  hitSlop={8}
                  style={[
                    styles.dot,
                    i === sectionIndex && styles.dotActive,
                    i === sectionIndex && { backgroundColor: accentColor, width: 22 },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Main Parchment Reading Content (Kitap Sayfası Gibi Sağa Sola Kaydırılabilir) */}
          <Animated.View
            style={[styles.parchmentContentWrap, animatedContentStyle]}
            {...panResponder.panHandlers}
          >
            <ScrollView
              contentContainerStyle={styles.parchmentScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Ornate Section Title */}
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionTitle}>{currentSection.title}</Text>
                <View style={[styles.titleUnderline, { backgroundColor: accentColor }]} />
              </View>

              {/* 🎴 KART GÖRSELİ VE KAVRAMSAL KUTULARI */}
              {currentSection.cardImage && (
                <View style={styles.cardShowcaseCard}>
                  {/* Sol: Kartın Orijinal Resmi */}
                  <View
                    style={[
                      styles.cardImageFrame,
                      currentSection.cardOrientation === 'reversed' && { transform: [{ rotate: '180deg' }] },
                    ]}
                  >
                    <Image
                      source={currentSection.cardImage}
                      style={styles.cardImageReal}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Sağ: Kart Bilgisi, Yön ve Kavramlar */}
                  <View style={styles.cardMetaWrap}>
                    {/* Kartın Yönü */}
                    <View
                      style={[
                        styles.orientationBadge,
                        {
                          backgroundColor:
                            currentSection.cardOrientation === 'reversed'
                              ? 'rgba(185, 28, 28, 0.12)'
                              : 'rgba(5, 150, 105, 0.12)',
                          borderColor:
                            currentSection.cardOrientation === 'reversed' ? '#DC2626' : '#059669',
                        },
                      ]}
                    >
                      <Ionicons
                        name={currentSection.cardOrientation === 'reversed' ? 'flash' : 'sparkles'}
                        size={12}
                        color={currentSection.cardOrientation === 'reversed' ? '#DC2626' : '#059669'}
                      />
                      <Text
                        style={[
                          styles.orientationText,
                          {
                            color:
                              currentSection.cardOrientation === 'reversed' ? '#991B1B' : '#065F46',
                          },
                        ]}
                      >
                        {currentSection.cardOrientation === 'reversed' ? 'Ters Açıldı' : 'Düz Açıldı'}
                      </Text>
                    </View>

                    {/* Kavramsal Etiketler (Güç - Sevgi - Uyanış vb.) */}
                    {currentSection.keywords && currentSection.keywords.length > 0 && (
                      <View style={styles.parchmentKeywordsRow}>
                        {currentSection.keywords.map((kw, i) => (
                          <View key={i} style={styles.parchmentKeywordChip}>
                            <Text style={styles.parchmentKeywordText}>{kw}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Kartın Hikayesi Butonu */}
                    {currentSection.story && (
                      <Pressable
                        onPress={() => setStoryModalVisible(true)}
                        style={styles.cardStoryBtn}
                        hitSlop={6}
                      >
                        <Ionicons name="book-outline" size={13} color="#78350F" />
                        <Text style={styles.cardStoryBtnText}>Kartın Hikayesi</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Ayırıcı Mistik Çizgi */}
              {currentSection.cardImage && <View style={styles.parchmentDivider} />}

              {/* Ink-on-Parchment Body Text */}
              <Text style={styles.parchmentBody}>
                {displayedText}
                {isTyping && <Text style={{ color: accentColor }}> ✒️</Text>}
              </Text>
            </ScrollView>
          </Animated.View>

          {/* Bottom Action Footer with Swipe Guidance & Buttons */}
          <View style={styles.bottomBar}>
            {/* Back / Share Button */}
            {sectionIndex > 0 ? (
              <Pressable onPress={handlePrev} style={styles.prevBtn}>
                <Ionicons name="chevron-back" size={18} color="#451A03" />
                <Text style={styles.prevBtnText}>Önceki</Text>
              </Pressable>
            ) : (
              <View style={styles.shareWrap}>
                <ShareButton
                  text={`${shareTextPrefix}\n\n${currentSection.title}\n${currentSection.body}`}
                  label="Bu Kartı Paylaş"
                  variant="parchment"
                />
              </View>
            )}

            {/* Next / Full Share Button */}
            {!isLast ? (
              <Pressable
                onPress={handleNext}
                style={[styles.primaryActionBtn, { backgroundColor: accentColor }]}
              >
                <Text style={styles.primaryActionBtnText}>
                  {isTyping ? 'Tamamını Gör' : 'Devamını Gör'}
                </Text>
                <Ionicons
                  name={isTyping ? 'flash' : 'chevron-forward'}
                  size={17}
                  color="#FFFBEB"
                />
              </Pressable>
            ) : (
              <View style={styles.shareAllWrap}>
                <ShareButton
                  text={`${shareTextPrefix}\n\n${fullReadingText}`}
                  label="Tümünü Paylaş"
                  variant="parchment"
                />
              </View>
            )}
          </View>
        </View>
      </ImageBackground>

      {/* Kart Hikayesi Pop-up Modalı */}
      {storyModalVisible && currentSection.story && (
        <Modal
          visible={storyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStoryModalVisible(false)}
        >
          <View style={styles.storyModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setStoryModalVisible(false)}
            />
            <View style={styles.storyModalCard}>
              <View style={styles.storyModalHeader}>
                <Ionicons name="book" size={18} color="#B45309" />
                <Text style={styles.storyModalTitle}>
                  {currentSection.cardName || 'Kart Hikayesi'}
                </Text>
                <Pressable
                  onPress={() => setStoryModalVisible(false)}
                  style={styles.storyModalClose}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#78350F" />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.storyModalBody}>
                <Text style={styles.storyModalText}>{currentSection.story}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Masadaki Dizilimi Gör Pop-up Modalı (Yapay Zeka Fal Sonucu İçin) */}
      {spreadModalVisible && spreadLayoutModalContent && (
        <Modal
          visible={spreadModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSpreadModalVisible(false)}
        >
          <View style={styles.storyModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setSpreadModalVisible(false)}
            />
            <View style={styles.spreadModalCard}>
              <View style={styles.storyModalHeader}>
                <MaterialCommunityIcons name="cards-playing" size={20} color="#B45309" />
                <Text style={styles.storyModalTitle}>Masadaki Kart Dizilimi</Text>
                <Pressable
                  onPress={() => setSpreadModalVisible(false)}
                  style={styles.storyModalClose}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#78350F" />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.storyModalBody}>
                {spreadLayoutModalContent}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexShrink: 0,
  },
  homeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#451A03',
  },
  spreadLayoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 0,
  },
  spreadLayoutBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#451A03',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  badgePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#B45309',
    minWidth: 0,
    overflow: 'hidden',
  },
  badgePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  newReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexShrink: 0,
  },
  newReadingBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#451A03',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B45309',
    opacity: 0.35,
  },
  dotActive: {
    opacity: 1,
    height: 6,
    borderRadius: 3,
  },
  parchmentContentWrap: {
    flex: 1,
    marginHorizontal: 14,
    marginVertical: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 251, 235, 0.45)',
    borderRadius: 24,
  },
  parchmentScroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  sectionHeaderWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#291402',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 24,
  },
  titleUnderline: {
    width: 52,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },

  // Kart Görseli ve Kavramsal Alanı
  cardShowcaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 243, 199, 0.65)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D97706',
    padding: 10,
    gap: 12,
    marginBottom: 14,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageFrame: {
    width: 72,
    height: 114,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#B45309',
    overflow: 'hidden',
    backgroundColor: '#FFFBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardImageReal: {
    width: '100%',
    height: '100%',
  },
  cardMetaWrap: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  orientationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  orientationText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  parchmentKeywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  parchmentKeywordChip: {
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120, 53, 15, 0.25)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  parchmentKeywordText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#451A03',
  },
  cardStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginTop: 2,
  },
  cardStoryBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#78350F',
  },
  parchmentDivider: {
    height: 1,
    backgroundColor: 'rgba(180, 83, 9, 0.25)',
    marginBottom: 14,
    width: '100%',
  },

  parchmentBody: {
    fontSize: 15,
    color: '#1C0D02',
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'justify',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  prevBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#451A03',
  },
  shareWrap: {
    flex: 1,
  },
  shareAllWrap: {
    flex: 1,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryActionBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFBEB',
    letterSpacing: 0.4,
  },

  // Story Modal
  storyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 20, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  storyModalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#FEF3C7',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#B45309',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  spreadModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#1E1238',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D97706',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  storyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 83, 9, 0.25)',
    paddingBottom: 10,
  },
  storyModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#451A03',
  },
  storyModalClose: {
    padding: 2,
  },
  storyModalBody: {
    maxHeight: 400,
  },
  storyModalText: {
    fontSize: 13.5,
    color: '#291402',
    lineHeight: 21,
    fontStyle: 'italic',
  },
});
