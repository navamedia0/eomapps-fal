import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { PopularFavorite } from '@/services/popularFavorites';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const QUOTE_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = {
  item: PopularFavorite | null;
  onClose: () => void;
};

export default function PopularDetailModal({ item, onClose }: Props) {
  if (!item) return null;

  const shareContent = item.title ? `${item.title}\n\n${item.body}` : item.body;

  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.cardWrap} onPress={(e) => e.stopPropagation()}>
          {/* Keşfet ekranındaki kartla birebir aynı sisli, yıldızlı kozmik arkaplan */}
          <ImageBackground
            source={QUOTE_CARD_BG}
            style={styles.cardBg}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(8, 7, 8, 0.48)', 'rgba(8, 7, 8, 0.72)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Kapat Butonu */}
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </Pressable>

            {/* Favori Yıldızı */}
            <View style={styles.favBtnWrap}>
              <FavoriteStarButton
                id={item.id}
                kind={item.kind}
                title={item.title}
                body={item.body}
                category={item.category}
                size={22}
              />
            </View>

            {/* Üst Ay-Yıldız Simgesi */}
            <View style={styles.headerIconWrap}>
              <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
            </View>

            {/* Başlık (varsa) */}
            {item.title ? <Text style={styles.title}>{item.title}</Text> : null}

            {/* İçerik Metni */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyContent}
            >
              <Text style={[styles.body, !item.title && styles.bodyCenter]}>{item.body}</Text>
            </ScrollView>

            {/* Alt Kısım: Paylaş, Görsel Paylaş & Beğeni Sayısı */}
            <View style={styles.footer}>
              <View style={styles.actionsRow}>
                <ShareButton text={shareContent} />
                <ShareImageButton text={item.body} />
              </View>

              <View style={styles.countWrap}>
                <Ionicons name="star" size={13} color={GOLD} />
                <Text style={styles.countText}>{item.count} kişi favoriledi</Text>
              </View>
            </View>
          </ImageBackground>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 4, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  cardBg: {
    padding: 22,
    position: 'relative',
  },
  cardImageStyle: {
    borderRadius: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 20,
    padding: 6,
  },
  favBtnWrap: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 20,
  },
  headerIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 23,
    paddingHorizontal: 20,
  },
  bodyScroll: {
    maxHeight: 280,
  },
  bodyContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  body: {
    fontSize: 15.5,
    lineHeight: 24,
    color: TEXT_PRIMARY,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  bodyCenter: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 25,
    paddingVertical: 10,
  },
  footer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 201, 60, 0.18)',
    alignItems: 'center',
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  countWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD_SOFT,
  },
});
