// Shared request/response shapes for OpenAI-compatible chat completion APIs
// (OpenRouter and Hugging Face's router both speak this dialect) — keeps
// openrouter.ts/huggingface.ts thin wrappers around their own endpoint name
// and model choice.
export type ChatContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string | ChatContentPart[] };
export type OpenAiCompatResponse = { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };

export function extractOpenAiText(result: OpenAiCompatResponse): string {
  if (result.error?.message) throw new Error(result.error.message);
  const text = result.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Yapay zeka sağlayıcısı boş bir yanıt döndü.');
  return text;
}

export function buildVisionMessage(prompt: string, images: Array<{ mimeType: string; data: string }>): ChatMessage {
  return {
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      ...images.map((image) => ({
        type: 'image_url' as const,
        image_url: { url: `data:${image.mimeType};base64,${image.data}` },
      })),
    ],
  };
}
