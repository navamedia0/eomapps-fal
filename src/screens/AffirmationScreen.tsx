import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { getDailyAffirmation } from '@/services/dailyAffirmationCache';
import { GOLD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const todayLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function AffirmationScreen() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    getDailyAffirmation().then(setText);
  }, []);

  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <Text style={styles.dateLabel}>{todayLabel}</Text>
        <View style={styles.iconCircle}>
          <Ionicons name="sunny-outline" size={40} color={GOLD} />
        </View>
        {text && (
          <>
            <Text style={styles.affirmationText}>“{text}”</Text>
            <View style={styles.shareRow}>
              <ShareButton text={`Mistik Rehber - Günlük Olumlama\n\n${text}`} />
            </View>
          </>
        )}
        <Text style={styles.hint}>Bu cümleyi bugün birkaç kez kendine tekrarla.</Text>
      </View>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dateLabel: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginBottom: 20,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  affirmationText: {
    fontSize: 19,
    lineHeight: 28,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 20,
  },
  shareRow: {
    width: '60%',
    marginBottom: 24,
  },
  hint: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});
