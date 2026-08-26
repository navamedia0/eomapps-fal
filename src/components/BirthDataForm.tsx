import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import DateFields from '@/components/DateFields';
import PickerField from '@/components/PickerField';
import { TURKISH_CITIES } from '@/constants/turkishCities';
import { GOLD, GOLD_SOFT, TEXT_MUTED } from '@/theme/colors';

export type BirthFormValue = {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  unknownTime: boolean;
  cityIndex: number | null;
};

export const EMPTY_BIRTH_FORM: BirthFormValue = {
  day: '',
  month: '',
  year: '',
  hour: '',
  minute: '',
  unknownTime: false,
  cityIndex: null,
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const CITY_NAMES = TURKISH_CITIES.map((city) => city.name);

type Props = {
  value: BirthFormValue;
  onChange: (next: BirthFormValue) => void;
};

export default function BirthDataForm({ value, onChange }: Props) {
  const cityName = value.cityIndex !== null ? TURKISH_CITIES[value.cityIndex].name : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Doğum Tarihi</Text>
      <DateFields
        day={value.day}
        month={value.month}
        year={value.year}
        onDayChange={(day) => onChange({ ...value, day })}
        onMonthChange={(month) => onChange({ ...value, month })}
        onYearChange={(year) => onChange({ ...value, year })}
      />

      <Text style={styles.sectionLabel}>Doğum Saati</Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <PickerField
            label="Saat"
            placeholder="--"
            value={value.hour || null}
            options={HOUR_OPTIONS}
            onChange={(hour) => onChange({ ...value, hour })}
            disabled={value.unknownTime}
          />
        </View>
        <View style={styles.halfField}>
          <PickerField
            label="Dakika"
            placeholder="--"
            value={value.minute || null}
            options={MINUTE_OPTIONS}
            onChange={(minute) => onChange({ ...value, minute })}
            disabled={value.unknownTime}
          />
        </View>
      </View>

      <Pressable
        onPress={() => onChange({ ...value, unknownTime: !value.unknownTime })}
        style={styles.unknownToggle}
      >
        <Ionicons name={value.unknownTime ? 'checkbox' : 'square-outline'} size={18} color={GOLD} />
        <Text style={styles.unknownToggleText}>Doğum saatimi bilmiyorum</Text>
      </Pressable>
      {value.unknownTime && (
        <Text style={styles.hintText}>
          Saat bilinmeden hesaplama öğlen 12:00 varsayılarak yapılır; Yükselen burcun bu durumda kesin olmayabilir.
        </Text>
      )}

      <Text style={styles.sectionLabel}>Doğum Yeri</Text>
      <PickerField label="Şehir" placeholder="Şehir seç" value={cityName} options={CITY_NAMES} onChange={(name) => onChange({ ...value, cityIndex: CITY_NAMES.indexOf(name) })} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginBottom: 8,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48%',
  },
  unknownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  unknownToggleText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 8,
    lineHeight: 16,
  },
});
