// Tries each provider in order, only moving to the next once the current one
// throws — e.g. Gemini → Cloudflare Workers AI.
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
