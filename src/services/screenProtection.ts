/**
 * Güvenli Ekran Görüntüsü Koruma Yardımcısı
 * Expo Go veya yerel modülü derlenmemiş ortamlarda çökme yaşanmaması için
 * try-catch ve dinamik çağrı ile güvenli çalışır.
 */

export async function enableScreenProtection(): Promise<void> {
  try {
    const ScreenCapture = require('expo-screen-capture');
    if (ScreenCapture && typeof ScreenCapture.preventScreenCaptureAsync === 'function') {
      await ScreenCapture.preventScreenCaptureAsync();
    }
  } catch {
    // Yerel modül mevcut değilse sessizce geç
  }
}

export async function disableScreenProtection(): Promise<void> {
  try {
    const ScreenCapture = require('expo-screen-capture');
    if (ScreenCapture && typeof ScreenCapture.allowScreenCaptureAsync === 'function') {
      await ScreenCapture.allowScreenCaptureAsync();
    }
  } catch {
    // Yerel modül mevcut değilse sessizce geç
  }
}
