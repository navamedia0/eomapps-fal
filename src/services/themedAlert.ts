export type ThemedAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type ThemedAlertRequest = {
  title: string;
  message?: string;
  buttons: ThemedAlertButton[];
};

type Listener = (request: ThemedAlertRequest | null) => void;

let listener: Listener | null = null;

// ThemedAlertHost (App kökünde tek sefer monte edilir) burayı dinler.
// RN'in kendi Alert.alert()'ü OS'un beyaz varsayılan diyaloğunu açıyor —
// uygulamanın koyu/altın temasıyla uyuşmuyor, bu yüzden aynı imzayla
// (başlık, mesaj, butonlar) çalışan temalı bir eşdeğer.
export function registerThemedAlertHost(l: Listener | null): void {
  listener = l;
}

export function showAlert(title: string, message?: string, buttons?: ThemedAlertButton[]): void {
  const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'Tamam' }];
  listener?.({ title, message, buttons: finalButtons });
}
