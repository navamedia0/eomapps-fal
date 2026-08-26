export async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    console.warn('Birincil yapay zeka sağlayıcısı başarısız oldu, yedek sağlayıcıya geçiliyor:', err);
    return fallback();
  }
}
