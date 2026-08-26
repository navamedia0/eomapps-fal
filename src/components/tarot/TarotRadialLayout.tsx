import { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent, type ImageSourcePropType } from 'react-native';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import type { TarotCardDef, TarotOrientation } from '@/services/tarot';
import { GOLD } from '@/theme/colors';

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

// Every card arranged around a single circle filling the available screen
// (like a mandala/sunburst), heavily overlapping since 78 cards share the
// ring — the selected card scales up, glows gold and jumps to the front so
// it clearly "steps out" of the stack. Fixed layout (no drag-to-rotate) so
// it stays simple and legible.
export default function TarotRadialLayout({ deck, selected, isFull, customBack, onToggle }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const radius = Math.max(0, Math.min(size.width, size.height) / 2 - CARD_HEIGHT / 2 - 10);
  const centerX = size.width / 2;
  const centerY = size.height / 2;

  return (
    <View style={styles.ringWrap} onLayout={onLayout}>
      {size.width > 0 &&
        deck.map((card, index) => {
          const angle = (index / deck.length) * 360;
          const rad = (angle * Math.PI) / 180;
          const x = radius * Math.sin(rad);
          const y = -radius * Math.cos(rad);

          const selection = selected.find((entry) => entry.id === card.id);
          const positionLabel = selection ? selected.indexOf(selection) + 1 : undefined;

          return (
            <View
              key={card.id}
              style={[
                styles.cardSlot,
                {
                  left: centerX + x - CARD_WIDTH / 2,
                  top: centerY + y - CARD_HEIGHT / 2,
                  zIndex: selection ? 1000 : index,
                  transform: [{ rotate: `${angle}deg` }, { scale: selection ? 1.35 : 1 }],
                },
                selection && styles.cardSlotSelected,
              ]}
            >
              <TarotCardBack
                selected={!!selection}
                positionLabel={positionLabel}
                disabled={isFull && !selection}
                onPress={() => onToggle(card)}
                customImage={customBack}
              />
            </View>
          );
        })}
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
  cardSlotSelected: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
