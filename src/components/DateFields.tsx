import { View, TextInput, StyleSheet } from 'react-native';
import { GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const numeric = (value: string) => value.replace(/[^0-9]/g, '');

type Props = {
  day: string;
  month: string;
  year: string;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
};

export default function DateFields({ day, month, year, onDayChange, onMonthChange, onYearChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          value={day}
          onChangeText={(v) => onDayChange(numeric(v).slice(0, 2))}
          placeholder="GG"
          placeholderTextColor={TEXT_MUTED}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.input, styles.half]}
        />
        <TextInput
          value={month}
          onChangeText={(v) => onMonthChange(numeric(v).slice(0, 2))}
          placeholder="AA"
          placeholderTextColor={TEXT_MUTED}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.input, styles.half]}
        />
      </View>
      <TextInput
        value={year}
        onChangeText={(v) => onYearChange(numeric(v).slice(0, 4))}
        placeholder="YYYY"
        placeholderTextColor={TEXT_MUTED}
        keyboardType="number-pad"
        maxLength={4}
        style={[styles.input, styles.full]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  half: {
    width: '48%',
  },
  full: {
    width: '100%',
  },
});
