import { useEffect, useRef, useState } from 'react';
import { Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import { subscribeVoiceSession, getVoiceSession, endVoiceSession, type VoiceSession } from '@/services/voiceSession';
import { leaveSeat } from '@/services/rooms';
import { GOLD, NIGHT_DEEP } from '@/theme/colors';

const BUBBLE_SIZE = 58;
const DRAG_TAP_THRESHOLD = 6;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const INITIAL_POS = { x: SCREEN_W - BUBBLE_SIZE - 14, y: SCREEN_H - BUBBLE_SIZE - 170 };

type Props = {
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
};

// Kullanıcı oda ekranından "arkaplanda açık kalsın" diyerek çıktığında,
// sesli bağlantı canlı kalır ve bu baloncuk uygulamanın her ekranının
// üzerinde sürüklenebilir şekilde belirir. Odaya dönmek için gövdeye,
// bağlantıyı tamamen kapatmak için sağ üstteki çarpıya dokunulur.
//
// PanResponder'ın handler'ları SADECE ref'lere ve imperatif getter'lara
// (getVoiceSession) bakıyor, React state/useCallback'e değil — aksi halde
// PanResponder ilk render'da donuyor (useRef bir kere kuruluyor) ve o anki
// state'e (ör. henüz ölçülmemiş ekran boyutu) sonsuza dek takılı kalıyordu;
// bu yüzden sürükleme her zaman sol üste geri fırlıyordu.
export default function VoiceSessionBubble({ navigationRef }: Props) {
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [viewingRoomId, setViewingRoomId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [pos, setPos] = useState(INITIAL_POS);

  const posRef = useRef(INITIAL_POS);
  const dragStartRef = useRef(INITIAL_POS);
  const dragDistanceRef = useRef(0);
  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(
    () =>
      subscribeVoiceSession((s) => {
        sessionRef.current = s;
        setSession(s);
      }),
    [],
  );

  // RoomScreen zaten bu odayı tam ekran gösteriyorsa baloncuğu tekrar
  // üstüne bindirmeyelim — sadece başka bir ekrandayken görünsün.
  useEffect(() => {
    const readCurrentRoom = () => {
      if (!navigationRef.isReady()) return;
      const route = navigationRef.getCurrentRoute();
      const params = route?.params as { roomId?: string } | undefined;
      setViewingRoomId(route?.name === 'Room' ? params?.roomId ?? null : null);
    };
    readCurrentRoom();
    return navigationRef.addListener('state', readCurrentRoom);
  }, [navigationRef]);

  const clampPos = (x: number, y: number) => {
    const maxX = SCREEN_W - BUBBLE_SIZE;
    const minY = insets.top + 4;
    const maxY = Math.max(minY, SCREEN_H - BUBBLE_SIZE - insets.bottom - 4);
    return { x: Math.min(Math.max(x, 0), maxX), y: Math.min(Math.max(y, minY), maxY) };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragDistanceRef.current = 0;
        dragStartRef.current = posRef.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        dragDistanceRef.current = Math.abs(gesture.dx) + Math.abs(gesture.dy);
        const next = clampPos(dragStartRef.current.x + gesture.dx, dragStartRef.current.y + gesture.dy);
        posRef.current = next;
        setPos(next);
      },
      onPanResponderRelease: () => {
        if (dragDistanceRef.current < DRAG_TAP_THRESHOLD) {
          const active = getVoiceSession();
          if (active) {
            navigationRef.navigate('Room', { roomId: active.roomId, roomName: active.roomName });
          }
        }
      },
    }),
  ).current;

  const handleClose = () => {
    const active = getVoiceSession();
    if (!active) return;
    endVoiceSession();
    leaveSeat(active.roomId).catch(() => {});
  };

  if (!session || session.roomId === viewingRoomId) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <View style={[styles.bubble, { left: pos.x, top: pos.y }]} {...panResponder.panHandlers}>
        <View style={styles.bubbleCircle}>
          <Ionicons name="mic" size={22} color={NIGHT_DEEP} />
        </View>
        <Text style={styles.bubbleLabel} numberOfLines={1}>
          {session.roomName}
        </Text>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={13} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    alignItems: 'center',
    zIndex: 999,
    elevation: 20,
  },
  bubbleCircle: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  bubbleLabel: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(8, 7, 8, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: BUBBLE_SIZE + 30,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B23B3B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: NIGHT_DEEP,
  },
});
