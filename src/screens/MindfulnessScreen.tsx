import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Mindfulness'>;

export default function MindfulnessScreen({ navigation }: Props) {
  const items = [
    {
      key: 'affirmation',
      iconKey: 'affirmation',
      title: 'Günlük Olumlama',
      subtitle: 'Bugüne iyi bir cümleyle başla',
      icon: <Ionicons name="sunny-outline" size={26} color={GOLD} />,
      onPress: () => navigation.navigate('Affirmation'),
    },
    {
      key: 'breathing',
      iconKey: 'breathing',
      title: 'Nefes Egzersizi',
      subtitle: 'Birkaç dakikada sakinleş',
      icon: <MaterialCommunityIcons name="meditation" size={26} color={GOLD} />,
      onPress: () => navigation.navigate('BreathingExercise'),
    },
    {
      key: 'mood',
      iconKey: 'moodJournal',
      title: 'Duygu Günlüğü',
      subtitle: 'Bugün nasıl hissettiğini kaydet',
      icon: <Ionicons name="book-outline" size={24} color={GOLD} />,
      onPress: () => navigation.navigate('MoodJournal'),
    },
  ];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="leaf" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Farkındalık</Text>
          <Text style={styles.headerSubtitle}>Kendine bir mola ver</Text>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <FeatureIcon source={FEATURE_ICONS[item.iconKey]} fallback={item.icon} />
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GOLD} />
            </Pressable>
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
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
