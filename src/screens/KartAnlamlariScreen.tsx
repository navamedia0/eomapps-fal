import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { KATINA_DECK, type KatinaSuit } from '@/services/katina';
import { getKatinaMeaning, getKatinaCardDetail, type IskambilCardDetail } from '@/services/katinaMeanings';
import { TAROT_DECK, type TarotCardDef } from '@/services/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import PlayingCardFace from '@/components/PlayingCardFace';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import IskambilStoryModal from '@/components/IskambilStoryModal';
import CardStoryModal from '@/components/tarot/CardStoryModal';
import { GOLD, GOLD_SOFT, TEXT_CAPTION, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'KartAnlamlari'>;

type IskambilEntry = {
  kind: 'iskambil';
  id: string;
  name: string;
  suit: KatinaSuit;
  rankSlug: string;
  figure?: string;
  meaning: string;
  detail?: IskambilCardDetail;
};

type TarotEntry = {
  kind: 'tarot';
  id: string;
  card: TarotCardDef;
  name: string;
  meaning: string;
};

type Entry = IskambilEntry | TarotEntry;

// Kart yüzleri (özellikle iskambil figürleri) çok sayıda SVG path içeriyor;
// hepsini tek seferde ScrollView'a basmak yerine FlatList ile pencereleyerek
// sadece görünen kartları mount ediyoruz.
function IskambilRow({ entry, onShowStory }: { entry: IskambilEntry; onShowStory: (entry: IskambilEntry) => void }) {
  return (
    <View style={styles.cardRow}>
      <CornerTicks />
      <View style={styles.faceWrap}>
        <PlayingCardFace suit={entry.suit} rankSlug={entry.rankSlug} size={88} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{entry.name}</Text>
          {entry.figure ? <Text style={styles.figureBadge}>{entry.figure}</Text> : null}
        </View>
        <Text style={styles.meaning}>{entry.meaning}</Text>
        {entry.detail ? (
          <Pressable
            style={({ pressed }) => [styles.storyButton, pressed && styles.storyButtonPressed]}
            onPress={() => onShowStory(entry)}
          >
            <Ionicons name="book-outline" size={13} color={GOLD} />
            <Text style={styles.storyButtonText}>Kartın Hikayesini Gör</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function TarotRow({ entry, onShowStory }: { entry: TarotEntry; onShowStory: (card: TarotCardDef) => void }) {
  return (
    <View style={styles.cardRow}>
      <CornerTicks />
      <View style={styles.faceWrap}>
        <TarotCardFace card={entry.card} orientation="upright" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.name}>{entry.name}</Text>
        <Text style={styles.meaning}>{entry.meaning}</Text>
        <Pressable
          style={({ pressed }) => [styles.storyButton, pressed && styles.storyButtonPressed]}
          onPress={() => onShowStory(entry.card)}
        >
          <Ionicons name="book-outline" size={13} color={GOLD} />
          <Text style={styles.storyButtonText}>Kartın Hikayesini Gör</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function KartAnlamlariScreen({ route }: Props) {
  const { deck } = route.params;

  const [selectedIskambil, setSelectedIskambil] = useState<{
    id: string;
    detail: IskambilCardDetail;
    suit: KatinaSuit;
    rankSlug: string;
  } | null>(null);

  const [selectedTarot, setSelectedTarot] = useState<TarotCardDef | null>(null);

  const entries: Entry[] = useMemo(() => {
    if (deck === 'iskambil') {
      return KATINA_DECK.map((card): IskambilEntry => {
        const rankSlug = card.id.slice(card.suit.length + 1);
        const detail = getKatinaCardDetail(card.id);
        return {
          kind: 'iskambil',
          id: card.id,
          name: card.name,
          suit: card.suit,
          rankSlug,
          figure: detail?.figure,
          meaning: detail?.meaning ?? getKatinaMeaning(card.id) ?? '',
          detail,
        };
      });
    }
    return TAROT_DECK.map((card): TarotEntry => ({
      kind: 'tarot',
      id: card.id,
      card,
      name: card.name,
      meaning: getTarotMeaning(card.id)?.upright ?? '',
    }));
  }, [deck]);

  const handleShowIskambilStory = useCallback((entry: IskambilEntry) => {
    if (!entry.detail) return;
    setSelectedIskambil({ id: entry.id, detail: entry.detail, suit: entry.suit, rankSlug: entry.rankSlug });
  }, []);

  const handleShowTarotStory = useCallback((card: TarotCardDef) => {
    setSelectedTarot(card);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Entry }) =>
      item.kind === 'iskambil' ? (
        <IskambilRow entry={item} onShowStory={handleShowIskambilStory} />
      ) : (
        <TarotRow entry={item} onShowStory={handleShowTarotStory} />
      ),
    [handleShowIskambilStory, handleShowTarotStory],
  );

  const intro = useMemo(
    () => (
      <Text style={styles.intro}>
        {deck === 'iskambil'
          ? '52 kartlık destenin kadim fal anlamları, mitolojik kökenleri ve hikayeleri.'
          : '78 kartlık Rider-Waite destesinin düz (upright) anlamları ve sembolik hikayeleri.'}
      </Text>
    ),
    [deck],
  );

  return (
    <MysticTableBackground>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={intro}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
      />

      {/* İskambil Hikaye Modalı */}
      <IskambilStoryModal
        cardId={selectedIskambil?.id ?? null}
        detail={selectedIskambil?.detail ?? null}
        suit={selectedIskambil?.suit ?? null}
        rankSlug={selectedIskambil?.rankSlug ?? null}
        onClose={() => setSelectedIskambil(null)}
      />

      {/* Tarot Hikaye Modalı */}
      <CardStoryModal card={selectedTarot} onClose={() => setSelectedTarot(null)} />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  intro: {
    fontSize: 12.5,
    color: TEXT_CAPTION,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  separator: {
    height: 16,
  },
  cardRow: {
    position: 'relative',
    flexDirection: 'row',
    gap: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.32)',
    padding: 14,
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  faceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: GOLD,
  },
  figureBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
    marginTop: 1,
    fontStyle: 'italic',
  },
  meaning: {
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  storyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(242, 200, 121, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.35)',
  },
  storyButtonPressed: {
    backgroundColor: 'rgba(242, 200, 121, 0.26)',
  },
  storyButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.2,
  },
});
