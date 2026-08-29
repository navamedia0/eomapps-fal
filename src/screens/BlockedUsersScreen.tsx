import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getBlockedUsers, unblockUser, type BlockedUser } from '@/services/socialProfile';
import { avatarColor } from '@/utils/avatarColor';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getBlockedUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleUnblock = useCallback(
    (user: BlockedUser) => {
      showAlert('Engeli kaldır', `${user.displayName || 'Bu kullanıcının'} engelini kaldırmak istediğine emin misin?`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Engeli Kaldır',
          onPress: async () => {
            try {
              await unblockUser(user.id);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (err) {
              showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
            }
          },
        },
      ]);
    },
    [],
  );

  return (
    <MysticTableBackground>
      {loading ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Engellediğin kimse yok.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor(item.id) }]}>
                  <Text style={styles.avatarFallbackText}>{(item.displayName || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName || 'Mistik Rehber Kullanıcısı'}
              </Text>
              <Pressable onPress={() => handleUnblock(item)} style={styles.unblockButton}>
                <Ionicons name="lock-open-outline" size={15} color={GOLD} />
                <Text style={styles.unblockText}>Engeli Kaldır</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 12, flexGrow: 1 },
  emptyText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  name: { flex: 1, fontSize: 13.5, fontWeight: '700', color: TEXT_PRIMARY },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  unblockText: { fontSize: 11.5, fontWeight: '700', color: GOLD },
});
