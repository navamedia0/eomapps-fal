import type { Room } from 'livekit-client';

export type VoiceConnectionStatus = 'connected' | 'reconnecting';

export type VoiceSession = {
  roomId: string;
  roomName: string;
  livekitRoom: Room;
  status: VoiceConnectionStatus;
  muted: boolean;
};

type Listener = (session: VoiceSession | null) => void;

let current: VoiceSession | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener(current));
}

// Uygulama genelinde tek bir aktif sesli oda bağlantısı tutulur — RoomScreen
// kapansa bile (kullanıcı "arkaplanda açık kalsın" seçtiğinde) bu bağlantı
// canlı kalır ve VoiceSessionBubble her ekranın üzerinde onu gösterir. Tek
// kaynak burası olduğu için RoomScreen'in farklı bir mount'undan (bubble'a
// dokunup odaya geri dönünce) tekrar açılması da state'i doğru okur —
// LiveKit event dinleyicileri hep bu store'u güncelliyor, ekrana özel değil.
export function subscribeVoiceSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVoiceSession(): VoiceSession | null {
  return current;
}

// İleride kuracağımız devasa oyun (Kader Bahçesi'nin büyütülmüş hali /
// Keşif Salonu vb.) gibi ağır çok-oyunculu ekranlar, sunucu yükünü kontrol
// altında tutmak için buraya bakıp aktif bir sesli bağlantı varsa girişi
// engellemeli — herkesin sesli bağlıyken o ekrana girmesi sunucuları çökertir.
export function hasActiveVoiceSession(): boolean {
  return current !== null;
}

export function startVoiceSession(roomId: string, roomName: string, livekitRoom: Room): void {
  current = { roomId, roomName, livekitRoom, status: 'connected', muted: false };
  notify();
}

export function updateVoiceSession(patch: Partial<Pick<VoiceSession, 'status' | 'muted'>>): void {
  if (!current) return;
  current = { ...current, ...patch };
  notify();
}

// Bağlantıyı gerçekten kapatır (LiveKit disconnect + global state temizliği).
// Sadece kullanıcı odadan tamamen ayrılmak istediğinde ya da bubble'daki
// çarpıya bastığında çağrılır — arkaplanda bırakmak isteyen için ÇAĞRILMAZ.
export function endVoiceSession(): void {
  const session = current;
  current = null;
  notify();
  session?.livekitRoom.disconnect().catch(() => {});
}
