export async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    console.warn('Birincil yapay zeka sağlayıcısı başarısız oldu, yedek sağlayıcıya geçiliyor:', err);
    return fallback();
  }
}

// Tries each provider in order, only moving to the next once the current one
// throws — used where there are 3+ fallback tiers (Gemini → Cerebras →
// Cloudflare Workers AI) instead of nesting withFallback calls.
export async function withFallbackChain<T>(providers: Array<() => Promise<T>>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < providers.length; i += 1) {
    try {
      return await providers[i]();
    } catch (err) {
      lastError = err;
      if (i < providers.length - 1) {
        console.warn(`Yapay zeka sağlayıcısı (${i + 1}/${providers.length}) başarısız, sıradakine geçiliyor:`, err);
      }
    }
  }
  throw lastError;
}
