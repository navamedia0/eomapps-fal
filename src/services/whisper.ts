import { env } from '@/config/env';
import { postJson } from '@/services/http';
import type { ReadingType } from '@/constants/aiQueue';

type WhisperResponse = { text?: string };

// Speech-to-text fallback used when Gemini's audio model (the only provider
// that understands raw audio) is rate-limited — turns the same recording
// into a transcript so the reading can still go through the normal
// text-based fallback chain instead of failing outright.
export async function transcribeAudio(audioBase64: string, readingType?: ReadingType): Promise<string> {
  const appSecret = env.appSecret();
  const result = await postJson<WhisperResponse>(
    env.aiProxyUrl(),
    { provider: 'whisper', payload: { audioBase64 }, readingType },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
  const text = result.text?.trim();
  if (!text) throw new Error('Ses metne çevrilemedi.');
  return text;
}
