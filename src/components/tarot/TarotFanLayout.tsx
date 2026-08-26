import { ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import type { TarotCardDef, TarotOrientation } from '@/services/tarot';

type Selection = { id: string; orientation: TarotOrientation };

type Props = {
  deck: TarotCardDef[];
  selected: Selection[];
  isFull: boolean;
  customBack: ImageSourcePropType | null;
  onToggle: (card: TarotCardDef) => void;
};

const CARD_WIDTH = 64;
const OVERLAP = 34;
const WAVE_PERIOD_CARDS = 12; // cards per full up-down cycle of the ribbon
const FREQUENCY = (2 * Math.PI) / WAVE_PERIOD_CARDS;
const MAX_ANGLE = 26; // degrees
const MAX_RISE = 20; // px

// A scrollable "hand of cards" laid out as a continuous wavy ribbon (a
// half-moon fan repeated smoothly down the whole scrollable strip) — every
// card's tilt/lift is a fixed function of its own index (a sine wave), not
// of live scroll position, so there's no native-driver scroll-interpolation
// involved. Selected cards pop via TarotCardBack's own built-in glow/scale,
// same as the grid and radial layouts.
export default function TarotFanLayout({ deck, selected, isFull, customBack, onToggle }: Props) {
  return (
    <ScrollView
      horizontal
      style={styles.flex}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {deck.map((card, index) => {
        const phase = index * FREQUENCY;
        const angle = Math.sin(phase) * MAX_ANGLE;
        const rise = -Math.cos(phase) * MAX_RISE;

        const selection = selected.find((entry) => entry.id === card.id);
        const positionLabel = selection ? selected.indexOf(selection) + 1 : undefined;

        return (
          <View
            key={card.id}
            style={[
              styles.item,
              {
                marginLeft: index === 0 ? 0 : -OVERLAP,
                zIndex: selection ? 1000 : index,
                transform: [{ translateY: rise }, { rotate: `${angle}deg` }],
              },
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  item: {
    width: CARD_WIDTH,
  },
});
