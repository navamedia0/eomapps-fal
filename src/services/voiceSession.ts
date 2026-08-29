import { Platform } from 'react-native';
import { AudioSession, AndroidAudioTypePresets } from '@livekit/react-native';
import type { Room } from 'livekit-client';

export type VoiceConnectionStatus = 'connected' | 'reconnecting';

export type VoiceSession = {
  roomId: string;
  roomName: string;
  livekitRoom: Room;
  status: VoiceConnectionStatus;
  muted: boolean;
  isListener: boolean;
  isSpeaker: boolean;
};

type Listener = (session: VoiceSession | null) => void;

let current: VoiceSession | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener(current));
}

/**
 * LiveKit ses oturumunu yapılandırır:
 * - Varsayılan çıkışı Hoparlör (loudspeaker) yapar.
 * - Uzak ses seviyesini maksimuma (%100) ayarlar.
 * - İletişim modu ile mikrofon ve hoparlör dengesini optimize eder.
 */
export async function setupLiveKitAudio(enableSpeaker = true): Promise<void> {
  try {
    await AudioSession.configureAudio({
      android: {
        preferredOutputList: enableSpeaker
          ? ['speaker', 'headset', 'bluetooth', 'earpiece']
          : ['earpiece', 'headset', 'bluetooth', 'speaker'],
        audioTypeOptions: AndroidAudioTypePresets.communication,
      },
      ios: {
        defaultOutput: enableSpeaker ? 'speaker' : 'earpiece',
      },
    });
    await AudioSession.startAudioSession();
    await AudioSession.setDefaultRemoteAudioTrackVolume(1.0);
    await switchAudioOutput(enableSpeaker);
  } catch (err) {
    console.warn('AudioSession setup warning:', err);
  }
}

/**
 * Hoparlör ve Ahize (Telefon) ses çıkışları arasında geçiş yapar.
 */
export async function switchAudioOutput(enableSpeaker: boolean): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await AudioSession.selectAudioOutput(enableSpeaker ? 'speaker' : 'earpiece');
    } else if (Platform.OS === 'ios') {
      await AudioSession.selectAudioOutput(enableSpeaker ? 'force_speaker' : 'default');
    }
    if (current) {
      current = { ...current, isSpeaker: enableSpeaker };
      notify();
    }
  } catch (err) {
    console.warn('switchAudioOutput warning:', err);
  }
}

export function subscribeVoiceSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVoiceSession(): VoiceSession | null {
  return current;
}

export function hasActiveVoiceSession(): boolean {
  return current !== null;
}

export function startVoiceSession(
  roomId: string,
  roomName: string,
  livekitRoom: Room,
  isListener = false,
  isSpeaker = true,
): void {
  current = {
    roomId,
    roomName,
    livekitRoom,
    status: 'connected',
    muted: isListener,
    isListener,
    isSpeaker,
  };
  notify();
}

export function updateVoiceSession(
  patch: Partial<Pick<VoiceSession, 'status' | 'muted' | 'isListener' | 'isSpeaker'>>,
): void {
  if (!current) return;
  current = { ...current, ...patch };
  notify();
}

export function endVoiceSession(): void {
  const session = current;
  current = null;
  notify();
  session?.livekitRoom.disconnect().catch(() => {});
  AudioSession.stopAudioSession().catch(() => {});
}
