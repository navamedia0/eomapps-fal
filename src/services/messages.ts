import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson } from '@/services/http';

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
  createdAt: string;
  read: boolean;
};

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

export async function getConversations(): Promise<Conversation[]> {
  const headers = await requireAuthHeaders();
  const { conversations } = await getJson<{ conversations: Conversation[] }>(`${env.socialApiUrl()}/conversations`, headers);
  return conversations;
}

export async function getThread(userId: string): Promise<DMMessage[]> {
  const headers = await requireAuthHeaders();
  const { messages } = await getJson<{ messages: DMMessage[] }>(`${env.socialApiUrl()}/messages/${userId}`, headers);
  return messages;
}

export async function sendMessage(userId: string, text: string): Promise<DMMessage> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Boş bir mesaj gönderilemez.');
  const headers = await requireAuthHeaders();
  const { message } = await postJson<{ message: DMMessage }>(`${env.socialApiUrl()}/messages/${userId}`, { text: trimmed }, headers);
  return message;
}
