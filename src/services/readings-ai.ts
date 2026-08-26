import { prompts } from '@/prompts';
import { askGemini, askGeminiChat, askGeminiVision, askGeminiAudio, type ChatTurn } from '@/services/gemini';
import { askCerebras, askCerebrasChat } from '@/services/cerebras';
import { withFallback } from '@/services/aiFallback';
import type { TarotCard } from '@/services/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import type { KatinaCard } from '@/services/katina';
import { getKatinaMeaning } from '@/services/katinaMeanings';
import { findDreamMatches } from '@/services/dreamMeanings';
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
  const headerList = positions.map((position) => `"${turkishUpperCase(position)}:"`).join(', ');
  const formatInstruction = `Yanıtını ${positions.length} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}. Başlıklar dışında yıldız, madde işareti veya numaralandırma kullanma. Her kart için verilen "klasik anlamı" satırını doğrudan kopyalama; onu yalnızca ilham kaynağı olarak kullanıp kendi akıcı ve edebi üslubunla yeniden anlat.`;
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.tarotSpread(positions)}\n${formatInstruction}\n\nKartlar:\n${cardText}${profileBlock}`;
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
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
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
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
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
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
  return withFallback(
    () => askGeminiChat(systemPrompt, history),
    () => askCerebrasChat(systemPrompt, history),
  );
}

export async function interpretDailyZodiac(signName: string): Promise<string> {
  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.dailyZodiac(signName, dateLabel)}${profileBlock}`;
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
}

export async function interpretBirthChart(sunSign: string, moonSign: string, risingSign: string): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.birthChart(sunSign, moonSign, risingSign)}${profileBlock}`;
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
}

export async function interpretZodiacCompatibility(signAName: string, signBName: string): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.zodiacCompatibility(signAName, signBName)}${profileBlock}`;
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
}

export async function interpretNumerology(
  name: string,
  lifePathNumber: number,
  nameNumber: number,
): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.numerology(name, lifePathNumber, nameNumber)}${profileBlock}`;
  return withFallback(
    () => askGemini(prompt),
    () => askCerebras(prompt),
  );
}

export async function interpretVoiceReading(audioBase64: string, mimeType: string): Promise<string> {
  return askGeminiAudio(prompts.voiceReading, audioBase64, mimeType);
}

export async function interpretImages(
  kind: 'coffee' | 'palm',
  images: Array<{ mimeType: string; data: string }>,
): Promise<string> {
  if (images.length === 0) throw new Error('En az bir görsel gerekli.');
  return askGeminiVision(prompts[kind], images);
}

export async function validateImage(kind: 'coffee' | 'palm', image: { mimeType: string; data: string }): Promise<boolean> {
  const prompt = kind === 'coffee' ? prompts.coffeeValidation : prompts.palmValidation;
  const response = await askGeminiVision(prompt, [image]);
  return response.trim().toLocaleUpperCase('tr').startsWith('EVET');
}