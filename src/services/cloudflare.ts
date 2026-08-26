import { env } from '@/config/env';
import { postJson } from '@/services/http';
import type { ChatTurn } from '@/services/gemini';

type CloudflareResponse = { response?: string };

async function callProxy(payload: unknown): Promise<CloudflareResponse> {
  const appSecret = env.appSecret();
  return postJson<CloudflareResponse>(
    env.aiProxyUrl(),
    { provider: 'cloudflare', payload },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
}

function extractText(result: CloudflareResponse): string {
  const text = result.response?.trim();
  if (!text) throw new Error('Cloudflare AI bos bir yanit dondu.');
  return text;
}

export async function askCloudflare(prompt: string): Promise<string> {
  const result = await callProxy({ messages: [{ role: 'user', content: prompt }] });
  return extractText(result);
}

export async function askCloudflareChat(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({ role: turn.role === 'model' ? 'assistant' : 'user', content: turn.text })),
  ];
  const result = await callProxy({ messages });
  return extractText(result);
}

// Single-image vision fallback — the model only accepts one image per call,
// so multi-photo readings (coffee/palm) are sent as one combined request per
// image and the caller stitches results together if it needs more than one.
export async function askCloudflareVision(prompt: string, imageBase64: string): Promise<string> {
  const result = await callProxy({ prompt, imageBase64 });
  return extractText(result);
}
