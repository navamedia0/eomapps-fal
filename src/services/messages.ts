import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson, postForm } from '@/services/http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  lastText: string;
  lastAt: string;
  lastFromMe: boolean;
  unreadCount: number;
};

export type DMMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  imageUri?: string;
  viewOnce?: boolean;
  viewed?: boolean;
  createdAt: string;
  read: boolean;
};

const VIEWED_ONCE_KEY_PREFIX = '@mistik:dm_viewed_once:';

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

async function requireAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) {
    throw new Error('Bu işlem için giriş yapmalısın. Profil sekmesinden Google ile giriş yapabilirsin.');
  }
  return { Authorization: `Bearer ${session.token}`, ...appHeaders() };
}

// 24 saatlik süre dolmuş mesajları filtreler
export function filterActiveMessages(messages: DMMessage[]): DMMessage[] {
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 3600 * 1000;
  return messages.filter((m) => {
    const msgTime = new Date(m.createdAt).getTime();
    return now - msgTime < TWENTY_FOUR_HOURS_MS;
  });
}

export async function isViewOnceOpened(messageId: string): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(VIEWED_ONCE_KEY_PREFIX + messageId);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function markViewOnceOpened(messageId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(VIEWED_ONCE_KEY_PREFIX + messageId, 'true');
  } catch {}
}

export async function getConversations(): Promise<Conversation[]> {
  const headers = await requireAuthHeaders();
  const { conversations } = await getJson<{ conversations: Conversation[] }>(`${env.socialApiUrl()}/conversations`, headers);
  return conversations;
}

export async function getThread(userId: string): Promise<DMMessage[]> {
  const headers = await requireAuthHeaders();
  const { messages } = await getJson<{ messages: DMMessage[] }>(`${env.socialApiUrl()}/messages/${userId}`, headers);
  const active = filterActiveMessages(messages);
  
  // View-once kontrolleri ekle
  const updated = await Promise.all(
    active.map(async (msg) => {
      if (msg.viewOnce) {
        const opened = await isViewOnceOpened(msg.id);
        return { ...msg, viewed: opened || msg.viewed };
      }
      return msg;
    }),
  );
  return updated;
}

export async function sendMessage(
  userId: string,
  text: string,
  options?: { imageUri?: string; viewOnce?: boolean },
): Promise<DMMessage> {
  const trimmed = text.trim();
  if (!trimmed && !options?.imageUri) throw new Error('Boş bir mesaj gönderilemez.');
  const headers = await requireAuthHeaders();
  
  const payload: Record<string, any> = { text: trimmed };
  if (options?.imageUri) payload.imageUri = options.imageUri;
  if (options?.viewOnce) payload.viewOnce = true;

  const { message } = await postJson<{ message: DMMessage }>(
    `${env.socialApiUrl()}/messages/${userId}`,
    payload,
    headers,
  );
  return message;
}
