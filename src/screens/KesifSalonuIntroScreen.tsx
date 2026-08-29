import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getServerBestScore } from '@/services/games';
import { getLocalBestWave } from '@/services/kesifSalonu';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'KesifSalonu'>;

export default function KesifSalonuIntroScreen({ navigation }: Props) {
  const [bestWave, setBestWave] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getLocalBestWave().then(setBestWave);
      getServerBestScore('kesif_salonu').then((serverBest) => {
        if (serverBest !== null) setBestWave((current) => Math.max(current, serverBest));
      });
    }, []),
  );

  return (
    <MysticTableBackground>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="compass-outline" size={46} color={GOLD} />
        </View>
        <Text style={styles.title}>Keşif Salonu</Text>
        <Text style={styles.subtitle}>
          Karanlıktan gelen dalga dalga canavarlara karşı savun. Karakterin otomatik ateş eder, ekrana dokunarak bonus
          hasar verirsin. Ne kadar ileri gidersen o kadar iyi.
        </Text>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="trophy-outline" size={20} color={GOLD} />
          <Text style={styles.statLabel}>En İleri Dalgan</Text>
          <Text style={styles.statValue}>{bestWave}</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('KesifSalonuOyun')}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        >
          <MaterialCommunityIcons name="play" size={20} color="#1a0d33" />
          <Text style={styles.startButtonText}>Oyunu Başlat</Text>
        </Pressable>
      </View>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1.4,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    color: GOLD,
    fontWeight: '800',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a0d33',
  },
});
