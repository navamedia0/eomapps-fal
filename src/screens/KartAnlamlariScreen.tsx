import { useMemo } from 'react';
import { View, Text, ImageBackground, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { KATINA_DECK } from '@/services/katina';
import { getKatinaMeaning } from '@/services/katinaMeanings';
import { TAROT_DECK } from '@/services/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import PlayingCardFace from '@/components/PlayingCardFace';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { TEXT_CAPTION, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const CARD_FRAME = require('@/assets/textures/bilgi_karti_cercevesi.webp');

type Props = NativeStackScreenProps<RootStackParamList, 'KartAnlamlari'>;

type Entry = { id: string; name: string; meaning: string; face: React.ReactNode };

export default function KartAnlamlariScreen({ route }: Props) {
  const { deck } = route.params;

  const entries = useMemo<Entry[]>(() => {
    if (deck === 'iskambil') {
      return KATINA_DECK.map((card) => {
        const rankSlug = card.id.slice(card.suit.length + 1);
        return {
          id: card.id,
          name: card.name,
          meaning: getKatinaMeaning(card.id) ?? '',
          face: <PlayingCardFace suit={card.suit} rankSlug={rankSlug} size={90} />,
        };
      });
    }
    return TAROT_DECK.map((card) => ({
      id: card.id,
      name: card.name,
      meaning: getTarotMeaning(card.id)?.upright ?? '',
      face: <TarotCardFace card={card} orientation="upright" />,
    }));
  }, [deck]);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          {deck === 'iskambil'
            ? '52 kartlık standart destenin geleneksel fal anlamları.'
            : '78 kartlık Rider-Waite destesinin düz (upright) anlamları.'}
        </Text>

        <View style={styles.list}>
          {entries.map((entry) => (
            <ImageBackground key={entry.id} source={CARD_FRAME} style={styles.row} imageStyle={styles.rowImage} resizeMode="stretch">
              <View style={styles.faceWrap}>{entry.face}</View>
              <View style={styles.textWrap}>
                <Text style={styles.name}>{entry.name}</Text>
                <Text style={styles.meaning}>{entry.meaning}</Text>
              </View>
            </ImageBackground>
          ))}
        </View>
      </ScrollView>
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
  intro: {
    fontSize: 12.5,
    color: TEXT_CAPTION,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rowImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  faceWrap: {
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  meaning: {
    fontSize: 12,
    lineHeight: 18,
    color: TEXT_MUTED,
  },
});
