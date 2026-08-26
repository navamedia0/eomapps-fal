import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

export type ImageShareOutcome = 'shared' | 'downloaded' | 'unavailable';

export async function shareImageUri(uri: string, fileName = 'mistik-rehber.png'): Promise<ImageShareOutcome> {
  if (Platform.OS !== 'web') {
    const available = await Sharing.isAvailableAsync();
    if (!available) return 'unavailable';
    try {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Görseli Paylaş' });
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }

  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: 'Mistik Rehber' });
      return 'shared';
    }
  } catch {
    // fall through to download
  }

  try {
    const link = document.createElement('a');
    link.href = uri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return 'downloaded';
  } catch {
    return 'unavailable';
  }
}
