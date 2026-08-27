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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { PersonInfo } from '@/types/personInfo';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_DEEP,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_CAPTION,
} from '@/theme/colors';

type Props = {
  visible: boolean;
  initialInfo?: PersonInfo | null;
  onSave: (info: PersonInfo) => void;
  onClose: () => void;
};

const GENDERS = ['Kadın', 'Erkek', 'Belirtmek İstemiyorum'];

const RELATIONSHIP_STATUSES = [
  'Bekar',
  'İlişkisi Var',
  'Evli',
  'Karmaşık',
  'Nişanlı / Sözlü',
  'Platonik',
];

const OCCUPATION_STATUSES = [
  'Çalışıyor',
  'Öğrenci',
  'Serbest Meslek',
  'Ev Hanımı',
  'Çalışmıyor',
];

const FOCUS_AREAS = [
  'Genel Yorum',
  'Aşk & İlişki',
  'Kariyer & Para',
  'Gelecek & Yol',
];

export default function PersonInfoModal({
  visible,
  initialInfo,
  onSave,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [relationshipStatus, setRelationshipStatus] = useState<string | undefined>(undefined);
  const [occupationStatus, setOccupationStatus] = useState<string | undefined>(undefined);
  const [focusArea, setFocusArea] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      setName(initialInfo?.name ?? '');
      setAge(initialInfo?.age ?? '');
      setGender(initialInfo?.gender);
      setRelationshipStatus(initialInfo?.relationshipStatus);
      setOccupationStatus(initialInfo?.occupationStatus);
      setFocusArea(initialInfo?.focusArea ?? 'Genel Yorum');
    }
  }, [visible, initialInfo]);

  const handleSave = () => {
    const trimmedName = name.trim();
    const info: PersonInfo = {
      name: trimmedName,
      age: age.trim() || undefined,
      gender,
      relationshipStatus,
      occupationStatus,
      focusArea,
    };
    onSave(info);
    onClose();
  };

  const handleClear = () => {
    setName('');
    setAge('');
    setGender(undefined);
    setRelationshipStatus(undefined);
    setOccupationStatus(undefined);
    setFocusArea('Genel Yorum');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Başlık */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="person-circle-outline" size={24} color={GOLD} />
              <Text style={styles.title}>Fal Sahibi Bilgileri</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Fincanındaki sembollerin senin hayatına, ilişkine ve hedeflerine özel yorumlanması için bilgileri gir.
          </Text>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* İsim ve Yaş Girişi */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>İsim / Rumuz</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Örn: Deniz"
                  placeholderTextColor={TEXT_CAPTION}
                  style={styles.textInput}
                  maxLength={30}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Yaş</Text>
                <TextInput
                  value={age}
                  onChangeText={(val) => setAge(val.replace(/[^0-9]/g, ''))}
                  placeholder="Örn: 27"
                  placeholderTextColor={TEXT_CAPTION}
                  style={styles.textInput}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Cinsiyet */}
            <View style={styles.section}>
              <Text style={styles.label}>Cinsiyet</Text>
              <View style={styles.chipsWrap}>
                {GENDERS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setGender(gender === item ? undefined : item)}
                    style={[styles.chip, gender === item && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, gender === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* İlişki Durumu */}
            <View style={styles.section}>
              <Text style={styles.label}>İlişki Durumu</Text>
              <View style={styles.chipsWrap}>
                {RELATIONSHIP_STATUSES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setRelationshipStatus(relationshipStatus === item ? undefined : item)}
                    style={[styles.chip, relationshipStatus === item && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        relationshipStatus === item && styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Çalışma / Meslek Durumu */}
            <View style={styles.section}>
              <Text style={styles.label}>Çalışma / Meslek Durumu</Text>
              <View style={styles.chipsWrap}>
                {OCCUPATION_STATUSES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setOccupationStatus(occupationStatus === item ? undefined : item)}
                    style={[styles.chip, occupationStatus === item && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        occupationStatus === item && styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Odaklanılan Konu */}
            <View style={styles.section}>
              <Text style={styles.label}>Falda Özellikle Odaklanılsın</Text>
              <View style={styles.chipsWrap}>
                {FOCUS_AREAS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setFocusArea(item)}
                    style={[styles.chip, focusArea === item && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        focusArea === item && styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Aksiyon Butonları */}
          <View style={styles.footer}>
            <Pressable onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Temizle</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <MaterialCommunityIcons name="check" size={18} color={NIGHT_DEEP} />
              <Text style={styles.saveBtnText}>Kaydet ve Devam Et</Text>
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
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(11, 10, 31, 0.75)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    color: TEXT_PRIMARY,
    fontSize: 13.5,
  },
  section: {
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.22)',
    borderRadius: 14,
  },
  chipActive: {
    backgroundColor: 'rgba(242, 200, 121, 0.28)',
    borderColor: GOLD,
  },
  chipText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  chipTextActive: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(242, 200, 121, 0.15)',
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  clearBtnText: {
    fontSize: 12.5,
    color: TEXT_CAPTION,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: NIGHT_DEEP,
  },
});
