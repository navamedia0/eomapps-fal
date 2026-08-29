import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PickerModal from '@/components/PickerModal';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MONTH_NAMES = [
  '01 - Ocak',
  '02 - Şubat',
  '03 - Mart',
  '04 - Nisan',
  '05 - Mayıs',
  '06 - Haziran',
  '07 - Temmuz',
  '08 - Ağustos',
  '09 - Eylül',
  '10 - Ekim',
  '11 - Kasım',
  '12 - Aralık',
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => String(currentYear - i));

type Props = {
  day: string;
  month: string;
  year: string;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
};

export default function DateFields({ day, month, year, onDayChange, onMonthChange, onYearChange }: Props) {
  const [modalType, setModalType] = useState<'day' | 'month' | 'year' | null>(null);

  // Ay numarasını etiketle eşleştir (örn: "03" -> "03 - Mart")
  const selectedMonthOption = month
    ? MONTH_NAMES.find((m) => m.startsWith(month.padStart(2, '0'))) || month
    : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {/* GÜN SEÇİCİ */}
        <View style={styles.col}>
          <Text style={styles.label}>Gün</Text>
          <Pressable onPress={() => setModalType('day')} style={styles.button}>
            <Text style={[styles.buttonText, !day && styles.buttonPlaceholder]} numberOfLines={1}>
              {day ? day.padStart(2, '0') : 'Gün'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={GOLD} />
          </Pressable>
        </View>

        {/* AY SEÇİCİ */}
        <View style={[styles.col, styles.colMonth]}>
          <Text style={styles.label}>Ay</Text>
          <Pressable onPress={() => setModalType('month')} style={styles.button}>
            <Text style={[styles.buttonText, !month && styles.buttonPlaceholder]} numberOfLines={1}>
              {selectedMonthOption ?? 'Ay'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={GOLD} />
          </Pressable>
        </View>

        {/* YIL SEÇİCİ */}
        <View style={styles.col}>
          <Text style={styles.label}>Yıl</Text>
          <Pressable onPress={() => setModalType('year')} style={styles.button}>
            <Text style={[styles.buttonText, !year && styles.buttonPlaceholder]} numberOfLines={1}>
              {year || 'Yıl'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={GOLD} />
          </Pressable>
        </View>
      </View>

      {/* MODALLAR */}
      <PickerModal
        visible={modalType === 'day'}
        title="Doğum Günü Seç"
        options={DAY_OPTIONS}
        selected={day ? day.padStart(2, '0') : null}
        onSelect={(val) => {
          onDayChange(val);
          setModalType(null);
        }}
        onClose={() => setModalType(null)}
      />

      <PickerModal
        visible={modalType === 'month'}
        title="Doğum Ayı Seç"
        options={MONTH_NAMES}
        selected={selectedMonthOption}
        onSelect={(val) => {
          const monthNumber = val.slice(0, 2);
          onMonthChange(monthNumber);
          setModalType(null);
        }}
        onClose={() => setModalType(null)}
      />

      <PickerModal
        visible={modalType === 'year'}
        title="Doğum Yılı Seç"
        options={YEAR_OPTIONS}
        selected={year || null}
        onSelect={(val) => {
          onYearChange(val);
          setModalType(null);
        }}
        onClose={() => setModalType(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  colMonth: {
    flex: 1.4,
  },
  label: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    fontWeight: '500',
    flexShrink: 1,
  },
  buttonPlaceholder: {
    color: TEXT_MUTED,
  },
});
