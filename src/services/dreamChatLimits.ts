import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/dream-chat-limits';
export const DEEP_DREAM_COIN_COST = 20; // Kapsamlı Bilinçaltı Analiz Odası
export const DREAM_MESSAGE_COIN_COST = 5; // Ekstra mesaj ücreti
export const DREAM_MAX_LIMITED_CHARS = 500; // Sınırlı mod karakter sınırı
export const DREAM_MAX_DEEP_CHARS = 2000; // Derin mod karakter sınırı
export const DEEP_DREAM_BUNDLE_MESSAGES = 10; // Derin modda 10 mesaj sohbet hakkı dahil

export type DreamMode = 'limited' | 'deep';

type DreamLimitState = {
  date: string;
  limitedCount: number; // Sınırlı mod mesaj sayısı
  limitedVideoUnlocked: boolean; // Sınırlı modda 3. mesaj için video izlendi mi?
  deepCount: number; // Derin modda atılan mesaj sayısı
  deepPurchased: boolean; // Bugün derin mod satın alındı mı?
};

const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<DreamLimitState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        date: today(),
        limitedCount: 0,
        limitedVideoUnlocked: false,
        deepCount: 0,
        deepPurchased: false,
      };
    }
    const parsed: DreamLimitState = JSON.parse(raw);
    return parsed.date === today()
      ? parsed
      : {
          date: today(),
          limitedCount: 0,
          limitedVideoUnlocked: false,
          deepCount: 0,
          deepPurchased: false,
        };
  } catch {
    return {
      date: today(),
      limitedCount: 0,
      limitedVideoUnlocked: false,
      deepCount: 0,
      deepPurchased: false,
    };
  }
}

async function writeState(state: DreamLimitState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type DreamChatStatus = {
  mode: DreamMode;
  messagesSentToday: number;
  freeRemaining: number;
  status: 'free' | 'need_video' | 'coin_mode' | 'deep_bundle' | 'deep_need_initial_coin';
};

export async function getDreamModeStatus(mode: DreamMode): Promise<DreamChatStatus> {
  const state = await readState();

  if (mode === 'limited') {
    const count = state.limitedCount;
    if (count < 2) {
      return {
        mode: 'limited',
        messagesSentToday: count,
        freeRemaining: 2 - count,
        status: 'free',
      };
    }
    if (count === 2) {
      if (state.limitedVideoUnlocked) {
        return {
          mode: 'limited',
          messagesSentToday: count,
          freeRemaining: 1,
          status: 'free',
        };
      }
      return {
        mode: 'limited',
        messagesSentToday: count,
        freeRemaining: 0,
        status: 'need_video',
      };
    }
    return {
      mode: 'limited',
      messagesSentToday: count,
      freeRemaining: 0,
      status: 'coin_mode',
    };
  }

  // Deep Mode
  if (!state.deepPurchased) {
    return {
      mode: 'deep',
      messagesSentToday: 0,
      freeRemaining: 0,
      status: 'deep_need_initial_coin',
    };
  }

  // Deep purchased: first 10 messages are in bundle
  const deepMessages = state.deepCount;
  if (deepMessages < DEEP_DREAM_BUNDLE_MESSAGES) {
    return {
      mode: 'deep',
      messagesSentToday: deepMessages,
      freeRemaining: DEEP_DREAM_BUNDLE_MESSAGES - deepMessages,
      status: 'deep_bundle',
    };
  }

  return {
    mode: 'deep',
    messagesSentToday: deepMessages,
    freeRemaining: 0,
    status: 'coin_mode',
  };
}

export async function unlockDreamLimitedVideo(): Promise<void> {
  const state = await readState();
  state.limitedVideoUnlocked = true;
  await writeState(state);
}

export async function markDeepDreamPurchased(): Promise<void> {
  const state = await readState();
  state.deepPurchased = true;
  state.deepCount = 0;
  await writeState(state);
}

export async function recordDreamMessageSent(mode: DreamMode): Promise<void> {
  const state = await readState();
  if (mode === 'limited') {
    state.limitedCount += 1;
    if (state.limitedCount === 3) {
      state.limitedVideoUnlocked = false;
    }
  } else {
    state.deepCount += 1;
  }
  await writeState(state);
}
