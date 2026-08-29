import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getComments, addComment, deleteComment, reportContent, type KesfetComment } from '@/services/kesfetPosts';
import { relativeTime } from '@/utils/relativeTime';
import { avatarColor } from '@/utils/avatarColor';
import { promptReport } from '@/utils/reportPrompt';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MAX_COMMENT_LENGTH = 500;

type Props = {
  postId: string | null;
  onClose: () => void;
  onPressAuthor: (userId: string) => void;
};

export default function CommentsModal({ postId, onClose, onPressAuthor }: Props) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<KesfetComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    if (!postId) return;
    setLoading(true);
    getComments(postId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (postId) refresh();
    else setText('');
  }, [postId, refresh]);

  const handleSend = useCallback(async () => {
    if (!postId || !text.trim()) return;
    setSending(true);
    try {
      const comment = await addComment(postId, text);
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch (err) {
      showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setSending(false);
    }
  }, [postId, text]);

  const handleReport = useCallback((id: string) => {
    promptReport((reason) => {
      reportContent('comment', id, reason)
        .then(() => showAlert('Teşekkürler', 'Şikayetin alındı.'))
        .catch((err) => showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.'));
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    showAlert('Yorumu sil', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(id);
            setComments((prev) => prev.filter((c) => c.id !== id));
          } catch (err) {
            showAlert('Silinemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
          }
        },
      },
    ]);
  }, []);

  return (
    <Modal visible={!!postId} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Yorumlar</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={GOLD} style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>Henüz yorum yok — ilk yorumu sen yaz.</Text>}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Pressable onPress={() => onPressAuthor(item.authorId)} style={styles.commentAuthorPressable} hitSlop={4}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor(item.authorTag) }]}>
                        <Text style={styles.avatarText}>{item.authorName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.commentBody}>
                        <View style={styles.commentMetaRow}>
                          <Text style={styles.commentAuthor}>{item.authorName}</Text>
                          <Text style={styles.commentMeta}>{relativeTime(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.commentText}>{item.text}</Text>
                      </View>
                    </Pressable>
                    {item.isMe ? (
                      <Pressable onPress={() => handleDelete(item.id)} hitSlop={10}>
                        <Ionicons name="trash-outline" size={16} color={TEXT_MUTED} />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => handleReport(item.id)} hitSlop={10}>
                        <Ionicons name="flag-outline" size={15} color={TEXT_MUTED} />
                      </Pressable>
                    )}
                  </View>
                )}
              />
            )}

            <View style={styles.inputRow}>
              <TextInput
                value={text}
                onChangeText={(t) => setText(t.slice(0, MAX_COMMENT_LENGTH))}
                placeholder="Bir yorum yaz..."
                placeholderTextColor={TEXT_MUTED}
                style={styles.input}
                multiline
              />
              <Pressable
                onPress={handleSend}
                disabled={sending || !text.trim()}
                style={[styles.sendButton, (sending || !text.trim()) && styles.sendButtonDisabled]}
              >
                {sending ? <ActivityIndicator size="small" color="#1a0d33" /> : <Ionicons name="send" size={16} color="#1a0d33" />}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 4, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '80%',
  },
  sheet: {
    backgroundColor: NIGHT_MID,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD_SOFT,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    gap: 14,
    paddingBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingVertical: 24,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentAuthorPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  commentBody: {
    flex: 1,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  commentMeta: {
    fontSize: 10.5,
    color: TEXT_MUTED,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GOLD_SOFT,
    marginTop: 10,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: NIGHT_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
