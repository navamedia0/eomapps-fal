import { env } from '@/config/env';
import { postJson } from '@/services/http';
import type { ChatTurn } from '@/services/gemini';
import { extractOpenAiText, buildVisionMessage, type ChatMessage, type OpenAiCompatResponse } from '@/services/openAiCompat';

// 4th and last fallback layer — Hugging Face's router (Qwen2.5-VL), tried
// only once Gemini, Cloudflare Workers AI, and OpenRouter have all failed.
async function callProxy(messages: ChatMessage[]): Promise<OpenAiCompatResponse> {
  const appSecret = env.appSecret();
  return postJson<OpenAiCompatResponse>(
    env.aiProxyUrl(),
    { provider: 'huggingface', payload: { messages } },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
}

export async function askHuggingFace(prompt: string): Promise<string> {
  const result = await callProxy([{ role: 'user', content: prompt }]);
  return extractOpenAiText(result);
}

export async function askHuggingFaceChat(systemPrompt: string, history: ChatTurn[]): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({ role: (turn.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user', content: turn.text })),
  ];
  const result = await callProxy(messages);
  return extractOpenAiText(result);
}

export async function askHuggingFaceVision(prompt: string, images: Array<{ mimeType: string; data: string }>): Promise<string> {
  const result = await callProxy([buildVisionMessage(prompt, images)]);
  return extractOpenAiText(result);
}
