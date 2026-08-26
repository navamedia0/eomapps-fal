import { Ionicons } from '@expo/vector-icons';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Sil',
  cancelLabel = 'Vazgeç',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View style={styles.sheet}>
          <Ionicons name="alert-circle-outline" size={26} color={destructive ? '#E08A8A' : GOLD} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsRow}>
            <Pressable onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmButton, destructive && styles.confirmButtonDestructive]}
            >
              <Text style={[styles.confirmButtonText, destructive && styles.confirmButtonTextDestructive]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 12, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 22,
    alignItems: 'center',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
  },
  confirmButtonDestructive: {
    backgroundColor: 'rgba(224, 138, 138, 0.15)',
    borderColor: 'rgba(224, 138, 138, 0.5)',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  confirmButtonTextDestructive: {
    color: '#E08A8A',
  },
});
