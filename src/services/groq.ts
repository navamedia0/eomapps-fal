import { AI_MODELS } from '@/constants/ai';
import { env } from '@/config/env';
import { postJson } from '@/services/http';

type GroqResponse = { choices?: Array<{ message?: { content?: string } }> };

export async function askGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const appSecret = env.appSecret();
  const result = await postJson<GroqResponse>(
    env.aiProxyUrl(),
    {
      provider: 'groq',
      payload: {
        model: AI_MODELS.groq,
        temperature: 0.75,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      },
    },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
  const text = result.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq bos bir yanit dondu.');
  return text;
}
