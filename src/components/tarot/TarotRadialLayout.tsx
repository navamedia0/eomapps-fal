import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
  type ImageSourcePropType,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import type { TarotCardDef, TarotOrientation } from '@/services/tarot';
import { GOLD, GOLD_SOFT, TEXT_MUTED } from '@/theme/colors';

type Selection = { id: string; orientation: TarotOrientation };

type Props = {
  deck: TarotCardDef[];
  selected: Selection[];
  isFull: boolean;
  customBack: ImageSourcePropType | null;
  onToggle: (card: TarotCardDef) => void;
};

const CARD_WIDTH = 46;
const CARD_HEIGHT = CARD_WIDTH / 0.6;

function getRadialOverlap(count: number): number {
  if (count <= 1) return 0;
  if (count <= 3) return 14;
  if (count <= 5) return 20;
  if (count <= 7) return 25;
  return 28; // for 8-10 cards
}

export default function TarotRadialLayout({ deck, selected, isFull, customBack, onToggle }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const radius = Math.max(0, Math.min(size.width, size.height) / 2 - CARD_HEIGHT / 2 - 10);
  const centerX = size.width / 2;
  const centerY = size.height / 2;

  const overlap = getRadialOverlap(selected.length);

  return (
    <View style={styles.ringWrap} onLayout={onLayout}>
      {/* 78 Kartlık Çember Dizilimi */}
      {size.width > 0 &&
        deck.map((card, index) => {
          const angle = (index / deck.length) * 360;
          const rad = (angle * Math.PI) / 180;
          const x = radius * Math.sin(rad);
          const y = -radius * Math.cos(rad);

          const isSelected = selected.some((entry) => entry.id === card.id);

          // Seçilen kart çemberden çıkarılır, yerinde dokunmaya engel olmayan şeffaf yuva kalır
          if (isSelected) {
            return (
              <View
                key={card.id}
                pointerEvents="none"
                style={[
                  styles.cardSlot,
                  {
                    left: centerX + x - CARD_WIDTH / 2,
                    top: centerY + y - CARD_HEIGHT / 2,
                    zIndex: 0,
                    transform: [{ rotate: `${angle}deg` }],
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
                styles.cardSlot,
                {
                  left: centerX + x - CARD_WIDTH / 2,
                  top: centerY + y - CARD_HEIGHT / 2,
                  zIndex: index,
                  transform: [{ rotate: `${angle}deg` }],
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

      {/* Ortadaki Seçilen Kartlar Alanı (Üst Üste Binen Deste Düzeni) */}
      {size.width > 0 && (
        <View
          style={[
            styles.centerContainer,
            {
              left: 0,
              right: 0,
              top: centerY - 68,
            },
          ]}
          pointerEvents="box-none"
        >
          {selected.length === 0 ? (
            <View style={styles.centerEmptyBox}>
              <MaterialCommunityIcons name="star-crescent" size={18} color={GOLD_SOFT} />
              <Text style={styles.centerEmptyText}>Kart seçmek için halkaya dokun</Text>
            </View>
          ) : (
            <View style={styles.centerActiveWrap}>
              <View style={styles.centerCardsRow}>
                {selected.map((entry, idx) => {
                  const cardDef = deck.find((c) => c.id === entry.id);
                  if (!cardDef) return null;
                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() => onToggle(cardDef)}
                      style={[
                        styles.centerCardPressable,
                        {
                          marginLeft: idx === 0 ? 0 : -overlap,
                          zIndex: idx + 1,
                        },
                      ]}
                      hitSlop={6}
                    >
                      <View style={styles.centerCardThumb}>
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
              <Text style={styles.centerSubText}>Geri koymak için dokun</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    flex: 1,
  },
  cardSlot: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.22)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(242, 200, 121, 0.04)',
  },
  centerContainer: {
    position: 'absolute',
    zIndex: 2000,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  centerEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(20, 12, 44, 0.7)',
  },
  centerEmptyText: {
    fontSize: 11.5,
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  centerActiveWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingTop: 18,
    paddingBottom: 4,
  },
  centerCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingHorizontal: 8,
    paddingTop: 14,
  },
  centerCardPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  centerCardThumb: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'visible',
  },
  centerSubText: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 8,
    textAlign: 'center',
  },
});
