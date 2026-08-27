import { prompts } from '@/prompts';
import { askGemini, askGeminiChat, askGeminiVision, askGeminiAudio, type ChatTurn } from '@/services/gemini';
import { askCloudflare, askCloudflareChat, askCloudflareVision } from '@/services/cloudflare';
import { askOpenRouter, askOpenRouterChat, askOpenRouterVision } from '@/services/openrouter';
import { askHuggingFace, askHuggingFaceChat, askHuggingFaceVision } from '@/services/huggingface';
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
import type { PersonInfo } from '@/types/personInfo';
import { getSavedPersonInfo } from '@/services/personInfo';
import { env } from '@/config/env';

async function buildProfileBlock(): Promise<string> {
  const summary = await getProfileSummary();
  const person = await getSavedPersonInfo();
  const parts: string[] = [];

  if (person) {
    const details: string[] = [];
    if (person.name) details.push(`İsim/Rumuz: ${person.name}`);
    if (person.age) details.push(`Yaş: ${person.age}`);
    if (person.gender) details.push(`Cinsiyet: ${person.gender}`);
    if (person.relationshipStatus) details.push(`İlişki Durumu: ${person.relationshipStatus}`);
    if (person.occupationStatus) details.push(`Çalışma/Meslek: ${person.occupationStatus}`);
    if (person.focusArea) details.push(`Falda Odaklanılan Konu: ${person.focusArea}`);
    if (details.length > 0) {
      parts.push(`Fal Sahibi Kişisel Bilgileri:\n${details.join('\n')}`);
    }
  }

  if (summary) {
    parts.push(`Kullanıcı Ruh Hali ve Notları:\n${summary}`);
  }

  if (parts.length === 0) return '';
  return `\n\nDanışan / Fal Sahibi hakkında arka plan bilgileri (yalnızca senin özümsemen ve kartları kişiye özel hissettirerek yorumlaman için — asla "verdiğin bilgilere göre" gibi mekanik ifadeler kullanma; sezgisel bir falcı gibi yorumuna sızdır):\n${parts.join('\n\n')}`;
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
  return withFallbackChain([
    () => askGemini(prompt, undefined, readingType),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
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
  return withFallbackChain([
    () => askGemini(prompt, undefined, 'solitaire'),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretKatinaSpread(cards: KatinaCard[], positions: string[]): Promise<string> {
  const cardText = cards
    .map((card, index) => {
      const meaning = getKatinaMeaning(card.id);
      const referenceLine = meaning ? `\n   Klasik anlamı (esin için, birebir kopyalama): ${meaning}` : '';
      return `${positions[index]}: ${card.name}${referenceLine}`;
    })
    .join('\n');
  const allPositions = [...positions, 'Genel Yorum'];
  const headerList = allPositions.map((position) => `"${turkishUpperCase(position)}:"`).join(', ');
  const formatInstruction = `Yanıtını ${allPositions.length} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}. Başlıklar dışında yıldız, madde işareti veya numaralandırma kullanma. Her kart için verilen "klasik anlamı" satırını doğrudan kopyalama; onu yalnızca ilham kaynağı olarak kullanıp kendi akıcı ve edebi üslubunla yeniden anlat. Son bölüm olan "GENEL YORUM:", Geçmiş, Şimdi ve Gelecek kartlarının birbiriyle uyumunu, oluşturdukları ortak hikayeyi ve kullanıcının hayatına/aşkına dair nihai çıkarımı derin, bilgece ve bütünsel bir sentezle özetlemeli.`;
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.katinaSpread(positions)}\n${formatInstruction}\n\nKartlar:\n${cardText}${profileBlock}`;
  await guardReadingCooldown('katina');
  return withFallbackChain([
    () => askGemini(prompt, undefined, 'katina'),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretDreamChat(history: ChatTurn[], mode: 'limited' | 'deep' = 'limited'): Promise<string> {
  const lastUserTurn = [...history].reverse().find((turn) => turn.role === 'user');
  const matches = lastUserTurn ? findDreamMatches(lastUserTurn.text) : [];

  const referenceBlock = matches.length
    ? `\n\nArka plan sembol bilgisi (yalnızca senin özümsemen için — kaynak etiketlerini ya da bu listeyi kullanıcıya asla gösterme, tek bir bütünsel yoruma karıştır):\n${matches
        .map((match) => `- (${match.source === 'folk' ? 'halk' : 'psikanaliz'}) ${match.word}: ${match.meaning}`)
        .join('\n')}`
    : '';

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.deepDreamAnalysis : prompts.dreamChat;
  const systemPrompt = `${basePrompt}${referenceBlock}${profileBlock}`;
  return withFallbackChain([
    () => askGeminiChat(systemPrompt, history),
    () => askCloudflareChat(systemPrompt, history),
    () => askOpenRouterChat(systemPrompt, history),
    () => askHuggingFaceChat(systemPrompt, history),
  ]);
}

export async function interpretDailyZodiac(signName: string): Promise<string> {
  // 1. Önce sunucu KV önbelleğini dene (tüm kullanıcılara aynı gün için aynı içerik, sıfır ek AI maliyeti)
  try {
    const proxyUrl = env.aiProxyUrl();
    const appSecret = env.appSecret();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (appSecret) headers['X-App-Secret'] = appSecret;

    const response = await fetch(`${proxyUrl}/daily-zodiac?sign=${encodeURIComponent(signName)}`, { headers });
    if (response.ok) {
      const data = await response.json();
      if (data?.reading) return String(data.reading);
    }
  } catch {
    // Sunucu erişilemezse doğrudan AI'ya düş
  }

  // 2. Yerel önbellek (cihaz cache – aynı gün için bir kez çekilen yorum)
  const { getCachedZodiacReading, setCachedZodiacReading } = await import('@/services/dailyZodiacCache');
  const zodiac = signName as import('@/services/zodiac').Zodiac;
  const cached = await getCachedZodiacReading(zodiac);
  if (cached) return cached;

  // 3. Son çare: Yapay Zekaya doğrudan sor
  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.dailyZodiac(signName, dateLabel)}${profileBlock}`;
  const reading = await withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);

  // Cihaz önbelleğine kaydet (aynı gün için bir daha AI isteği gitmesin)
  await setCachedZodiacReading(zodiac, reading);
  return reading;
}

export async function interpretBirthChart(sunSign: string, moonSign: string, risingSign: string): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.birthChart(sunSign, moonSign, risingSign)}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretDetailedBirthChart(chart: import('@/services/astrology').DetailedBirthChart): Promise<string> {
  const planetsSummary = chart.planets
    .map(
      (p) =>
        `- ${p.symbol} ${p.name}: ${p.signName} burcunda (${p.formattedDegree}), ${p.house}. Evde${
          p.isRetrograde ? ' [RETRO]' : ''
        }`,
    )
    .join('\n');

  const aspectsSummary = chart.aspects
    .slice(0, 10)
    .map((a) => `- ${a.body1Name} ${a.symbol} ${a.body2Name} (${a.aspectName}, orb: ${a.orb}°): ${a.interpretation}`)
    .join('\n');

  const elementsSummary = `Elementler: Ateş: %${chart.elements.fire.percentage}, Toprak: %${chart.elements.earth.percentage}, Hava: %${chart.elements.air.percentage}, Su: %${chart.elements.water.percentage} (Baskın: ${chart.elements.dominant})\nNitelikler: Öncü: %${chart.modalities.cardinal.percentage}, Sabit: %${chart.modalities.fixed.percentage}, Değişken: %${chart.modalities.mutable.percentage} (Baskın: ${chart.modalities.dominant})`;

  const adv = chart.advanced;
  const advancedSummary = [
    `- 7. Ev (DSC - Alçalan / Evlilik Burcu): ${adv.love.dscSignName}. Ruh Eşi Adayları: ${adv.love.soulmateSigns.map((s) => `${s.signName} (%${s.score})`).join(', ')}. Tutku Burcu: ${adv.love.passionSign.signName}. Zorlu Karmik Sınav: ${adv.love.challengingSign.signName}.`,
    `- Harita Yöneticisi: ${adv.chartRuler.rulerName} (${adv.chartRuler.house}. Evde, ${adv.chartRuler.signName}).`,
    `- Baskın Gezegen: ${adv.dominantPlanet.name} (${adv.dominantPlanet.house}. Evde, ${adv.dominantPlanet.signName}).`,
    `- Şans Noktası (Pars Fortunae): ${adv.fortunePoint.formatted} (${adv.fortunePoint.house}. Evde).`,
    `- Karmik Ay Düğümleri: Kuzey Ay Düğümü ${adv.lunarNodes.northNode.signName} (${adv.lunarNodes.northNode.house}. Ev). Güney Ay Düğümü ${adv.lunarNodes.southNode.signName} (${adv.lunarNodes.southNode.house}. Ev).`,
    `- MC Tepe Noktası (Kariyer): ${adv.career.mcSignName}. İdeal Alanlar: ${adv.career.careerFields.join(', ')}.`,
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.detailedBirthChart(planetsSummary, aspectsSummary, elementsSummary, advancedSummary)}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretZodiacCompatibility(signAName: string, signBName: string): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.zodiacCompatibility(signAName, signBName)}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretNumerology(
  name: string,
  lifePathNumber: number,
  nameNumber: number,
): Promise<string> {
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.numerology(name, lifePathNumber, nameNumber)}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
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
  personInfo?: PersonInfo | null,
): Promise<string> {
  if (images.length === 0) throw new Error('En az bir görsel gerekli.');
  const glossary = kind === 'coffee' ? getCoffeeSymbolGlossary() : getPalmistryGlossary();
  let prompt = kind === 'coffee' ? prompts.coffee(glossary) : prompts.palm(glossary);

  if (personInfo) {
    const details: string[] = [];
    if (personInfo.name) details.push(`İsim/Rumuz: ${personInfo.name}`);
    if (personInfo.age) details.push(`Yaş: ${personInfo.age}`);
    if (personInfo.gender) details.push(`Cinsiyet: ${personInfo.gender}`);
    if (personInfo.relationshipStatus) details.push(`İlişki Durumu: ${personInfo.relationshipStatus}`);
    if (personInfo.occupationStatus) details.push(`Çalışma/Meslek: ${personInfo.occupationStatus}`);
    if (personInfo.focusArea) details.push(`Falda Odaklanılan Konu: ${personInfo.focusArea}`);
    if (details.length > 0) {
      prompt += `\n\nFal Sahibi Bilgileri:\n${details.join('\n')}\nÖnemli Talimat: Bu kişisel bilgileri fincandaki/eldeki sembollerle ustaca ve sezgisel olarak harmanla. Yorumu doğrudan bu kişinin hayatına, yaşına, ilişkisine ve niyetine hitap eden sıcak, samimi ve kişiselleştirilmiş bir dille sun; ancak "verdiğin bilgilere göre" gibi mekanik ifadeler kullanma, doğal bir falcı sezgisi gibi yorumuna akıt.`;
    }
  }
  const profileBlock = await buildProfileBlock();
  prompt += profileBlock;

  const readingType = kind === 'coffee' ? 'kahve' : 'el';
  await guardReadingCooldown(readingType);
  return withFallbackChain([
    () => askGeminiVision(prompt, images, readingType),
    // Cloudflare's vision model only takes one image per call — the first
    // photo is enough context for a fallback pass when Gemini is down.
    () => askCloudflareVision(prompt, images[0].data),
    () => askOpenRouterVision(prompt, images),
    () => askHuggingFaceVision(prompt, images),
  ]);
}

export async function validateImage(kind: 'coffee' | 'palm', image: { mimeType: string; data: string }): Promise<boolean> {
  const prompt = kind === 'coffee' ? prompts.coffeeValidation : prompts.palmValidation;
  const response = await withFallbackChain([
    () => askGeminiVision(prompt, [image]),
    () => askOpenRouterVision(prompt, [image]),
    () => askHuggingFaceVision(prompt, [image]),
  ]);
  return response.trim().toLocaleUpperCase('tr').startsWith('EVET');
}
