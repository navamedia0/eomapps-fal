import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { readAudioAsBase64 } from '@/utils/audioBase64';
import { interpretVoiceReading } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceReading'>;

const AUDIO_MIME_TYPE = Platform.OS === 'web' ? 'audio/webm' : 'audio/aac';
const MAX_SECONDS = 60;

export default function VoiceReadingScreen({ navigation }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev + 1 >= MAX_SECONDS) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording && !loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, loading, pulse]);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setError(null);
    setResult(null);
    setBlocked(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setPermissionError('Mikrofona erişim izni verilmedi.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      setSeconds(0);
      setIsRecording(true);
    } catch (err) {
      setPermissionError(err instanceof Error ? err.message : 'Kayıt başlatılamadı.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('Kayıt dosyası bulunamadı.');
      await interpret(uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt işlenirken bir sorun oluştu.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const interpret = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    setBlocked(null);
    try {
      const remaining = await getCredits();
      if (remaining < 1) {
        setBlocked('Bugünkü ücretsiz fal hakkın doldu. Yarın tekrar buradayız ✨');
        return;
      }
      const base64 = await readAudioAsBase64(uri);
      const interpretation = await interpretVoiceReading(base64, AUDIO_MIME_TYPE);
      await spendCredit();
      setResult(interpretation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sesin yorumlanırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setBlocked(null);
    setSeconds(0);
  }, []);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.12] });

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!result && !loading && !blocked && !error && (
          <View style={styles.recordWrap}>
            <Text style={styles.instruction}>
              Aklından geçeni, bir soruyu ya da bir rüyayı sesli anlat; hem söylediklerini hem tonunu birlikte yorumlayayım.
            </Text>

            {permissionError && <Text style={styles.permissionError}>{permissionError}</Text>}

            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={({ pressed }) => [styles.micButton, isRecording && styles.micButtonActive, pressed && styles.micButtonPressed]}
            >
              <Animated.View style={isRecording ? { opacity: pulseOpacity, transform: [{ scale: pulseScale }] } : undefined}>
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={36} color={isRecording ? '#E08A8A' : NIGHT_CARD} />
              </Animated.View>
            </Pressable>

            <Text style={styles.timerText}>{isRecording ? `${seconds}s / ${MAX_SECONDS}s` : 'Başlamak için dokun'}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <Ionicons name="sparkles" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Sesin dinleniyor...</Animated.Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={reset} style={styles.retryButton}>
              <Ionicons name="refresh" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {blocked && (
          <View style={styles.blockedBox}>
            <Ionicons name="moon" size={22} color={GOLD} />
            <Text style={styles.blockedText}>{blocked}</Text>
            <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
              <Ionicons name="home-outline" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
            </Pressable>
          </View>
        )}

        {result && (
          <View style={styles.resultWrap}>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
            <View style={styles.actionsRow}>
              <ShareButton text={`Mistik Rehber - Sesli Fal\n\n${result}`} />
              <Pressable onPress={reset} style={({ pressed }) => [styles.newButton, pressed && styles.micButtonPressed]}>
                <Ionicons name="mic-outline" size={18} color={GOLD} />
                <Text style={styles.newButtonText}>Yeniden Konuş</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 48,
  },
  recordWrap: {
    alignItems: 'center',
    gap: 20,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionError: {
    fontSize: 12.5,
    color: '#E08A8A',
    textAlign: 'center',
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 2,
    borderColor: '#E08A8A',
  },
  micButtonPressed: {
    opacity: 0.85,
  },
  timerText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: GOLD,
    letterSpacing: 0.8,
    fontStyle: 'italic',
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  blockedBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: GOLD_SOFT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  blockedText: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  retryButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  resultWrap: {
    gap: 16,
  },
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
    flex: 1.6,
    flexBasis: 0,
  },
  newButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: GOLD,
  },
});
