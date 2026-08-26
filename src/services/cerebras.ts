import { AI_MODELS } from '@/constants/ai';
import { env } from '@/config/env';
import { postJson } from '@/services/http';
import type { ChatTurn } from '@/services/gemini';

type CerebrasResponse = { choices?: Array<{ message?: { content?: string } }> };

async function callCerebras(messages: Array<{ role: string; content: string }>): Promise<string> {
  const appSecret = env.appSecret();
  const result = await postJson<CerebrasResponse>(
    env.aiProxyUrl(),
    {
      provider: 'cerebras',
      payload: { model: AI_MODELS.cerebras, temperature: 0.75, messages },
    },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
  const text = result.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Cerebras bos bir yanit dondu.');
  return text;
}

export async function askCerebras(prompt: string): Promise<string> {
  return callCerebras([{ role: 'user', content: prompt }]);
}

export async function askCerebrasChat(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  return callCerebras([
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({ role: turn.role === 'model' ? 'assistant' : 'user', content: turn.text })),
  ]);
}
