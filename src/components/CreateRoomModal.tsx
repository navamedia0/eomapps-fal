import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showAlert } from '@/services/themedAlert';
import { createRoom, ROOM_CAPACITIES, ROOM_TOPICS, type RoomSummary } from '@/services/rooms';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED, TEXT_CAPTION } from '@/theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (room: RoomSummary) => void;
};

export default function CreateRoomModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number>(5);
  const [topic, setTopic] = useState<string>(ROOM_TOPICS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setCapacity(5);
      setTopic(ROOM_TOPICS[0]);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const room = await createRoom(name, capacity, topic);
      onCreated(room);
    } catch (err) {
      showAlert('Oluşturulamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="mic-circle-outline" size={24} color={GOLD} />
              <Text style={styles.title}>Yeni Sesli Oda</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>
          </View>

          <Text style={styles.hint}>Odana bir isim ver, kaç kişilik olacağını ve modunu seç.</Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <Text style={styles.label}>Oda Adı</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Örn: Gece Sohbeti"
                placeholderTextColor={TEXT_CAPTION}
                style={styles.textInput}
                maxLength={60}
                autoFocus
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Kaç Kişilik?</Text>
              <View style={styles.chipsWrap}>
                {ROOM_CAPACITIES.map((cap) => (
                  <Pressable
                    key={cap}
                    onPress={() => setCapacity(cap)}
                    style={[styles.chip, capacity === cap && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, capacity === cap && styles.chipTextActive]}>{cap} Kişi</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Oda Modu</Text>
              <View style={styles.chipsWrap}>
                {ROOM_TOPICS.map((t) => (
                  <Pressable key={t} onPress={() => setTopic(t)} style={[styles.chip, topic === t && styles.chipActive]}>
                    <Text style={[styles.chipText, topic === t && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleCreate}
              disabled={creating || !name.trim()}
              style={[styles.saveBtn, (creating || !name.trim()) && styles.saveBtnDisabled]}
            >
              {creating ? (
                <ActivityIndicator size="small" color={NIGHT_DEEP} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color={NIGHT_DEEP} />
                  <Text style={styles.saveBtnText}>Odayı Oluştur</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    backgroundColor: NIGHT_CARD,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    padding: 18,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  hint: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 16,
    marginBottom: 16,
  },
  body: {
    marginBottom: 14,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(8, 7, 8, 0.75)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: TEXT_PRIMARY,
    fontSize: 13.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.22)',
    borderRadius: 100,
  },
  chipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  chipTextActive: {
    color: NIGHT_DEEP,
    fontWeight: '800',
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 201, 60, 0.15)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: NIGHT_DEEP,
  },
});
