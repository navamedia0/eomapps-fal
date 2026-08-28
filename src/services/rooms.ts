import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson, deleteRequest } from '@/services/http';

export type RoomSummary = {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  seatedCount: number;
  capacity: number;
  createdAt: string;
};

export type RoomSeat = {
  index: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
} | null;

export type RoomDetail = {
  room: { id: string; name: string; hostId: string; hostName: string; createdAt: string };
  seats: RoomSeat[];
};

export type RoomMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

async function optionalAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  return session ? { Authorization: `Bearer ${session.token}`, ...appHeaders() } : appHeaders();
}

async function requireAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) {
    throw new Error('Bu işlem için giriş yapmalısın. Profil sekmesinden Google ile giriş yapabilirsin.');
  }
  return { Authorization: `Bearer ${session.token}`, ...appHeaders() };
}

export async function getRooms(): Promise<RoomSummary[]> {
  const { rooms } = await getJson<{ rooms: RoomSummary[] }>(`${env.socialApiUrl()}/rooms`, appHeaders());
  return rooms;
}

export async function createRoom(name: string): Promise<RoomSummary> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Oda adı gerekli.');
  const headers = await requireAuthHeaders();
  const { room } = await postJson<{ room: RoomSummary }>(`${env.socialApiUrl()}/rooms`, { name: trimmed }, headers);
  return room;
}

export async function getRoom(roomId: string): Promise<RoomDetail> {
  const headers = await optionalAuthHeaders();
  return getJson<RoomDetail>(`${env.socialApiUrl()}/rooms/${roomId}`, headers);
}

export async function takeSeat(roomId: string, seatIndex: number): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/rooms/${roomId}/seats/${seatIndex}`, {}, headers);
}

export async function leaveSeat(roomId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/seat`, headers);
}

export async function getRoomMessages(roomId: string): Promise<RoomMessage[]> {
  const headers = await optionalAuthHeaders();
  const { messages } = await getJson<{ messages: RoomMessage[] }>(`${env.socialApiUrl()}/rooms/${roomId}/messages`, headers);
  return messages;
}

export async function sendRoomMessage(roomId: string, text: string): Promise<RoomMessage> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Boş bir mesaj gönderilemez.');
  const headers = await requireAuthHeaders();
  const { message } = await postJson<{ message: RoomMessage }>(
    `${env.socialApiUrl()}/rooms/${roomId}/messages`,
    { text: trimmed },
    headers,
  );
  return message;
}

export async function getRoomVoiceToken(roomId: string): Promise<string> {
  const headers = await requireAuthHeaders();
  const { token } = await postJson<{ token: string }>(`${env.socialApiUrl()}/rooms/${roomId}/token`, {}, headers);
  return token;
}
