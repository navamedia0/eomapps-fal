import { prompts } from '@/prompts';
import { askGemini, askGeminiChat, askGeminiVision, askGeminiAudio, type ChatTurn } from '@/services/gemini';
import { askCloudflare, askCloudflareChat, askCloudflareVision } from '@/services/cloudflare';
import { askOpenRouter, askOpenRouterChat, askOpenRouterVision } from '@/services/openrouter';
import { askHuggingFace, askHuggingFaceChat, askHuggingFaceVision } from '@/services/huggingface';
import { transcribeAudio } from '@/services/whisper';
import { withFallbackChain } from '@/services/aiFallback';
import { tarotReadingType } from '@/constants/aiQueue';
import type { TarotCard } from '@/services/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import type { KatinaCard } from '@/services/katina';
import { getKatinaMeaning } from '@/services/katinaMeanings';
import { getLenormandMeaning } from '@/services/lenormandMeanings';
import { findDreamMatches } from '@/services/dreamMeanings';
import { getCoffeeSymbolGlossary } from '@/services/coffeeSymbols';
import { getTeaLeafSymbolGlossary } from '@/services/teaLeafSymbols';
import { getPalmistryGlossary } from '@/services/palmistry';
import {
  buildRichCoffeeContext,
  buildRichDreamContext,
  buildRichFaceContext,
  buildRichMysticContext,
} from '@/services/mysticKnowledgeEngine';
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

export interface RelationshipAiContext {
  p1Name?: string;
  p2Name?: string;
  relFocus?: string;
}

export async function interpretTarotSpread(
  cards: TarotCard[],
  positions: string[],
  isPaid = false,
  relationshipContext?: RelationshipAiContext
): Promise<string> {
  const isRel = Boolean(relationshipContext?.p1Name || relationshipContext?.p2Name);
  const p1 = relationshipContext?.p1Name?.trim() || '1. Kişi (Danışan)';
  const p2 = relationshipContext?.p2Name?.trim() || '2. Kişi (Partner)';
  const focus = relationshipContext?.relFocus?.trim() || 'Aşk, Ruhsal Çekim & Kadersel Uyum';

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
      return `${positions[index] || `${index + 1}. Katman`}: ${card.name} (${orientationLabel})${referenceLine}`;
    })
    .join('\n');

  const headerList = [...positions.map((position) => `"${turkishUpperCase(position)}:"`), '"GENEL UYUM & KADERSEL SENTEZ:"'].join(', ');

  const formatInstruction = isRel
    ? `Bu özel bir "ÇİFTLER İÇİN KARŞILIKLI UYUM TAROT AÇILIMI"dır. 1. Taraf: ${p1}, 2. Taraf: ${p2}, Odak: ${focus}.
Yanıtını ${positions.length + 1} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}.
Her bölümde ilgili kişinin o katmandaki hissini, düşüncesini ve diğer tarafla elementel/ruhsal etkileşimini derinlemesine yorumla.
Son bölüm olan "GENEL UYUM & KADERSEL SENTEZ:", ${p1} ve ${p2} arasındaki aşk, ruh bağı, ten çekimi, olası krizler ve evlilik/gelecek potansiyelini özetleyen etkileyici, akıcı ve ilham verici bir kapanış olmalı.`
    : `Yanıtını ${positions.length + 1} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}. Başlıklar dışında yıldız, madde işareti veya numaralandırma kullanma. Her kart için verilen "klasik anlamı" satırını doğrudan kopyalama; onu yalnızca ilham kaynağı olarak kullanıp kendi akıcı ve edebi üslubunla yeniden anlat. Son bölüm olan "GENEL UYUM & KADERSEL SENTEZ:", kartları tek tek tekrar etmeden hepsinin birlikte anlattığı hikayeyi, aralarındaki uyumu ya da çelişkiyi ve genel bir sonucu 3-4 cümlede özetlemeli.`;

  const profileBlock = await buildProfileBlock();
  const mysticBlock = buildRichMysticContext('tarot');
  const prompt = `${prompts.tarotSpread(positions)}\n${formatInstruction}\n\nKartlar:\n${cardText}${mysticBlock}${profileBlock}`;
  const readingType = tarotReadingType(cards.length);
  return withFallbackChain([
    () => askGemini(prompt, undefined, readingType, isPaid),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretSolitaireSpread(cards: KatinaCard[], isPaid = false): Promise<string> {
  const cardText = cards
    .map((card) => {
      const meaning = getKatinaMeaning(card.id);
      return meaning ? `${card.name} (esin için: ${meaning})` : card.name;
    })
    .join(', ');
  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.solitaireSpread(cards.map((card) => card.name))}\n\nAçılan kartlar ve klasik anlamları (esin için, birebir kopyalama):\n${cardText}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt, undefined, 'solitaire', isPaid),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretKatinaSpread(
  cards: KatinaCard[],
  positions: string[],
  isPaid = false,
  toneHint?: string,
): Promise<string> {
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
  const mysticBlock = buildRichMysticContext('katina');
  const prompt = `${prompts.katinaSpread(positions, toneHint)}\n${formatInstruction}\n\nKartlar:\n${cardText}${mysticBlock}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt, undefined, 'katina', isPaid),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export type LenormandPick = { id: string; name: string; orientation: 'upright' | 'reversed' };

export async function interpretLenormandSpread(
  cards: LenormandPick[],
  positions: string[],
  readingTechnique: string,
  isPaid = false,
): Promise<string> {
  const cardText = cards
    .map((card, index) => {
      const meaning = getLenormandMeaning(card.id);
      const orientationLabel = card.orientation === 'reversed' ? 'ters (enerjisi zayıf/gecikmeli)' : 'düz';
      const referenceLine = meaning
        ? `\n   Klasik anlamı (esin için, birebir kopyalama): ${meaning.meaning}\n   Kombinasyon ipucu: ${meaning.combination}`
        : '';
      return `${positions[index] || `${index + 1}. Kart`}: ${card.name} (${orientationLabel})${referenceLine}`;
    })
    .join('\n');

  const headerList = [...positions.map((position) => `"${turkishUpperCase(position)}:"`), '"GENEL YORUM & KARTLARIN BİRLEŞİK MESAJI:"'].join(', ');
  const formatInstruction = `Yanıtını ${positions.length + 1} bölüme ayır ve her bölümü sırasıyla şu başlıklarla başlat: ${headerList}. Başlıklar dışında yıldız, madde işareti veya numaralandırma kullanma. Her kart için verilen "klasik anlamı" ve "kombinasyon ipucu" satırlarını doğrudan kopyalama; onları ilham kaynağı olarak kullanıp kendi akıcı üslubunla yeniden anlat, komşu kartlarla ilişkilendirerek somutlaştır. Son bölüm olan "GENEL YORUM & KARTLARIN BİRLEŞİK MESAJI:", tüm kartların birlikte kurduğu tek bir Lenormand "cümlesini/hikayesini" 3-4 cümlede özetlemeli.`;

  const profileBlock = await buildProfileBlock();
  const prompt = `${prompts.lenormandSpread(positions, readingTechnique)}\n${formatInstruction}\n\nKartlar:\n${cardText}${profileBlock}`;
  return withFallbackChain([
    () => askGemini(prompt, undefined, tarotReadingType(cards.length), isPaid),
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

  const deepDreamBlock = buildRichDreamContext();
  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.deepDreamAnalysis : prompts.dreamChat;
  const systemPrompt = `${basePrompt}${referenceBlock}\n${deepDreamBlock}${profileBlock}`;
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

export async function interpretVoiceReading(audioBase64: string, mimeType: string, isPaid = false): Promise<string> {
  try {
    return await askGeminiAudio(prompts.voiceReading, audioBase64, mimeType, 'sesli', isPaid);
  } catch (err) {
    // Gemini is the only provider that understands raw audio directly, so it
    // has no like-for-like fallback (Cloudflare's llama-3.2-11b-vision-instruct
    // doesn't accept audio input, only text and a single image). Instead of
    // failing outright when Gemini's audio quota is tight, transcribe the
    // same recording with Whisper and interpret the transcript through the
    // normal text fallback chain — loses tone/pacing awareness, but the
    // reading still goes through.
    const transcript = await transcribeAudio(audioBase64, 'sesli');
    const prompt = prompts.voiceReadingFallback(transcript);
    return withFallbackChain([
      () => askGemini(prompt, undefined, 'sesli', isPaid),
      () => askCloudflare(prompt),
      () => askOpenRouter(prompt),
      () => askHuggingFace(prompt),
    ]);
  }
}

export async function interpretImages(
  kind: 'coffee' | 'palm' | 'face' | 'tea',
  images: Array<{ mimeType: string; data: string }>,
  personInfo?: PersonInfo | null,
  mode: 'standard' | 'deep' = 'standard',
  isPaid = false,
): Promise<string> {
  if (images.length === 0) throw new Error('En az bir görsel gerekli.');
  let prompt: string;
  if (kind === 'coffee') {
    const glossary = getCoffeeSymbolGlossary();
    prompt =
      mode === 'deep'
        ? prompts.coffeeDetailed(`${glossary}\n${buildRichCoffeeContext()}`)
        : prompts.coffeeStandard(glossary);
  } else if (kind === 'palm') {
    const glossary = getPalmistryGlossary();
    prompt =
      mode === 'deep'
        ? prompts.palmDetailed(`${glossary}\n${buildRichMysticContext('palm')}`)
        : prompts.palmStandard(glossary);
  } else if (kind === 'face') {
    const richBlock = buildRichFaceContext();
    prompt = mode === 'deep' ? prompts.faceDetailed(richBlock) : prompts.faceStandard(richBlock);
  } else {
    // Tea — Türk kahve falından ayrı bir gelenek (İngiliz/Doğu Avrupa
    // tasseografisi), kendi sembol sözlüğünü kullanır.
    const glossary = getTeaLeafSymbolGlossary();
    prompt = mode === 'deep' ? prompts.teaLeafDetailed(glossary) : prompts.teaLeafStandard(glossary);
  }

  if (personInfo) {
    const details: string[] = [];
    if (personInfo.name) details.push(`İsim/Rumuz: ${personInfo.name}`);
    if (personInfo.age) details.push(`Yaş: ${personInfo.age}`);
    if (personInfo.gender) details.push(`Cinsiyet: ${personInfo.gender}`);
    if (personInfo.relationshipStatus) details.push(`İlişki Durumu: ${personInfo.relationshipStatus}`);
    if (personInfo.occupationStatus) details.push(`Çalışma/Meslek: ${personInfo.occupationStatus}`);
    if (personInfo.focusArea) details.push(`Falda Odaklanılan Konu: ${personInfo.focusArea}`);
    if (details.length > 0) {
      prompt += `\n\nFal Sahibi Bilgileri:\n${details.join('\n')}\nÖnemli Talimat: Bu kişisel bilgileri fincandaki/eldeki/yüzdeki sembol ve hatlarla ustaca ve sezgisel olarak harmanla. Yorumu doğrudan bu kişinin hayatına, yaşına, ilişkisine ve niyetine hitap eden sıcak, samimi ve kişiselleştirilmiş bir dille sun; ancak "verdiğin bilgilere göre" gibi mekanik ifadeler kullanma, doğal bir falcı sezgisi gibi yorumuna akıt.`;
    }
  }
  const profileBlock = await buildProfileBlock();
  prompt += profileBlock;

  const readingType = kind === 'coffee' ? 'kahve' : kind === 'palm' ? 'el' : kind === 'face' ? 'yuz' : 'kahve';
  return withFallbackChain([
    () => askGeminiVision(prompt, images, readingType, isPaid),
    () => askCloudflareVision(prompt, images[0].data),
    () => askOpenRouterVision(prompt, images),
    () => askHuggingFaceVision(prompt, images),
  ]);
}

export async function validateImage(kind: 'coffee' | 'palm' | 'face' | 'tea', image: { mimeType: string; data: string }): Promise<boolean> {
  const prompt =
    kind === 'coffee'
      ? prompts.coffeeValidation
      : kind === 'palm'
      ? prompts.palmValidation
      : kind === 'face'
      ? prompts.faceValidation
      : prompts.teaValidation;
  const response = await withFallbackChain([
    () => askGeminiVision(prompt, [image]),
    () => askOpenRouterVision(prompt, [image]),
    () => askHuggingFaceVision(prompt, [image]),
  ]);
  return response.trim().toLocaleUpperCase('tr').startsWith('EVET');
}

export async function interpretDestinyMatrix(
  matrix: import('@/services/destinyMatrixEngine').DestinyMatrix,
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const summary = [
    `- Doğum Tarihi: ${matrix.birthDate.day}.${matrix.birthDate.month}.${matrix.birthDate.year}`,
    `- 1. Kişilik & Ruh Kartı (Doğum Günü): ${matrix.dayArcana.id} - ${matrix.dayArcana.name} (${matrix.dayArcana.keyword})`,
    `- 2. Yetenekler & Sezgi Kartı (Doğum Ayı): ${matrix.monthArcana.id} - ${matrix.monthArcana.name} (${matrix.monthArcana.keyword})`,
    `- 3. Maddiyat & Dünya Görevi (Doğum Yılı): ${matrix.yearArcana.id} - ${matrix.yearArcana.name} (${matrix.yearArcana.keyword})`,
    `- 4. Karmik Kuyruk (Geçmiş Yaşam Borcu): ${matrix.bottomArcana.id} - ${matrix.bottomArcana.name} (${matrix.bottomArcana.keyword})`,
    `- 5. Kalp & Konfor Merkezi: ${matrix.centerArcana.id} - ${matrix.centerArcana.name}`,
    `- 6. Aşk & Ruh Eşi Kapısı: ${matrix.loveArcana.id} - ${matrix.loveArcana.name} (${matrix.loveArcana.love})`,
    `- 7. Zenginlik & Para Kanalı: ${matrix.moneyArcana.id} - ${matrix.moneyArcana.name} (${matrix.moneyArcana.money})`,
    `- 8. Yaşam Amacı & Bütünlük: ${matrix.purposeArcana.id} - ${matrix.purposeArcana.name}`,
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.destinyMatrixDetailed(summary) : prompts.destinyMatrixStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

const RUNE_SPREAD_POSITIONS: Record<'single' | 'norn' | 'cross', string[]> = {
  single: ['Günün Rehber Rünü'],
  norn: ['1. Urd (Geçmiş / Kökler)', '2. Verdandi (Şimdi / Ateş)', '3. Skuld (Gelecek / Kehanet)'],
  cross: [
    '1. Merkez (Durumun Özü)',
    '2. Üst (Görünen / Yüzeydeki Etken)',
    '3. Alt (Gizli / Bilinçaltı Etken)',
    '4. Sol (Geçmişten Gelen Kök)',
    '5. Sağ (Olası Yol / Sonuç)',
  ],
};

export async function interpretRuneReading(
  runes: import('@/services/runeEngine').Rune[],
  spreadType: 'single' | 'norn' | 'cross' = 'norn',
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const positions = RUNE_SPREAD_POSITIONS[spreadType];
  const summary = runes
    .map((r, i) => `${positions[i] || `Rün ${i + 1}`}: ${r.symbol} ${r.name} (${r.isReversed ? 'TERS' : 'DÜZ'}) - Anlam: ${r.isReversed ? r.reversed : r.upright}\nÖğüt: ${r.advice}`)
    .join('\n\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.runeReadingDetailed(summary, spreadType) : prompts.runeReadingStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretIChingReading(
  hexagram: import('@/services/ichingEngine').Hexagram,
  mode: 'standard' | 'deep' = 'standard',
  transformedHexagram?: import('@/services/ichingEngine').Hexagram | null,
): Promise<string> {
  const changingLineNumbers = hexagram.lines
    .map((l, i) => (l.isChanging ? i + 1 : null))
    .filter((n): n is number => n !== null);

  const summaryParts = [
    `Heksagram No: ${hexagram.number} - ${hexagram.name}`,
    `Üst Trigram: ${hexagram.upper}, Alt Trigram: ${hexagram.lower}`,
    `Hüküm: ${hexagram.judgment}`,
    `Bilgelik: ${hexagram.wisdom}`,
    `Eylem: ${hexagram.action}`,
  ];

  if (transformedHexagram) {
    summaryParts.push(
      `Değişen Çizgiler: ${changingLineNumbers.join(', ')}. numaralı çizgiler (alttan sayarak) dönüşüyor.`,
      `Dönüşen Gelecek Heksagramı: No ${transformedHexagram.number} - ${transformedHexagram.name} (Üst: ${transformedHexagram.upper}, Alt: ${transformedHexagram.lower})`,
      `Dönüşen Heksagramın Hükmü: ${transformedHexagram.judgment}`,
    );
  } else {
    summaryParts.push('Değişen Çizgiler: Yok — durum sabit ve dengeli, dönüşüm baskısı taşımıyor.');
  }

  const summary = summaryParts.join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.ichingReadingDetailed(summary) : prompts.ichingReadingStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretBaklaReading(
  reading: import('@/services/baklaEngine').BaklaReading,
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const summary = [
    `Ocak Dağılımları:`,
    ...reading.ocaklar.map((o) => `- ${o.name}: ${o.count} Bakla (${o.isEven ? 'ÇİFT' : 'TEK'})`),
    `Beliren Remil Deseni: ${reading.patternName}`,
    `Yorum: ${reading.meaning}`,
    `Müjde/Sonuç: ${reading.outcome}`,
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.baklaReadingDetailed(summary) : prompts.baklaReadingStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretWaxReading(
  flameType: string,
  shapes: Array<{ name: string; meaning: string }>,
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const summary = [
    `Alev Durumu: ${flameType}`,
    `Suya Düşen Balmumu Şekilleri:`,
    ...shapes.map((s) => `- ${s.name}: ${s.meaning}`),
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.waxReadingDetailed(summary) : prompts.waxReadingStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretCelticTreeReading(
  tree: import('@/services/celticTreeEngine').CelticTree,
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const summary = [
    `Kutsal Kelt Ağacı: ${tree.name} (${tree.dates})`,
    `Yönetici Gezegen / Element: ${tree.ruler} / ${tree.element}`,
    `Öz Değerler: ${tree.essence}`,
    `Mitolojik Açıklama: ${tree.desc}`,
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.celticTreeDetailed(summary) : prompts.celticTreeStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretAuraReading(
  aura: import('@/services/auraEngine').AuraAnalysis,
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const summary = [
    `Baskın Aura: ${aura.dominantAuraName} (%${aura.dominantChakra.percentage})`,
    `Titreşim Frekansı: ${aura.vibrationFrequency} Hz`,
    `Aura Özeti: ${aura.auraDescription}`,
    `7 Çakra Dağılımı:`,
    ...aura.chakras.map((c) => `- ${c.name} (${c.color}): %${c.percentage} [Kristal: ${c.crystal}]`),
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.auraReadingDetailed(summary) : prompts.auraReadingStandard(summary);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

export async function interpretScryingReading(
  vision: import('@/services/scryingEngine').ScryingVision,
  intentText: string,
  mode: 'standard' | 'deep' = 'standard',
): Promise<string> {
  const visionText = [
    `Aynada Beliren Vizyon: ${vision.symbol}`,
    `Netlik Derecesi: ${vision.clarityLabel} (${vision.clarityNote})`,
    `Vizyonun İlk Sezgisel Anlamı: ${vision.meaning}`,
    intentText
      ? `Kullanıcının Aynaya Bakarken Odaklandığı Soru/Niyet: ${intentText}`
      : `Kullanıcı özel bir soru belirtmedi; vizyonu genel bir sezgisel rehberlik olarak yorumla.`,
  ].join('\n');

  const profileBlock = await buildProfileBlock();
  const basePrompt = mode === 'deep' ? prompts.scryingReadingDetailed(visionText) : prompts.scryingReadingStandard(visionText);
  const prompt = `${basePrompt}${profileBlock}`;

  return withFallbackChain([
    () => askGemini(prompt),
    () => askCloudflare(prompt),
    () => askOpenRouter(prompt),
    () => askHuggingFace(prompt),
  ]);
}

