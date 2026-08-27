import { ScrollView, StyleSheet, View, Text, Pressable, type ImageSourcePropType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import type { TarotCardDef, TarotOrientation } from '@/services/tarot';
import { GOLD_SOFT, TEXT_MUTED } from '@/theme/colors';

type Selection = { id: string; orientation: TarotOrientation };

type Props = {
  deck: TarotCardDef[];
  selected: Selection[];
  isFull: boolean;
  customBack: ImageSourcePropType | null;
  onToggle: (card: TarotCardDef) => void;
};

const FAN_CARD_WIDTH = 64;
const OVERLAP_FAN = 34;
const WAVE_PERIOD_CARDS = 12;
const FREQUENCY = (2 * Math.PI) / WAVE_PERIOD_CARDS;
const MAX_ANGLE = 26;
const MAX_RISE = 20;

const SELECTED_CARD_WIDTH = 50;
const SELECTED_CARD_HEIGHT = SELECTED_CARD_WIDTH / 0.6;

function getFanOverlap(count: number): number {
  if (count <= 1) return 0;
  if (count <= 3) return 16;
  if (count <= 5) return 22;
  if (count <= 7) return 26;
  return 30; // 8-10 cards
}

export default function TarotFanLayout({ deck, selected, isFull, customBack, onToggle }: Props) {
  const overlap = getFanOverlap(selected.length);

  return (
    <View style={styles.container}>
      {/* Üst Kısım: Seçilen Kartlar Alanı (Üst Üste Binen Deste Düzeni) */}
      <View style={styles.selectedShelf}>
        {selected.length === 0 ? (
          <View style={styles.shelfEmptyBox}>
            <MaterialCommunityIcons name="star-crescent" size={18} color={GOLD_SOFT} />
            <Text style={styles.shelfEmptyText}>Aşağıdaki desteden kartlarını seç</Text>
          </View>
        ) : (
          <View style={styles.shelfActiveWrap}>
            <View style={styles.shelfCardsRow}>
              {selected.map((entry, idx) => {
                const cardDef = deck.find((c) => c.id === entry.id);
                if (!cardDef) return null;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => onToggle(cardDef)}
                    style={[
                      styles.shelfCardPressable,
                      {
                        marginLeft: idx === 0 ? 0 : -overlap,
                        zIndex: idx + 1,
                      },
                    ]}
                    hitSlop={6}
                  >
                    <View style={styles.shelfCardThumb}>
                      <TarotCardBack
                        selected
                        positionLabel={idx + 1}
                        customImage={customBack}
                        onPress={() => onToggle(cardDef)}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.shelfSubText}>Geri koymak için dokun</Text>
          </View>
        )}
      </View>

      {/* Alt Kısım: Deste Dalgası (Fan Ribbon) */}
      <View style={styles.fanWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fanContent}
        >
          {deck.map((card, index) => {
            const phase = index * FREQUENCY;
            const angle = Math.sin(phase) * MAX_ANGLE;
            const rise = -Math.cos(phase) * MAX_RISE;

            const isSelected = selected.some((entry) => entry.id === card.id);

            // Seçilen kart desteden çıkarılır, yerinde şeffaf yuva kalır
            if (isSelected) {
              return (
                <View
                  key={card.id}
                  pointerEvents="none"
                  style={[
                    styles.item,
                    {
                      marginLeft: index === 0 ? 0 : -OVERLAP_FAN,
                      zIndex: 0,
                      transform: [{ translateY: rise }, { rotate: `${angle}deg` }],
                    },
                  ]}
                >
                  <View style={styles.emptySlot} />
                </View>
              );
            }

            return (
              <View
                key={card.id}
                style={[
                  styles.item,
                  {
                    marginLeft: index === 0 ? 0 : -OVERLAP_FAN,
                    zIndex: index,
                    transform: [{ translateY: rise }, { rotate: `${angle}deg` }],
                  },
                ]}
              >
                <TarotCardBack
                  selected={false}
                  disabled={isFull}
                  onPress={() => onToggle(card)}
                  customImage={customBack}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  selectedShelf: {
    paddingTop: 26,
    paddingBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  shelfEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(20, 12, 44, 0.65)',
  },
  shelfEmptyText: {
    fontSize: 12.5,
    color: GOLD_SOFT,
  },
  shelfActiveWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  shelfCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  shelfCardPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  shelfCardThumb: {
    width: SELECTED_CARD_WIDTH,
    height: SELECTED_CARD_HEIGHT,
    overflow: 'visible',
  },
  shelfSubText: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 8,
    textAlign: 'center',
  },
  fanWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  fanContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 16,
  },
  item: {
    width: FAN_CARD_WIDTH,
  },
  emptySlot: {
    width: '100%',
    aspectRatio: 0.6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(242, 200, 121, 0.04)',
  },
});
