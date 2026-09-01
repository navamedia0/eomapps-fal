import React, { useCallback, useEffect, useState } from 'react';
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
import { GOLD, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MAX_COMMENT_LENGTH = 500;
const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

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
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    if (!postId) return;
    setLoading(true);
    getComments(postId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (postId) {
      refresh();
    } else {
      setText('');
    }
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

  const handleQuickEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const toggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

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

  if (!postId) return null;

  return (
    <Modal visible={!!postId} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Backdrop Tap to Close instantly */}
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Top Drag Handle Bar */}
            <Pressable onPress={onClose} style={styles.handleContainer} hitSlop={12}>
              <View style={styles.handle} />
            </Pressable>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Yorumlar</Text>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={20} color={TEXT_MUTED} />
              </Pressable>
            </View>

            {/* Comments List */}
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={GOLD} size="small" />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={32} color={TEXT_MUTED} />
                    <Text style={styles.emptyTitle}>Henüz yorum yok</Text>
                    <Text style={styles.emptySub}>Sohbeti ilk başlatan sen ol.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isLiked = likedComments.has(item.id);
                  return (
                    <View style={styles.commentRow}>
                      <Pressable
                        onPress={() => {
                          onClose();
                          onPressAuthor(item.authorId);
                        }}
                        style={styles.avatarPressable}
                      >
                        <View style={[styles.avatar, { backgroundColor: avatarColor(item.authorTag) }]}>
                          <Text style={styles.avatarText}>{item.authorName.charAt(0).toUpperCase()}</Text>
                        </View>
                      </Pressable>

                      <View style={styles.commentMain}>
                        <View style={styles.commentHeaderRow}>
                          <Text
                            onPress={() => {
                              onClose();
                              onPressAuthor(item.authorId);
                            }}
                            style={styles.commentAuthor}
                          >
                            {item.authorName}
                          </Text>
                          <Text style={styles.commentTime}>{relativeTime(item.createdAt)}</Text>
                        </View>

                        <Text style={styles.commentText}>{item.text}</Text>

                        <View style={styles.commentActionsRow}>
                          <Pressable
                            onPress={() => setText(`@${item.authorName} `)}
                            hitSlop={6}
                          >
                            <Text style={styles.replyButtonText}>Yanıtla</Text>
                          </Pressable>

                          {item.isMe ? (
                            <Pressable onPress={() => handleDelete(item.id)} hitSlop={6}>
                              <Text style={styles.deleteButtonText}>Sil</Text>
                            </Pressable>
                          ) : (
                            <Pressable onPress={() => handleReport(item.id)} hitSlop={6}>
                              <Text style={styles.reportButtonText}>Şikayet Et</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>

                      {/* Right Heart Like Button */}
                      <Pressable
                        onPress={() => toggleCommentLike(item.id)}
                        style={styles.commentLikeBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={isLiked ? 'heart' : 'heart-outline'}
                          size={14}
                          color={isLiked ? '#EF4444' : TEXT_MUTED}
                        />
                        {isLiked && <Text style={styles.commentLikeCount}>1</Text>}
                      </Pressable>
                    </View>
                  );
                }}
              />
            )}

            {/* Quick Emoji Reaction Bar (Instagram Style) */}
            <View style={styles.quickEmojiBar}>
              {QUICK_EMOJIS.map((emoji, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleQuickEmoji(emoji)}
                  style={styles.emojiBtn}
                  hitSlop={4}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Input Bar */}
            <View style={styles.inputBarContainer}>
              <View style={[styles.selfAvatarSmall, { backgroundColor: '#27272A' }]}>
                <Ionicons name="person" size={14} color={TEXT_MUTED} />
              </View>

              <TextInput
                value={text}
                onChangeText={(t) => setText(t.slice(0, MAX_COMMENT_LENGTH))}
                placeholder="Bunun hakkında ne düşünüyorsun?..."
                placeholderTextColor={TEXT_MUTED}
                style={styles.inputField}
                multiline
              />

              {text.trim().length > 0 && (
                <Pressable
                  onPress={handleSend}
                  disabled={sending}
                  style={styles.sendButton}
                  hitSlop={8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={GOLD} />
                  ) : (
                    <Text style={styles.sendButtonText}>Paylaş</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetWrap: {
    maxHeight: '75%',
    width: '100%',
  },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 10,
    justifyContent: 'center',
    padding: 4,
  },
  loadingWrap: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 340,
    minHeight: 120,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarPressable: {
    paddingTop: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  commentMain: {
    flex: 1,
    gap: 3,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentTime: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#E4E4E7',
  },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 2,
  },
  replyButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  deleteButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EF4444',
  },
  reportButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  commentLikeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 2,
    minWidth: 20,
  },
  commentLikeCount: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  quickEmojiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 20,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  selfAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    minHeight: 36,
    maxHeight: 90,
    backgroundColor: '#27272A',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#FFFFFF',
  },
  sendButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sendButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
