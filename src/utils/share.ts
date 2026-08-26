import { Platform, Share } from 'react-native';

export type ShareOutcome = 'shared' | 'copied' | 'unavailable';

export async function shareText(message: string): Promise<ShareOutcome> {
  if (Platform.OS !== 'web') {
    try {
      await Share.share({ message });
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: message });
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(message);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }

  return 'unavailable';
}
