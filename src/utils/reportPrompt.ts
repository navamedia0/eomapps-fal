import { Alert } from 'react-native';

const REPORT_REASONS = ['Spam', 'Uygunsuz içerik', 'Taciz veya nefret söylemi', 'Diğer'];

export function promptReport(onSelect: (reason: string) => void): void {
  Alert.alert('İçeriği şikayet et', 'Bu içeriği neden şikayet ediyorsun?', [
    ...REPORT_REASONS.map((reason) => ({ text: reason, onPress: () => onSelect(reason) })),
    { text: 'Vazgeç', style: 'cancel' as const },
  ]);
}
