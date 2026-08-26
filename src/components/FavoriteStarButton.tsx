import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { addFavorite, isFavorited, removeFavorite, type FavoriteKind } from '@/services/favorites';
import { reportFavorite } from '@/services/popularFavorites';
import { GOLD } from '@/theme/colors';

type Props = {
  id: string;
  kind: FavoriteKind;
  body: string;
  title?: string;
  category?: string;
  size?: number;
};

// Top-right "save to favorites" star, reused on Keşfet quote cards and
// Bilgi Köşesi fact cards. Purely local (AsyncStorage) — favorites live on
// device, same as reading history.
export default function FavoriteStarButton({ id, kind, body, title, category, size = 18 }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    isFavorited(id).then(setSaved);
  }, [id]);

  const toggle = async () => {
    const next = !saved;
    setSaved(next);
    if (next) {
      await addFavorite({ id, kind, body, title, category });
      reportFavorite({ id, kind, body, title, category });
    } else {
      await removeFavorite(id);
    }
  };

  return (
    <Pressable onPress={toggle} hitSlop={10} style={styles.button}>
      <Ionicons name={saved ? 'star' : 'star-outline'} size={size} color={GOLD} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});
