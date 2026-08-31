import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Modal,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { enableScreenProtection, disableScreenProtection } from '@/services/screenProtection';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import {
  getThread,
  sendMessage,
  markViewOnceOpened,
  type DMMessage,
} from '@/services/messages';
import { relativeTime } from '@/utils/relativeTime';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DMThread'>;

const MAX_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 4000;

export default function DMThreadScreen({ route, navigation }: Props) {
  const { userId, displayName } = route.params;
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeViewingImage, setActiveViewingImage] = useState<{ uri: string; messageId?: string; isOnce?: boolean } | null>(null);
  
  const scrollRef = useRef<ScrollView>(null);

  // Ekran görüntüsü (SS) ve kayıt engelleyici (Güvenli Fallback ile)
  useEffect(() => {
    enableScreenProtection();
    return () => {
      disableScreenProtection();
    };
  }, []);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    getThread(userId)
      .then((items) => {
        setMessages(items);
        setError(false);
      })
      .catch(() => {
        if (!silent) setError(true);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('İzin gerekli', 'Fotoğraf eklemek için galeri erişimine izin vermelisin.');
      return;
    }
    // Sadece Fotoğraf - Video Yok
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setSelectedImage(res.assets[0].uri);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!text.trim() && !selectedImage) return;
    const body = text.trim();
    const imgUri = selectedImage;
    const viewOnceFlag = isViewOnce;
    
    setText('');
    setSelectedImage(null);
    setIsViewOnce(false);
    setSending(true);

    try {
      const message = await sendMessage(userId, body, {
        imageUri: imgUri ?? undefined,
        viewOnce: viewOnceFlag,
      });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      setText(body);
      setSelectedImage(imgUri);
      setIsViewOnce(viewOnceFlag);
    } finally {
      setSending(false);
    }
  }, [userId, text, selectedImage, isViewOnce]);

  const openViewOnce = useCallback(async (msg: DMMessage) => {
    if (msg.viewed) {
      showAlert('Süresi Doldu', 'Bu tek seferlik fotoğraf daha önce açılmış.');
      return;
    }
    if (!msg.imageUri) return;
    setActiveViewingImage({ uri: msg.imageUri, messageId: msg.id, isOnce: true });
    await markViewOnceOpened(msg.id);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, viewed: true } : m)));
  }, []);

  const closeImageViewer = useCallback(() => {
    setActiveViewingImage(null);
  }, []);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Güvenlik & 24 Saat Bilgi Şeridi */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={14} color={GOLD} />
          <Text style={styles.securityBannerText}>
            Uçtan uca gizli · Mesajlar 24 saat sonra otomatik silinir · Ekran görüntüsü alınamaz
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.centerWrap}>
            <Text style={styles.errorText}>Mesajlar yüklenemedi.</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryText}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={GOLD_SOFT} />
                <Text style={styles.emptyText}>Henüz mesaj yok.</Text>
                <Text style={styles.emptyHint}>Sohbeti başlatmak için bir mesaj ya da fotoğraf gönder.</Text>
              </View>
            ) : (
              messages.map((m) => {
                const isMine = m.fromMe;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.bubbleRow,
                      isMine ? styles.bubbleRowMine : styles.bubbleRowOther,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isMine ? styles.bubbleMine : styles.bubbleOther,
                      ]}
                    >
                      {/* Tek Gönderimlik Fotoğraf */}
                      {m.viewOnce ? (
                        <Pressable
                          onPress={() => openViewOnce(m)}
                          style={[
                            styles.viewOnceBox,
                            m.viewed && styles.viewOnceBoxViewed,
                          ]}
                        >
                          <View style={styles.viewOnceIconCircle}>
                            <MaterialCommunityIcons
                              name={m.viewed ? 'numeric-1-circle-outline' : 'numeric-1-circle'}
                              size={20}
                              color={m.viewed ? TEXT_MUTED : GOLD}
                            />
                          </View>
                          <Text style={[styles.viewOnceText, m.viewed && styles.viewOnceTextViewed]}>
                            {m.viewed ? 'Fotoğraf açıldı' : 'Tek seferlik fotoğraf'}
                          </Text>
                        </Pressable>
                      ) : m.imageUri ? (
                        /* Normal Fotoğraf */
                        <Pressable
                          onPress={() => setActiveViewingImage({ uri: m.imageUri! })}
                          style={styles.imageWrap}
                        >
                          <Image source={{ uri: m.imageUri }} style={styles.chatImage} resizeMode="cover" />
                        </Pressable>
                      ) : null}

                      {/* Metin İçeriği */}
                      {m.text ? (
                        <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
                          {m.text}
                        </Text>
                      ) : null}

                      <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
                        {relativeTime(m.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Seçili Fotoğraf Önizleme */}
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.previewActions}>
              <Pressable
                onPress={() => setIsViewOnce((v) => !v)}
                style={[styles.viewOnceToggle, isViewOnce && styles.viewOnceToggleActive]}
              >
                <MaterialCommunityIcons
                  name={isViewOnce ? 'numeric-1-circle' : 'numeric-1-circle-outline'}
                  size={18}
                  color={isViewOnce ? '#1a0d33' : GOLD}
                />
                <Text style={[styles.viewOnceToggleText, isViewOnce && styles.viewOnceToggleTextActive]}>
                  {isViewOnce ? '1 Tek Seferlik' : 'Normal Foto'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setSelectedImage(null)} style={styles.removeImageBtn} hitSlop={6}>
                <Ionicons name="close-circle" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Mesaj Yazma Giriş Alanı */}
        <View style={styles.inputRow}>
          <Pressable onPress={pickImage} style={styles.attachBtn} hitSlop={8}>
            <Ionicons name="image-outline" size={22} color={GOLD} />
          </Pressable>

          <TextInput
            value={text}
            onChangeText={(t) => setText(t.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Mesaj yaz... (24 saat sonra silinir)"
            placeholderTextColor={TEXT_MUTED}
            multiline
            style={styles.input}
          />

          <Pressable
            onPress={handleSend}
            disabled={sending || (!text.trim() && !selectedImage)}
            style={[
              styles.sendButton,
              (sending || (!text.trim() && !selectedImage)) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#1a0d33" size="small" />
            ) : (
              <Ionicons name="send" size={17} color="#1a0d33" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Güvenli Tam Ekran Fotoğraf Görüntüleyici */}
      {activeViewingImage && (
        <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.fullscreenModal}>
            <Pressable onPress={closeImageViewer} style={styles.closeModalBtn} hitSlop={10}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
            <Image
              source={{ uri: activeViewingImage.uri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            {activeViewingImage.isOnce && (
              <View style={styles.onceNoticePill}>
                <MaterialCommunityIcons name="numeric-1-circle" size={16} color={GOLD} />
                <Text style={styles.onceNoticeText}>Tek seferlik fotoğraf · Kapatıldığında silinir</Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 30, 32, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 201, 60, 0.2)',
  },
  securityBannerText: {
    fontSize: 11,
    color: GOLD_SOFT,
    fontWeight: '600',
    textAlign: 'center',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 201, 60, 0.15)',
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryText: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyHint: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: 'rgba(217, 119, 6, 0.92)',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'rgba(38, 24, 70, 0.95)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFF',
  },
  bubbleTextOther: {
    color: TEXT_PRIMARY,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bubbleTimeOther: {
    color: TEXT_MUTED,
  },
  imageWrap: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chatImage: {
    width: '100%',
    height: '100%',
  },
  viewOnceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  viewOnceBoxViewed: {
    opacity: 0.6,
  },
  viewOnceIconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOnceText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
  },
  viewOnceTextViewed: {
    color: TEXT_MUTED,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 30, 32, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 201, 60, 0.2)',
    gap: 12,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewOnceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    borderWidth: 1,
    borderColor: GOLD,
  },
  viewOnceToggleActive: {
    backgroundColor: GOLD,
  },
  viewOnceToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  viewOnceToggleTextActive: {
    color: '#1a0d33',
  },
  removeImageBtn: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 32, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 201, 60, 0.2)',
    gap: 8,
  },
  attachBtn: {
    padding: 6,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(38, 24, 70, 0.9)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    maxHeight: 90,
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
    opacity: 0.4,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  onceNoticePill: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 30, 32, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD,
  },
  onceNoticeText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '700',
  },
});
