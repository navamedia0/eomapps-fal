import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import PickerModal from '@/components/PickerModal';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  label: string;
  placeholder: string;
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function PickerField({ label, placeholder, value, options, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, !value && styles.buttonPlaceholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={disabled ? TEXT_MUTED : GOLD} />
      </Pressable>
      <PickerModal
        visible={open}
        title={label}
        options={options}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    flexShrink: 1,
  },
  buttonPlaceholder: {
    color: TEXT_MUTED,
  },
});
