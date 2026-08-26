import { useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, type ImageSourcePropType } from 'react-native';
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
const STRIDE = CARD_WIDTH - OVERLAP;
const FALLOFF = STRIDE * 3.5;
const MAX_ANGLE = 32;
const MAX_RISE = 26;

// A scrollable "hand of cards" — whichever cards sit near the horizontal
// center of the viewport curve upward into a half-moon fan (coverflow-style,
// driven by scroll position), while cards further out rotate away and drop
// down. Selected cards additionally lift and glow regardless of position.
export default function TarotFanLayout({ deck, selected, isFull, customBack, onToggle }: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const sidePadding = screenWidth / 2 - CARD_WIDTH / 2;

  return (
    <Animated.ScrollView
      horizontal
      style={styles.flex}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingHorizontal: sidePadding }]}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
      scrollEventThrottle={16}
    >
      {deck.map((card, index) => {
        const itemCenter = index * STRIDE;
        const rotate = scrollX.interpolate({
          inputRange: [itemCenter - FALLOFF, itemCenter, itemCenter + FALLOFF],
          outputRange: [`${MAX_ANGLE}deg`, '0deg', `-${MAX_ANGLE}deg`],
          extrapolate: 'clamp',
        });
        const translateY = scrollX.interpolate({
          inputRange: [itemCenter - FALLOFF, itemCenter, itemCenter + FALLOFF],
          outputRange: [MAX_RISE, -MAX_RISE * 0.6, MAX_RISE],
          extrapolate: 'clamp',
        });

        const selection = selected.find((entry) => entry.id === card.id);
        const positionLabel = selection ? selected.indexOf(selection) + 1 : undefined;

        return (
          <Animated.View
            key={card.id}
            style={[
              styles.item,
              { marginLeft: index === 0 ? 0 : -OVERLAP, zIndex: selection ? 1000 : index },
              { transform: [{ translateY }, { rotate }] },
            ]}
          >
            <TarotCardBack
              selected={!!selection}
              positionLabel={positionLabel}
              disabled={isFull && !selection}
              onPress={() => onToggle(card)}
              customImage={customBack}
            />
          </Animated.View>
        );
      })}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'flex-end',
    paddingTop: 40,
    paddingBottom: 20,
  },
  item: {
    width: CARD_WIDTH,
  },
});
