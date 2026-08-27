import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { getFavorites, removeFavorite, type FavoriteEntry } from '@/services/favorites';
import ConfirmModal from '@/components/ConfirmModal';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const CATEGORY_LABEL: Record<string, string> = {
  burc: 'BURÇLAR',
  kart: 'KARTLAR',
  astroloji: 'ASTROLOJİ',
  tarot: 'TAROT',
};

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then((entries) => {
        setFavorites(entries);
        setLoaded(true);
      });
    }, []),
  );

  const confirmRemove = async () => {
    if (!pendingRemoveId) return;
    const id = pendingRemoveId;
    setPendingRemoveId(null);
    setFavorites((prev) => prev.filter((entry) => entry.id !== id));
    await removeFavorite(id);
  };

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loaded && favorites.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="star-outline" size={36} color={GOLD_SOFT} />
            <Text style={styles.emptyTitle}>Henüz favorin yok</Text>
            <Text style={styles.emptyText}>
              Keşfet ve Bilgi Köşesi'ndeki sözlerin ve bilgi kartlarının sağ üst köşesindeki yıldıza dokunarak buraya kaydedebilirsin.
            </Text>
          </View>
        )}

        <View style={styles.list}>
          {favorites.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {entry.kind === 'info' ? (
                  <>
                    <MaterialCommunityIcons name="star-crescent" size={14} color={GOLD} />
                    <Text style={styles.cardCategory}>
                      {entry.category ? CATEGORY_LABEL[entry.category] ?? entry.category.toUpperCase() : 'BİLGİ'}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="format-quote-close" size={14} color={GOLD} />
                    <Text style={styles.cardCategory}>SÖZ</Text>
                  </>
                )}
                <Pressable onPress={() => setPendingRemoveId(entry.id)} hitSlop={10} style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={16} color={TEXT_MUTED} />
                </Pressable>
              </View>
              {entry.title && <Text style={styles.cardTitle}>{entry.title}</Text>}
              <Text style={styles.cardBody}>{entry.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={pendingRemoveId !== null}
        title="Favorilerden kaldırmak istediğine emin misin?"
        message="Bu kayıt favorilerinden kalıcı olarak silinecek."
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoveId(null)}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  emptyText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardCategory: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
  removeButton: {
    padding: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_MUTED,
  },
});
