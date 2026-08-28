import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import {
  getWallet,
  getShopItems,
  purchaseItem,
  getInventory,
  type ShopCategory,
  type ShopItem,
  type InventoryItem,
  type WalletBalances,
} from '@/services/shop';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const TABS: { key: ShopCategory | 'inventory'; label: string }[] = [
  { key: 'frame', label: 'Çerçeveler' },
  { key: 'badge', label: 'Rozetler' },
  { key: 'entrance_effect', label: 'Giriş Efektleri' },
  { key: 'inventory', label: 'Envanterim' },
];

const CURRENCY_LABEL: Record<'coin' | 'crystal', string> = { coin: 'Coin', crystal: 'Kristal' };

export default function ShopScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('frame');
  const [wallet, setWallet] = useState<WalletBalances | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const load = useCallback((currentTab: typeof tab) => {
    setLoading(true);
    getWallet()
      .then(setWallet)
      .catch(() => setWallet(null));
    if (currentTab === 'inventory') {
      getInventory()
        .then(setInventory)
        .catch(() => setInventory([]))
        .finally(() => setLoading(false));
    } else {
      getShopItems(currentTab)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(tab);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]),
  );

  const handlePurchase = useCallback(
    async (item: ShopItem) => {
      setPurchasingId(item.id);
      try {
        await purchaseItem(item.id);
        Alert.alert('Alındı', `${item.name} artık senin!`);
        load(tab);
      } catch (err) {
        Alert.alert('Satın alınamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setPurchasingId(null);
      }
    },
    [tab, load],
  );

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.walletRow}>
          <View style={styles.walletPill}>
            <Ionicons name="disc-outline" size={14} color={GOLD} />
            <Text style={styles.walletText}>{wallet ? wallet.coin : '—'} Coin</Text>
          </View>
          <View style={styles.walletPill}>
            <Ionicons name="diamond-outline" size={14} color={GOLD} />
            <Text style={styles.walletText}>{wallet ? wallet.crystal : '—'} Kristal</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabButton, tab === t.key && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, tab === t.key && styles.tabButtonTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} />
        ) : tab === 'inventory' ? (
          <View style={styles.list}>
            {inventory.length === 0 ? (
              <Text style={styles.emptyText}>Henüz hiçbir şey satın almadın.</Text>
            ) : (
              inventory.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!!item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={GOLD} />
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {items.length === 0 ? (
              <Text style={styles.emptyText}>Bu kategoride henüz ürün yok.</Text>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!!item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                    <Text style={styles.itemPrice}>
                      {item.price} {CURRENCY_LABEL[item.currency]}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handlePurchase(item)}
                    disabled={item.owned || purchasingId === item.id}
                    style={[styles.buyButton, item.owned && styles.buyButtonOwned]}
                  >
                    {purchasingId === item.id ? (
                      <ActivityIndicator size="small" color="#1a0d33" />
                    ) : (
                      <Text style={[styles.buyButtonText, item.owned && styles.buyButtonTextOwned]}>
                        {item.owned ? 'Sahipsin' : 'Satın Al'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  walletRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  walletText: { fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tabButton: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  tabButtonActive: { backgroundColor: GOLD, borderColor: GOLD },
  tabButtonText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  tabButtonTextActive: { color: '#1a0d33' },
  list: { gap: 10 },
  emptyText: { fontSize: 12.5, color: TEXT_MUTED, textAlign: 'center', paddingVertical: 20 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
  },
  itemTextWrap: { flex: 1 },
  itemName: { fontSize: 13.5, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 3 },
  itemDesc: { fontSize: 11.5, lineHeight: 16, color: TEXT_MUTED, marginBottom: 4 },
  itemPrice: { fontSize: 12, fontWeight: '700', color: GOLD },
  buyButton: { backgroundColor: GOLD, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  buyButtonOwned: { backgroundColor: 'transparent', borderWidth: 1, borderColor: GOLD_SOFT },
  buyButtonText: { fontSize: 12, fontWeight: '800', color: '#1a0d33' },
  buyButtonTextOwned: { color: TEXT_MUTED },
});
