import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateDetailedBirthChart,
  type DetailedBirthChart,
  type BirthData,
} from '@/services/astrology';
import { interpretDetailedBirthChart } from '@/services/readings-ai';
import { saveReadingHistory } from '@/services/readingHistory';

const JOB_STORAGE_KEY = '@mistik-rehber/active-birth-chart-job';
export const DETAILED_DURATION_MS = 180 * 1000; // 3 Dakika (180 saniye)

export type BirthChartJob = {
  id: string;
  birthData: BirthData;
  cityName: string;
  birthDateFormatted: string;
  startedAt: number;
  targetFinishAt: number;
  status: 'processing' | 'completed' | 'error';
  detailedChart?: DetailedBirthChart;
  aiReport?: string;
  error?: string;
};

export async function getActiveBirthChartJob(): Promise<BirthChartJob | null> {
  try {
    const raw = await AsyncStorage.getItem(JOB_STORAGE_KEY);
    if (!raw) return null;
    const job: BirthChartJob = JSON.parse(raw);

    // 24 saatten eski kalmış işleri temizle
    if (Date.now() - job.startedAt > 24 * 60 * 60 * 1000) {
      await clearActiveBirthChartJob();
      return null;
    }

    return job;
  } catch {
    return null;
  }
}

export async function saveActiveBirthChartJob(job: BirthChartJob): Promise<void> {
  await AsyncStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(job));
}

export async function clearActiveBirthChartJob(): Promise<void> {
  await AsyncStorage.removeItem(JOB_STORAGE_KEY);
}

// Detaylı analiz işini başlatır ve arka planda sürdürür
export async function startBirthChartBackgroundJob(
  birthData: BirthData,
  cityName: string,
  birthDateFormatted: string,
): Promise<BirthChartJob> {
  const now = Date.now();
  const job: BirthChartJob = {
    id: `bc-job-${now}`,
    birthData,
    cityName,
    birthDateFormatted,
    startedAt: now,
    targetFinishAt: now + DETAILED_DURATION_MS,
    status: 'processing',
  };

  await saveActiveBirthChartJob(job);

  // Arka planda astronomik hesap ve yapay zeka analizini yürüt
  runJobExecution(job).catch((err) => {
    console.error('Doğum haritası arka plan iş hatası:', err);
  });

  return job;
}

// Hesaplamayı yürüten ve tamamlandığında hem işi güncelleyen hem de geçmişe kaydeden fonksiyon
export async function runJobExecution(job: BirthChartJob): Promise<BirthChartJob> {
  try {
    const detailed = calculateDetailedBirthChart(job.birthData);
    const aiReport = await interpretDetailedBirthChart(detailed);

    const updatedJob: BirthChartJob = {
      ...job,
      status: 'completed',
      detailedChart: detailed,
      aiReport,
    };

    await saveActiveBirthChartJob(updatedJob);

    // Otomatik olarak Profil > Geçmiş bölümüne kaydet
    await saveReadingHistory({
      type: 'dogumHaritasi',
      title: `Doğum Haritası (${job.cityName} · ${job.birthDateFormatted})`,
      result: aiReport,
      metadata: {
        detailedChart: detailed,
        cityName: job.cityName,
        birthDateFormatted: job.birthDateFormatted,
        isDetailed: true,
      },
    });

    return updatedJob;
  } catch (err) {
    const errorJob: BirthChartJob = {
      ...job,
      status: 'error',
      error: err instanceof Error ? err.message : 'Doğum haritası oluşturulurken hata oluştu.',
    };
    await saveActiveBirthChartJob(errorJob);
    throw err;
  }
}
