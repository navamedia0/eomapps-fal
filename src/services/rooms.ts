import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson, patchJson, deleteRequest } from '@/services/http';

export type RoomSummary = {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  seatedCount: number;
  capacity: number;
  topic: string | null;
  createdAt: string;
};

export type RoomSeat = {
  index: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
} | null;

export type RoomViewer = { userId: string; displayName: string; avatarUrl: string | null };

export type RoomDetail = {
  room: { id: string; name: string; hostId: string; hostName: string; capacity: number; topic: string | null; createdAt: string };
  seats: RoomSeat[];
  viewers: RoomViewer[];
  isBanned: boolean;
  isMuted: boolean;
};

export type RoomMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export const ROOM_CAPACITIES = [2, 3, 5, 7, 10] as const;
export const ROOM_TOPICS = ['Genel Sohbet', 'Fal Değerlendirme', 'Müzik', 'Sadece Dinleme', 'Diğer'] as const;

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

export async function createRoom(name: string, capacity: number, topic: string | null): Promise<RoomSummary> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Oda adı gerekli.');
  const headers = await requireAuthHeaders();
  const { room } = await postJson<{ room: RoomSummary }>(
    `${env.socialApiUrl()}/rooms`,
    { name: trimmed, capacity, topic },
    headers,
  );
  return room;
}

export async function getRoom(roomId: string): Promise<RoomDetail> {
  const headers = await optionalAuthHeaders();
  return getJson<RoomDetail>(`${env.socialApiUrl()}/rooms/${roomId}`, headers);
}

export async function updateRoom(roomId: string, updates: { name?: string; topic?: string | null }): Promise<void> {
  const headers = await requireAuthHeaders();
  await patchJson(`${env.socialApiUrl()}/rooms/${roomId}`, updates, headers);
}

export async function closeRoom(roomId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}`, headers);
}

export async function clearRoomMessages(roomId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/messages`, headers);
}

export async function banRoomUser(roomId: string, userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/rooms/${roomId}/bans/${userId}`, {}, headers);
}

export async function unbanRoomUser(roomId: string, userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/bans/${userId}`, headers);
}

export async function muteRoomUser(roomId: string, userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/rooms/${roomId}/mutes/${userId}`, {}, headers);
}

export async function unmuteRoomUser(roomId: string, userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/mutes/${userId}`, headers);
}

export async function takeSeat(roomId: string, seatIndex: number): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/rooms/${roomId}/seats/${seatIndex}`, {}, headers);
}

export async function leaveSeat(roomId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/seat`, headers);
}

export async function kickSeatUser(roomId: string, userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/seats/user/${userId}`, headers);
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

export async function pingRoomViewer(roomId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/rooms/${roomId}/viewers`, {}, headers);
}

export async function leaveRoomViewer(roomId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/rooms/${roomId}/viewers`, headers);
}

export async function getRoomVoiceToken(roomId: string): Promise<string> {
  const headers = await requireAuthHeaders();
  const { token } = await postJson<{ token: string }>(`${env.socialApiUrl()}/rooms/${roomId}/token`, {}, headers);
  return token;
}
