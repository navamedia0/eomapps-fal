import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kesif_salonu_best_wave';

export async function getLocalBestWave(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export async function setLocalBestWaveIfHigher(wave: number): Promise<number> {
  const current = await getLocalBestWave();
  if (wave <= current) return current;
  await AsyncStorage.setItem(KEY, String(wave));
  return wave;
}
