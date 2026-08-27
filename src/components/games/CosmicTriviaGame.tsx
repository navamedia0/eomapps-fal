import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addCoins } from '@/services/coins';
import { canPlayRewarded, markGamePlayed } from '@/services/miniGamesCooldown';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Question = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const TRIVIA_POOL: Question[] = [
  {
    id: 1,
    question: "Zodyak kuşağında Güneş tarafından yönetilen tek burç hangisidir?",
    options: ["Koç", "Aslan", "Yay", "Boğa"],
    correctIndex: 1,
    explanation: "Aslan burcu gökyüzünün kralı Güneş tarafından yönetilir.",
  },
  {
    id: 2,
    question: "Geleneksel bir Tarot destesinde toplam kaç adet kart bulunur?",
    options: ["52", "64", "78", "88"],
    correctIndex: 2,
    explanation: "Tarot destesi 22 Büyük Arkana ve 56 Küçük Arkana olmak üzere toplam 78 karttan oluşur.",
  },
  {
    id: 3,
    question: "Astrolojide aşkın, estetiğin ve çekimin temsilcisi olan gezegen hangisidir?",
    options: ["Mars", "Venüs", "Merkür", "Jüpiter"],
    correctIndex: 1,
    explanation: "Venüs, mitolojide ve astrolojide sevgi, uyum ve aşk tanrıçasıdır.",
  },
  {
    id: 4,
    question: "Tarot destesindeki Büyük Arkana serisi kaç karttan oluşur?",
    options: ["12", "20", "22", "36"],
    correctIndex: 2,
    explanation: "Büyük Arkana, ruhun tekamül yolculuğunu anlatan 22 arketipsel karttan oluşur.",
  },
  {
    id: 5,
    question: "İlkbahar Ekinoksu (21 Mart) ile başlayan Zodyak'ın 1. burcu hangisidir?",
    options: ["Balık", "Koç", "Oğlak", "Boğa"],
    correctIndex: 1,
    explanation: "Astrolojik yeni yıl 21 Mart'ta 0° Koç noktasıyla başlar.",
  },
  {
    id: 6,
    question: "Astrolojide karmik sınavlar, olgunlaşma ve disiplin gezegeni kimdir?",
    options: ["Uranüs", "Satürn", "Plüton", "Neptün"],
    correctIndex: 1,
    explanation: "Satürn, zamanın efendisi ve büyük hayat derslerinin öğretmenidir.",
  },
  {
    id: 7,
    question: "Kahve falında fincan dibinde 'Balık' görmek ne anlama gelir?",
    options: ["Uzun yolculuk", "Büyük kısmet ve rızık", "Gizli bir sır", "Kavga"],
    correctIndex: 1,
    explanation: "Balık sembolü kadim kahve falında en hayırlı kısmet ve bereket işaretidir.",
  },
  {
    id: 8,
    question: "Aşağıdaki burçlardan hangisi Su elementine aittir?",
    options: ["İkizler", "Başak", "Akrep", "Yay"],
    correctIndex: 2,
    explanation: "Akrep, Yengeç ve Balık ile birlikte Zodyak'ın Su üçlüsünü oluşturur.",
  },
  {
    id: 9,
    question: "Tarot serüveninin 0 numaralı, saf başlangıçları simgeleyen kartı hangisidir?",
    options: ["Büyücü", "Joker (Deli)", "Kader Çarkı", "Güneş"],
    correctIndex: 1,
    explanation: "Joker (The Fool) 0 numaralı karttır ve bilinmeze atılan cesur adımı temsil eder.",
  },
  {
    id: 10,
    question: "Astrolojide kişinin toplum önündeki kariyer zirvesini gösteren nokta hangisidir?",
    options: ["ASC (Yükselen)", "MC (Tepe Noktası)", "DSC (Alçalan)", "IC (Dip Noktası)"],
    correctIndex: 1,
    explanation: "Medium Coeli (MC), 10. Evin zirvesidir ve kariyer başarısını temsil eder.",
  },
];

function getRandomQuestions(count = 5): Question[] {
  const shuffled = [...TRIVIA_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function CosmicTriviaGame({ onClose }: { onClose: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [canReward, setCanReward] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setQuestions(getRandomQuestions(5));
    canPlayRewarded('quiz').then(setCanReward);
  }, []);

  useEffect(() => {
    if (isFinished || selectedOption !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isFinished, selectedOption]);

  const handleTimeOut = () => {
    setSelectedOption(-1); // Zaman doldu
    setTimeout(goToNextQuestion, 1400);
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(index);
    const currQ = questions[currentIndex];
    const isCorrect = index === currQ.correctIndex;

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setTimeout(goToNextQuestion, 1400);
  };

  const goToNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setIsFinished(true);
    const finalScore = score + (selectedOption === questions[currentIndex]?.correctIndex ? 1 : 0);

    if (canReward) {
      let rewardCoins = 0;
      if (finalScore >= 5) rewardCoins = 15;
      else if (finalScore >= 4) rewardCoins = 5;

      if (rewardCoins > 0) {
        await addCoins(rewardCoins);
      }
      await markGamePlayed('quiz');
      setCanReward(false);
    }
  };

  const handleRestart = () => {
    setQuestions(getRandomQuestions(5));
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="brain" size={20} color={GOLD} />
          <Text style={styles.headerTitle}>Mistik Bilgi Yarışması</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={GOLD} />
        </Pressable>
      </View>

      {!isFinished ? (
        <>
          {/* İlerleme ve Süre Barı */}
          <View style={styles.statusBar}>
            <Text style={styles.questionProgress}>
              Soru {currentIndex + 1} / {questions.length}
            </Text>
            <View style={styles.timerPill}>
              <Ionicons name="timer-outline" size={14} color={timeLeft <= 5 ? '#EF4444' : GOLD} />
              <Text style={[styles.timerText, timeLeft <= 5 && { color: '#EF4444' }]}>
                {timeLeft}s
              </Text>
            </View>
          </View>

          {/* Soru Kartı */}
          <View style={styles.questionCard}>
            <CornerTicks />
            <Text style={styles.questionText}>{currentQ.question}</Text>
          </View>

          {/* Şıklar */}
          <View style={styles.optionsList}>
            {currentQ.options.map((option, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === currentQ.correctIndex;
              const isAnswered = selectedOption !== null;

              return (
                <Pressable
                  key={i}
                  onPress={() => handleOptionSelect(i)}
                  disabled={isAnswered}
                  style={[
                    styles.optionBtn,
                    isAnswered && isCorrect && styles.optionCorrect,
                    isAnswered && isSelected && !isCorrect && styles.optionWrong,
                  ]}
                >
                  <View style={styles.optionLetterCircle}>
                    <Text style={styles.optionLetter}>{['A', 'B', 'C', 'D'][i]}</Text>
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isAnswered && isCorrect && styles.optionTextCorrect,
                      isAnswered && isSelected && !isCorrect && styles.optionTextWrong,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Açıklama */}
          {selectedOption !== null && (
            <Text style={styles.explanationText}>💡 {currentQ.explanation}</Text>
          )}
        </>
      ) : (
        /* SONUÇ EKRANI */
        <View style={styles.resultWrap}>
          <CornerTicks />
          <MaterialCommunityIcons
            name={score >= 4 ? 'crown' : 'school-outline'}
            size={40}
            color={GOLD}
          />
          <Text style={styles.resultTitle}>
            {score === 5 ? 'Kozmik Bilge!' : score >= 4 ? 'Yıldız Çırağı!' : 'Güzel Çaba!'}
          </Text>
          <Text style={styles.resultScoreText}>
            5 Soruda {score} Doğru Yaptın
          </Text>

          {canReward && (
            <Text style={styles.rewardNoticeText}>
              {score === 5
                ? '+15 Coin Kazandın! 🪙'
                : score === 4
                ? '+5 Coin Kazandın! 🪙'
                : 'Yarın tekrar deneyerek 15 Coin kazanabilirsin!'}
            </Text>
          )}

          <Pressable onPress={handleRestart} style={styles.restartBtn}>
            <MaterialCommunityIcons name="refresh" size={18} color="#1A0D33" />
            <Text style={styles.restartBtnText}>Yeniden Oyna</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  questionProgress: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  questionCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 18,
    width: '100%',
    marginVertical: 4,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    textAlign: 'center',
  },
  optionsList: {
    width: '100%',
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  optionLetterCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
  },
  optionText: {
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  optionTextCorrect: {
    color: '#10B981',
    fontWeight: '800',
  },
  optionTextWrong: {
    color: '#EF4444',
    fontWeight: '800',
  },
  explanationText: {
    fontSize: 11.5,
    color: GOLD_SOFT,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  resultWrap: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
  },
  resultScoreText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  rewardNoticeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginVertical: 4,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 8,
  },
  restartBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A0D33',
  },
});
