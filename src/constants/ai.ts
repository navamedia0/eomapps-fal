export const AI_MODELS = {
  // "flash-lite" modelleri ücretsiz katmanda çok daha yüksek günlük kotaya sahip
  // (gemini-3.6-flash: günde sadece 20 istek; flash-lite: çok daha yüksek).
  geminiText: 'gemini-3.1-flash-lite',
  geminiVision: 'gemini-3.1-flash-lite',
  groq: 'llama-3.3-70b-versatile',
  cerebras: 'gpt-oss-120b',
} as const;