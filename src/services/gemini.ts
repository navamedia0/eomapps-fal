import { AI_MODELS } from '@/constants/ai';
import { env } from '@/config/env';
import { postJson } from '@/services/http';

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
type ImagePart = { mimeType: string; data: string };

const extractText = (result: GeminiResponse): string => {
  const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!text) throw new Error('Gemini bos bir yanit dondu.');
  return text;
};

async function callProxy(model: string, payload: unknown): Promise<GeminiResponse> {
  const appSecret = env.appSecret();
  return postJson<GeminiResponse>(
    env.aiProxyUrl(),
    { provider: 'gemini', model, payload },
    appSecret ? { 'X-App-Secret': appSecret } : {},
  );
}

export async function askGemini(prompt: string, model = AI_MODELS.geminiText): Promise<string> {
  const result = await callProxy(model, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return extractText(result);
}

export type ChatTurn = { role: 'user' | 'model'; text: string };

export async function askGeminiChat(
  systemPrompt: string,
  history: ChatTurn[],
  model = AI_MODELS.geminiText,
): Promise<string> {
  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Anladım, hazırım.' }] },
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
  ];
  const result = await callProxy(model, { contents });
  return extractText(result);
}

export async function askGeminiVision(prompt: string, images: ImagePart[]): Promise<string> {
  const result = await callProxy(AI_MODELS.geminiVision, {
    contents: [{ role: 'user', parts: [{ text: prompt }, ...images.map((image) => ({ inline_data: { mime_type: image.mimeType, data: image.data } }))] }],
  });
  return extractText(result);
}

export async function askGeminiAudio(prompt: string, audioBase64: string, mimeType: string): Promise<string> {
  const result = await callProxy(AI_MODELS.geminiVision, {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: audioBase64 } }],
      },
    ],
  });
  return extractText(result);
}
