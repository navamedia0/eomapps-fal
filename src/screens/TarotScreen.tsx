import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  type LayoutChangeEvent,
  type ImageSourcePropType,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  shuffleTarotDeck,
  pickRandomTarotCards,
  randomOrientation,
  type TarotCardDef,
  type TarotOrientation,
} from '@/services/tarot';
import { findSpread } from '@/services/tarotSpreads';
import { getSelectedDesignImage } from '@/services/cardDesigns';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import TarotContextModal from '@/components/tarot/TarotContextModal';
import TarotFanLayout from '@/components/tarot/TarotFanLayout';
import TarotRadialLayout from '@/components/tarot/TarotRadialLayout';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ReadingCooldownNotice from '@/components/ReadingCooldownNotice';
import { useReadingCooldown } from '@/hooks/useReadingCooldown';
import { tarotReadingType } from '@/constants/aiQueue';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_MID,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_CAPTION,
} from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Tarot'>;

const COLUMNS = 4;
const GRID_GAP = 12;
const GRID_PADDING = 20;

type Selection = { id: string; orientation: TarotOrientation };

export default function TarotScreen({ navigation, route }: Props) {
  const spread = findSpread(route.params.spreadId);

  const [deck] = useState<TarotCardDef[]>(() => shuffleTarotDeck());
  const [selected, setSelected] = useState<Selection[]>([]);
  const [gridWidth, setGridWidth] = useState(0);
  const [customBack, setCustomBack] = useState<ImageSourcePropType | null>(null);
  const [contextModalVisible, setContextModalVisible] = useState(false);
  const { remaining: cooldownRemaining } = useReadingCooldown(tarotReadingType(spread.id));

  useEffect(() => {
    getSelectedDesignImage().then(setCustomBack);
  }, []);

  const cardWidth = gridWidth ? (gridWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS : 0;

  const handleGridLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width - GRID_PADDING * 2);
  };

  const isFull = selected.length >= spread.id;

  const toggleCard = (card: TarotCardDef) => {
    setSelected((prev) => {
      const exists = prev.find((entry) => entry.id === card.id);
      if (exists) return prev.filter((entry) => entry.id !== card.id);
      if (prev.length >= spread.id) return prev;
      return [...prev, { id: card.id, orientation: randomOrientation() }];
    });
  };

  const pickForMe = () => {
    const picks = pickRandomTarotCards(spread.id);
    setSelected(picks.map((card) => ({ id: card.id, orientation: card.orientation })));
  };

  const clearSelection = () => setSelected([]);

  const handleReveal = () => {
    if (selected.length !== spread.id || cooldownRemaining > 0) return;
    navigation.navigate('TarotResult', { spreadId: spread.id, picks: selected });
  };

  const nextPositionLabel = selected.length < spread.id ? spread.positions[selected.length] : null;

  return (
    <MysticTableBackground variant="tarot">
      <View style={styles.topSection}>
        <Text style={styles.title}>78 karttan {spread.id} tanesini seç</Text>
        <Text style={styles.caption}>{spread.description}</Text>

        <View style={styles.progressRow}>
          {spread.positions.map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, selected.length > index && styles.progressDotFilled]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {selected.length >= spread.id
            ? 'Tüm kartlar seçildi ✨'
            : `Sıradaki: ${nextPositionLabel} (${selected.length}/${spread.id})`}
        </Text>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={pickForMe}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="shuffle-variant" size={18} color={GOLD} />
            <Text style={styles.secondaryButtonText}>Benim Yerime Seç</Text>
          </Pressable>

          <Pressable
            onPress={handleReveal}
            disabled={selected.length !== spread.id || cooldownRemaining > 0}
            style={({ pressed }) => [
              styles.primaryButtonWrap,
              (selected.length !== spread.id || cooldownRemaining > 0) && styles.primaryButtonDisabled,
              pressed && selected.length === spread.id && cooldownRemaining === 0 && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#3A2E0F', NIGHT_CARD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <MaterialCommunityIcons name="eye-outline" size={18} color={GOLD} />
              <Text style={styles.primaryButtonText}>Falıma Bak</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <ReadingCooldownNotice remaining={cooldownRemaining} />

        <Pressable
          onPress={() => setContextModalVisible(true)}
          style={({ pressed }) => [styles.contextButton, pressed && styles.buttonPressed]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={GOLD} />
          <View style={styles.contextButtonTextWrap}>
            <Text style={styles.contextButtonText}>Kendinden bahsetmek ister misin?</Text>
            <Text style={styles.contextButtonCaption}>Daha iyi sonuç alabilmek için</Text>
          </View>
        </Pressable>

        {selected.length > 0 && (
          <Pressable onPress={clearSelection} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Seçimi temizle</Text>
          </Pressable>
        )}
      </View>

      <TarotContextModal visible={contextModalVisible} onClose={() => setContextModalVisible(false)} />

      {route.params.layout === 'fan' && (
        <TarotFanLayout deck={deck} selected={selected} isFull={isFull} customBack={customBack} onToggle={toggleCard} />
      )}

      {route.params.layout === 'radial' && (
        <TarotRadialLayout deck={deck} selected={selected} isFull={isFull} customBack={customBack} onToggle={toggleCard} />
      )}

      {(!route.params.layout || route.params.layout === 'grid') && (
        <FlatList
          style={styles.flex}
          onLayout={handleGridLayout}
          data={gridWidth ? deck : []}
          keyExtractor={(card) => card.id}
          numColumns={COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.gridContent, { paddingHorizontal: GRID_PADDING, gap: GRID_GAP }]}
          columnWrapperStyle={{ gap: GRID_GAP }}
          renderItem={({ item }) => {
            const selection = selected.find((entry) => entry.id === item.id);
            const positionLabel = selection ? selected.indexOf(selection) + 1 : undefined;
            return (
              <View style={{ width: cardWidth }}>
                <TarotCardBack
                  selected={!!selection}
                  positionLabel={positionLabel}
                  disabled={isFull && !selection}
                  onPress={() => toggleCard(item)}
                  customImage={customBack}
                />
              </View>
            );
          }}
        />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topSection: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(26, 20, 15, 0.55)',
    borderBottomWidth: 1,
    borderBottomColor: GOLD_SOFT,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  caption: {
    marginTop: 4,
    fontSize: 12.5,
    color: TEXT_CAPTION,
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  progressDotFilled: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: TEXT_MUTED,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: GOLD,
  },
  primaryButtonWrap: {
    flex: 1,
    flexBasis: 0,
    borderRadius: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  primaryButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 12,
  },
  contextButtonTextWrap: {
    alignItems: 'center',
  },
  contextButtonText: {
    fontSize: 13.5,
    color: GOLD,
    fontWeight: '700',
  },
  contextButtonCaption: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textDecorationLine: 'underline',
  },
  gridContent: {
    paddingTop: 22,
    paddingBottom: 40,
  },
});
