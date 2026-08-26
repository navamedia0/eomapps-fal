import { prompts } from '@/prompts';
import { askGemini, askGeminiChat, askGeminiVision, askGeminiAudio, type ChatTurn } from '@/services/gemini';
import { askCloudflare, askCloudflareChat, askCloudflareVision } from '@/services/cloudflare';
import { withFallbackChain } from '@/services/aiFallback';
import { guardReadingCooldown } from '@/services/aiQueue';
import { tarotReadingType } from '@/constants/aiQueue';
import type { TarotCard } from '@/services/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import type { KatinaCard } from '@/services/katina';
import { getKatinaMeaning } from '@/services/katinaMeanings';
import { findDreamMatches } from '@/services/dreamMeanings';
import { getCoffeeSymbolGlossary } from '@/services/coffeeSymbols';
import { getPalmistryGlossary } from '@/services/palmistry';
import { getProfileSummary } from '@/services/profile';
import { turkishUpperCase } from '@/utils/turkishCase';

async function buildProfileBlock(): Promise<string> {
  const summary = await getProfileSummary();
  if (!summary) return '';
  return `\n\nKullanıcı hakkında (yalnızca senin özümsemen için — asla doğrudan alıntılama veya "bana anlattığına göre" gibi ifadelerle atıfta bulunma; yorumuna sessizce sızdır):\n${summary}`;
}

export async function interpretTarotSpread(cards: TarotCard[], positions: string[]): Promise<string> {
  const cardText = cards
    .map((card, index) => {
      const meaning = getTarotMeaning(card.id);
      const orientationLabel = card.orientation === 'reversed' ? 'ters' : 'düz';
      const reference = meaning
        ? card.orientation === 'reversed'
          ? meaning.reversed || meaning.upright
          : meaning.upright
        : null;
      const referenceLine = reference ? `\n   Klasik anlamı (esin için, birebir kopyalama): ${reference}` : '';
      return `${positions[index]}: ${card.name} (${orientationLabel})${referenceLine}`;
    })
    .join('\n');
  const headerList = [...positions.map((position) => `"${turkishUpperCase(position)}:"`), '"GENEL YORUM:"'].join(', ');
  const formatInstruction = `Yanıtını ${positions.length + 1} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}. Başlıklar dışında yıldız, madde işareti veya numaralandırma kullanma. Her kart için verilen "klasik anlamı" satırını doğrudan kopyalama; onu yalnızca ilham kaynağı olarak kullanıp kendi akıcı ve edebi üslubunla yeniden anlat. Son bölüm olan "GENEL YORUM:", kartları tek tek tekrar etmeden hepsinin birlikte anlattığı hikayeyi, aralarındaki uyumu ya da çelişkiyi ve genel bir sonucu 3-4 cümlede özetlemeli — bu, ayrı kart yorumlarından bağımsız, açılımın bütününe dair kapanış niteliğinde olmalı.`;
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.tarotSpread(positions)}\n${formatInstruction}\n\nKartlar:\n${cardText}${profileBlock}`;
  const readingType = tarotReadingType(cards.length);
  await guardReadingCooldown(readingType);
  return withFallbackChain([() => askGemini(prompt, undefined, readingType), () => askCloudflare(prompt)]);
}

export async function interpretSolitaireSpread(cards: KatinaCard[]): Promise<string> {
  const cardText = cards
    .map((card) => {
      const meaning = getKatinaMeaning(card.id);
      return meaning ? `${card.name} (esin için: ${meaning})` : card.name;
    })
    .join(', ');
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.solitaireSpread(cards.map((card) => card.name))}\n\nAçılan kartlar ve klasik anlamları (esin için, birebir kopyalama):\n${cardText}${profileBlock}`;
  await guardReadingCooldown('solitaire');
  return withFallbackChain([() => askGemini(prompt, undefined, 'solitaire'), () => askCloudflare(prompt)]);
}

export async function interpretKatinaSpread(cards: KatinaCard[], positions: string[]): Promise<string> {
  const cardText = cards
    .map((card, index) => {
      const meaning = getKatinaMeaning(card.id);
      const referenceLine = meaning ? `\n   Klasik anlamı (esin için, birebir kopyalama): ${meaning}` : '';
      return `${positions[index]}: ${card.name}${referenceLine}`;
    })
    .join('\n');
  const headerList = positions.map((position) => `"${turkishUpperCase(position)}:"`).join(', ');
  const formatInstruction = `Yanıtını ${positions.length} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}. Başlıklar dışında yıldız, madde işareti veya numaralandırma kullanma. Her kart için verilen "klasik anlamı" satırını doğrudan kopyalama; onu yalnızca ilham kaynağı olarak kullanıp kendi akıcı ve edebi üslubunla yeniden anlat.`;
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.katinaSpread(positions)}\n${formatInstruction}\n\nKartlar:\n${cardText}${profileBlock}`;
  await guardReadingCooldown('katina');
  return withFallbackChain([() => askGemini(prompt, undefined, 'katina'), () => askCloudflare(prompt)]);
}

export async function interpretDreamChat(history: ChatTurn[]): Promise<string> {
  const lastUserTurn = [...history].reverse().find((turn) => turn.role === 'user');
  const matches = lastUserTurn ? findDreamMatches(lastUserTurn.text) : [];

  const referenceBlock = matches.length
    ? `\n\nArka plan bilgisi (yalnızca senin özümsemen için — kaynak etiketlerini ya da bu listeyi kullanıcıya asla gösterme, tek bir bütünsel yoruma karıştır):\n${matches
        .map((match) => `- (${match.source === 'folk' ? 'halk' : 'psikanaliz'}) ${match.word}: ${match.meaning}`)
        .join('\n')}`
    : '';

  const profileBlock = await buildProfileBlock();
  const systemPrompt = `${prompts.dreamChat}${referenceBlock}${profileBlock}`;
  return withFallbackChain([() => askGeminiChat(systemPrompt, history), () => askCloudflareChat(systemPrompt, history)]);
}

export async function interpretDailyZodiac(signName: string): Promise<string> {
  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.dailyZodiac(signName, dateLabel)}${profileBlock}`;
  return withFallbackChain([() => askGemini(prompt), () => askCloudflare(prompt)]);
}

export async function interpretBirthChart(sunSign: string, moonSign: string, risingSign: string): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.birthChart(sunSign, moonSign, risingSign)}${profileBlock}`;
  return withFallbackChain([() => askGemini(prompt), () => askCloudflare(prompt)]);
}

export async function interpretZodiacCompatibility(signAName: string, signBName: string): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.zodiacCompatibility(signAName, signBName)}${profileBlock}`;
  return withFallbackChain([() => askGemini(prompt), () => askCloudflare(prompt)]);
}

export async function interpretNumerology(
  name: string,
  lifePathNumber: number,
  nameNumber: number,
): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.numerology(name, lifePathNumber, nameNumber)}${profileBlock}`;
  return withFallbackChain([() => askGemini(prompt), () => askCloudflare(prompt)]);
}

export async function interpretVoiceReading(audioBase64: string, mimeType: string): Promise<string> {
  await guardReadingCooldown('sesli');
  // No Cloudflare fallback here — llama-3.2-11b-vision-instruct doesn't
  // accept audio input, only text and a single image.
  return askGeminiAudio(prompts.voiceReading, audioBase64, mimeType, 'sesli');
}

export async function interpretImages(
  kind: 'coffee' | 'palm',
  images: Array<{ mimeType: string; data: string }>,
): Promise<string> {
  if (images.length === 0) throw new Error('En az bir görsel gerekli.');
  const glossary = kind === 'coffee' ? getCoffeeSymbolGlossary() : getPalmistryGlossary();
  const prompt = kind === 'coffee' ? prompts.coffee(glossary) : prompts.palm(glossary);
  const readingType = kind === 'coffee' ? 'kahve' : 'el';
  await guardReadingCooldown(readingType);
  return withFallbackChain([
    () => askGeminiVision(prompt, images, readingType),
    // Cloudflare's vision model only takes one image per call — the first
    // photo is enough context for a fallback pass when Gemini is down.
    () => askCloudflareVision(prompt, images[0].data),
  ]);
}

export async function validateImage(kind: 'coffee' | 'palm', image: { mimeType: string; data: string }): Promise<boolean> {
  const prompt = kind === 'coffee' ? prompts.coffeeValidation : prompts.palmValidation;
  const response = await askGeminiVision(prompt, [image]);
  return response.trim().toLocaleUpperCase('tr').startsWith('EVET');
}
