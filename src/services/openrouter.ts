import { env } from '@/config/env';
import { postJson } from '@/services/http';
import type { ChatTurn } from '@/services/gemini';
import { extractOpenAiText, buildVisionMessage, type ChatMessage, type OpenAiCompatResponse } from '@/services/openAiCompat';

// 3rd fallback layer (after Gemini and Cloudflare Workers AI) — OpenRouter,
// routed server-side through a handful of free vision-capable models so a
// single model's shared-pool congestion doesn't sink this whole layer.
async function callProxy(messages: ChatMessage[]): Promise<OpenAiCompatResponse> {
  const appSecret = env.appSecret();
  return postJson<OpenAiCompatResponse>(
    env.aiProxyUrl(),
    { provider: 'openrouter', payload: { messages } },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
}

export async function askOpenRouter(prompt: string): Promise<string> {
  const result = await callProxy([{ role: 'user', content: prompt }]);
  return extractOpenAiText(result);
}

export async function askOpenRouterChat(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({ role: (turn.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user', content: turn.text })),
  ];
  const result = await callProxy(messages);
  return extractOpenAiText(result);
}

export async function askOpenRouterVision(prompt: string, images: Array<{ mimeType: string; data: string }>): Promise<string> {
  const result = await callProxy([buildVisionMessage(prompt, images)]);
  return extractOpenAiText(result);
}
