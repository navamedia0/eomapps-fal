/**
 * Otantik Karşılıklı Uyum & Sinastri Analiz Motoru (Yapay zekasız, %100 yerel & stok bilgi)
 * Tarot ve Kartomansi Ekolü Elementel, Astrolojik ve Arketipsel Eşleşme Kuralları
 */

export type ElementType = 'fire' | 'water' | 'air' | 'earth' | 'spirit';

export interface CardElementInfo {
  element: ElementType;
  elementName: string;
  zodiacSign?: string;
  keywords: string[];
  loveArchetype: string;
}

// Major Arcana & Suits Element Mapping
export function getCardElement(cardId: string): CardElementInfo {
  const id = cardId.toLowerCase();

  // Küçük Arkana Serileri
  if (id.includes('wand') || id.includes('degnek') || id.includes('baston')) {
    return {
      element: 'fire',
      elementName: 'Ateş',
      keywords: ['Tutku', 'Girişim', 'Arzu', 'Hareket', 'Coşku'],
      loveArchetype: 'Ateşli, direkt ve anı yaşayan tutkulu aşık',
    };
  }
  if (id.includes('cup') || id.includes('kupa')) {
    return {
      element: 'water',
      elementName: 'Su',
      keywords: ['Duygu', 'Şefkat', 'Sezgi', 'Romantizm', 'Bağlılık'],
      loveArchetype: 'Derin hisseden, fedakar ve ruhsal bağ arayan aşık',
    };
  }
  if (id.includes('sword') || id.includes('kilic')) {
    return {
      element: 'air',
      elementName: 'Hava',
      keywords: ['Zihin', 'İletişim', 'Mantık', 'Açıklık', 'Fikirler'],
      loveArchetype: 'Zihinsel uyuma, dürüstlüğe ve iletişime önem veren entelektüel aşık',
    };
  }
  if (id.includes('pentacle') || id.includes('coin') || id.includes('para') || id.includes('tilsim')) {
    return {
      element: 'earth',
      elementName: 'Toprak',
      keywords: ['Güven', 'Sadakat', 'Sabır', 'Kalıcılık', 'Somut Destek'],
      loveArchetype: 'Güvenilir, ayakları yere basan ve uzun vadeli düşünen sadık aşık',
    };
  }

  // Büyük Arkana Özel Eşleşmeleri
  if (id.includes('fool') || id.includes('deli')) {
    return { element: 'air', elementName: 'Hava', keywords: ['Özgürlük', 'Masumiyet', 'Yeni Başlangıç'], loveArchetype: 'Kalıplara sığmayan, heyecan dolu serüvenci' };
  }
  if (id.includes('magician') || id.includes('buyucu')) {
    return { element: 'air', elementName: 'Hava', keywords: ['Çekim', 'Yetenek', 'İkna'], loveArchetype: 'Büyüleyici, karizmatik ve etkileyici partner' };
  }
  if (id.includes('high_priestess') || id.includes('azize')) {
    return { element: 'water', elementName: 'Su', keywords: ['Gizem', 'Telepati', 'Sezgi'], loveArchetype: 'Kelimelere dökülmeyen derin ruhsal çekim' };
  }
  if (id.includes('empress') || id.includes('imparatorice')) {
    return { element: 'earth', elementName: 'Toprak', keywords: ['Bereket', 'Şefkat', 'Dişil Güç'], loveArchetype: 'Besleyen, saran, koşulsuz sevgi sunan şefkatli partner' };
  }
  if (id.includes('emperor') || id.includes('imparator')) {
    return { element: 'fire', elementName: 'Ateş', keywords: ['Koruma', 'Otorite', 'Liderlik'], loveArchetype: 'Koruyucu, sahiplenici ve sınırları net lider partner' };
  }
  if (id.includes('hierophant') || id.includes('aziz')) {
    return { element: 'earth', elementName: 'Toprak', keywords: ['Gelenek', 'Bağlılık', 'Evlilik'], loveArchetype: 'Geleneksel değerlere ve sadakate bağlı partner' };
  }
  if (id.includes('lovers') || id.includes('asiklar')) {
    return { element: 'air', elementName: 'Hava', keywords: ['Ruh İkizi', 'Büyük Seçim', 'Kozmik Çekim'], loveArchetype: 'Kadersel ruh eşi ve karşılıklı teslimiyet' };
  }
  if (id.includes('chariot') || id.includes('araba')) {
    return { element: 'water', elementName: 'Su', keywords: ['Zafer', 'Birlikte Aşma', 'Kararlılık'], loveArchetype: 'Tüm engelleri birlikte aşmaya kararlı savaşçı partner' };
  }
  if (id.includes('strength') || id.includes('guc')) {
    return { element: 'fire', elementName: 'Ateş', keywords: ['Nezaket', 'Sabır', 'Tutkuyu Yönetme'], loveArchetype: 'Kalbi yumuşatan sevgi gücü ve yüksek çekim' };
  }
  if (id.includes('hermit') || id.includes('ermis')) {
    return { element: 'earth', elementName: 'Toprak', keywords: ['İçsel Işık', 'Olgunluk', 'Sabır'], loveArchetype: 'Ruhsal derinlik ve zamana yayılan sakin bağ' };
  }
  if (id.includes('wheel_of_fortune') || id.includes('kader_carki')) {
    return { element: 'fire', elementName: 'Ateş', keywords: ['Kader', 'Dönüm Noktası', 'Şans'], loveArchetype: 'Kadersel karşılaşma ve beklenmedik fırsatlar' };
  }
  if (id.includes('justice') || id.includes('adalet')) {
    return { element: 'air', elementName: 'Hava', keywords: ['Denge', 'Dürüstlük', 'Hakkaniyet'], loveArchetype: 'Eşitlikçi, dürüst ve saygı temelli aşık' };
  }
  if (id.includes('temperance') || id.includes('denge')) {
    return { element: 'fire', elementName: 'Ateş', keywords: ['Kusursuz Uyum', 'Simya', 'Huzur'], loveArchetype: 'İki ruhun kusursuzca birbirine karışması ve şifa' };
  }
  if (id.includes('devil') || id.includes('seytan')) {
    return { element: 'earth', elementName: 'Toprak', keywords: ['Manyetik Çekim', 'Tutku', 'Bağımlılık'], loveArchetype: 'Karşı konulamaz ten uyumu ve yoğun çekim' };
  }
  if (id.includes('star') || id.includes('yildiz')) {
    return { element: 'air', elementName: 'Hava', keywords: ['Umut', 'İlham', 'Saf Sevgi'], loveArchetype: 'İlişkiye ışık tutan, geleceğe umut aşılayan partner' };
  }
  if (id.includes('moon') || id.includes('ay')) {
    return { element: 'water', elementName: 'Su', keywords: ['Bilinçaltı', 'Duygusal Derinlik', 'Rüyalar'], loveArchetype: 'Yoğun duygusal dalgalanmalar ve telepatik bağ' };
  }
  if (id.includes('sun') || id.includes('gunes')) {
    return { element: 'fire', elementName: 'Ateş', keywords: ['Mutluluk', 'Netlik', 'Coşku', 'Kutlama'], loveArchetype: 'İçinizi ısıtan, neşe saçan ve net partner' };
  }
  if (id.includes('judgement') || id.includes('mahkeme')) {
    return { element: 'fire', elementName: 'Ateş', keywords: ['Uyanış', 'Yüzleşme', 'İkinci Şans'], loveArchetype: 'Geçmişin temizlenmesi ve ilişkinin yeniden doğuşu' };
  }
  if (id.includes('world') || id.includes('dunya')) {
    return { element: 'earth', elementName: 'Toprak', keywords: ['Bütünlük', 'Mutlu Son', 'Ruh Eşi'], loveArchetype: 'Arayışın bitişi, tamamlanma ve sonsuz bütünlük' };
  }

  // Genel Varsayılan
  return {
    element: 'spirit',
    elementName: 'Kozmik Enerji',
    keywords: ['Kader', 'Dönüşüm', 'Bilinç'],
    loveArchetype: 'Kadersel deneyim ve ruhsal büyüme rehberi',
  };
}

export interface PairwiseComparison {
  title: string;
  posLabel: string;
  score: number; // 0 - 100
  elementSynergy: string;
  synergyBadge: string;
  synthesis: string;
  advice: string;
  p1CardName: string;
  p1Element: string;
  p1Keywords: string[];
  p1Archetype: string;
  p2CardName: string;
  p2Element: string;
  p2Keywords: string[];
  p2Archetype: string;
}

// Elemental Compatibility Rules
export function calculateElementalSynergy(e1: ElementType, e2: ElementType): { score: number; label: string; text: string } {
  if (e1 === e2) {
    if (e1 === 'water') return { score: 95, label: 'Derin Ruhsal Aynalanma', text: 'İki su elementi birbirinin duygularını konuşmadan anlar. Sezgisel ve romantik bir rezonans var.' };
    if (e1 === 'fire') return { score: 90, label: 'Yüksek Tutku ve Kıvılcım', text: 'İki ateş elementi birbirini inanılmaz besler; tutku, heyecan ve enerji zirvededir.' };
    if (e1 === 'earth') return { score: 92, label: 'Sarsılmaz Güven ve Sadakat', text: 'İki toprak elementi sağlam temeller, ömürlük bağlılık ve güvenli bir liman inşa eder.' };
    if (e1 === 'air') return { score: 88, label: 'Sonsuz Sohbet ve Zihinsel Büyü', text: 'İki hava elementi arasında entelektüel uyum ve bitmeyen keyifli sohbetler akar.' };
  }

  // Uyumlu Tamamlayıcılar
  if ((e1 === 'fire' && e2 === 'air') || (e1 === 'air' && e2 === 'fire')) {
    return { score: 94, label: 'Kıvılcım ve Rüzgar (Yaratıcı Çekim)', text: 'Hava ateşi körükler, ateş havayı ısıtır. Birbirinizi sürekli ilhamla ve heyecanla beslersiniz.' };
  }
  if ((e1 === 'water' && e2 === 'earth') || (e1 === 'earth' && e2 === 'water')) {
    return { score: 96, label: 'Toprak ve Su (Bereketli Aşk)', text: 'Toprak suya yuva olur, su toprağı yeşertir. Birlikte son derece dengeli, besleyici ve kalıcı bir aşk yaşarsınız.' };
  }

  // Zıt/Dönüştürücü Dinamikler
  if ((e1 === 'fire' && e2 === 'water') || (e1 === 'water' && e2 === 'fire')) {
    return { score: 76, label: 'Buhar ve Volkan (Tutkulu Zıtlık)', text: 'Zıt kutupların çekimi! Ateş suyu ısıtırken su ateşi sakinleştirir. Yoğun çekim ancak dikkatli iletişim gerektirir.' };
  }
  if ((e1 === 'air' && e2 === 'earth') || (e1 === 'earth' && e2 === 'air')) {
    return { score: 78, label: 'Fikir ve Pratiklik (Dengeleyici Güç)', text: 'Biri hayal kurar, diğeri inşa eder. Farklılıklarınızı çatışma değil zenginlik olarak gördüğünüzde harika bir takımsınız.' };
  }

  return { score: 85, label: 'Kozmik Denge', text: 'İki tarafın enerjileri birbiriyle uyumlanarak kadersel bir deneyim sunuyor.' };
}

// Generate complete pairwise analysis between Person 1's cards and Person 2's cards
export function analyzeRelationshipSpread(
  p1Name: string,
  p2Name: string,
  p1Cards: { id: string; name: string; orientation?: string }[],
  p2Cards: { id: string; name: string; orientation?: string }[],
  bridgeCard?: { id: string; name: string; orientation?: string }
): {
  overallScore: number;
  overallStatus: string;
  overallSummary: string;
  pairs: PairwiseComparison[];
  bridgeAnalysis?: {
    title: string;
    cardName: string;
    meaning: string;
  };
} {
  const pairs: PairwiseComparison[] = [];
  let totalScore = 0;

  const cleanP1 = p1Name.trim() || '1. Kişi';
  const cleanP2 = p2Name.trim() || '2. Kişi';

  const positions = [
    { title: '1. Seviye: Zihin & Düşünce Uyumu', posLabel: 'Bakış Açısı & Zihinsel Boyut' },
    { title: '2. Seviye: Kalp & Duygu Rezonansı', posLabel: 'Hisler & Duygusal Yakınlık' },
    { title: '3. Seviye: Beklentiler & Gelecek Yönü', posLabel: 'Niyetler & İlerleyiş' },
    { title: '4. Seviye: Bilinçaltı & Gizli Korkular', posLabel: 'İçsel Blokajlar & Güven' },
    { title: '5. Seviye: Tutku, Çekim & Ten Kimyası', posLabel: 'Manyetik Enerji & Arzu' },
    { title: '6. Seviye: İletişim & Karar Alma', posLabel: 'Diyalog & Problem Çözme' },
    { title: '7. Seviye: Ruhsal Ders & Kadersel Sınav', posLabel: 'Tekamül & Karşılıklı Büyüme' },
    { title: '8. Seviye: Dış Etkenler & Sosyal Çevre', posLabel: 'Aile, Arkadaşlar & Dünya' },
    { title: '9. Seviye: Gizli Umutlar & Hayaller', posLabel: 'Ortak Vizyon & Gelecek İnşası' },
    { title: '10. Seviye: Kadersel Nihai Bütünleşme', posLabel: 'Kozmik Sonuç & Ruh Eşi Kapısı' },
  ];

  const compareCount = Math.min(p1Cards.length, p2Cards.length, 10);

  for (let i = 0; i < compareCount; i++) {
    const c1 = p1Cards[i];
    const c2 = p2Cards[i];
    const e1 = getCardElement(c1.id);
    const e2 = getCardElement(c2.id);

    const synergy = calculateElementalSynergy(e1.element, e2.element);
    totalScore += synergy.score;

    let synthesisText = '';
    let adviceText = '';

    if (i === 0) {
      // Zihin
      synthesisText = `${cleanP1}'in zihnindeki ${c1.name} enerjisi (${e1.elementName}), ${cleanP2}'in ${c2.name} yaklaşımıyla (${e2.elementName}) karşılaştığında "${synergy.label}" dinamizmi doğuyor. Birbirinizi düşünsel olarak ${synergy.score > 85 ? 'aynı dalga boyunda tamamlıyor ve tek bir bakışla anlaşıyorsunuz' : 'birbirinize yeni ufuklar açarak zenginleştiren bir denge kuruyorsunuz'}.`;
      adviceText = `Fikir ayrılıklarında inatlaşmak yerine ortak vizyona odaklanmak aranızdaki zihinsel bağı sarsılmaz kılacaktır.`;
    } else if (i === 1) {
      // Kalp
      synthesisText = `${cleanP1}'in kalbindeki ${c1.name} (${e1.loveArchetype}), ${cleanP2}'in ${c2.name} hisleriyle (${e2.loveArchetype}) rezone oluyor. Kalplerinizin ritminde ${synergy.text}`;
      adviceText = `Duygusal yakınlıkta karşılıklı şefkat ve empatiyi esirgememek kalpleriniz arasındaki sevgi akışını ömürlük kılacaktır.`;
    } else if (i === 2) {
      // Beklenti & Gelecek
      synthesisText = `${cleanP1}'in bu bağdan beklentisi ${c1.name} ile şekillenirken, ${cleanP2} ${c2.name} ile geleceğe adım atıyor. İki tarafın kadersel vizyonu ${synergy.score > 85 ? 'mükemmel bir harmoni ve ortak evlilik/birlik amacı içinde örtüşüyor' : 'birbirini dengeleyen, sağlam temelli bir rota çiziyor'}.`;
      adviceText = `Geleceğe dair planlarınızı açıkça konuşmak ilişkinizin potansiyelini zirveye taşıyacaktır.`;
    } else if (i === 3) {
      // Bilinçaltı & Korkular
      synthesisText = `${cleanP1}'in içsel derinliğindeki ${c1.name} arketipleri, ${cleanP2}'in ${c2.name} bilinçaltı yansımalarıyla yüzleşiyor. İki tarafın görünmeyen korkuları birbirinin şefkatli alanında güvenli bir liman buluyor.`;
      adviceText = `Birbirinizin geçmiş yaralarını yargılamadan dinlemek en büyük şifa kaynağınız olacaktır.`;
    } else if (i === 4) {
      // Tutku & Ten Kimyası
      synthesisText = `${cleanP1}'in tutku ateşi ${c1.name} ile parlarken, ${cleanP2}'in ${c2.name} çekim gücü aranızdaki manyetik çekimi zirveye taşıyor. Aranızda ten uyumu ve güçlü bir kimya hüküm sürüyor.`;
      adviceText = `İlişkinin ilk günlerindeki heyecan ve kıvılcımı sürprizlerle canlı tutmayı ihmal etmeyin.`;
    } else if (i === 5) {
      // İletişim & Karar
      synthesisText = `${cleanP1}'in ifade tarzı ${c1.name}, ${cleanP2}'in ${c2.name} iletişim diliyle buluştuğunda ${synergy.score > 85 ? 'akıcı ve yapıcı bir diyalog köprüsü' : 'birbirini dinlemeyi öğreten olgun bir alan'} oluşuyor.`;
      adviceText = `Karar alırken 'ben' değil 'biz' dilini kullanmak ortak gücünüzü ikiye katlayacaktır.`;
    } else if (i === 6) {
      // Ruhsal Ders
      synthesisText = `Kader bu birliktelikte ${cleanP1}'e ${c1.name} bilgeliğini, ${cleanP2}'ye ise ${c2.name} erdemini öğretiyor. Bu ilişki sadece dünyevi bir bağ değil, ruhsal bir tekamül yolculuğudur.`;
      adviceText = `Zorlukları bir engel değil, ruhlarınızın birbirine ayna tuttuğu bir büyüme fırsatı olarak görün.`;
    } else if (i === 7) {
      // Dış Çevre
      synthesisText = `Dış dünyanın ve çevresel koşulların ilişkinize etkisi ${c1.name} ve ${c2.name} dengesiyle korunuyor. Birlikteyken dış dünyanın baskılarına karşı güçlü bir kale oluşturuyorsunuz.`;
      adviceText = `İlişkinizin mahremiyetini ve özel sınırlarını üçüncü şahısların müdahalesine karşı koruyun.`;
    } else if (i === 8) {
      // Umutlar
      synthesisText = `${cleanP1}'in en saf hayalleri (${c1.name}), ${cleanP2}'in derin arzularıyla (${c2.name}) birleşerek gerçeğe dönüşecek bir kadersel tohum ekiyor.`;
      adviceText = `Birlikte hayal kurmaktan ve büyük hedeflere el ele yürümekten asla vazgeçmeyin.`;
    } else {
      // Kadersel Nihai Bütünleşme
      synthesisText = `20 kartlık kehanetin zirve noktasında ${cleanP1} (${c1.name}) ve ${cleanP2} (${c2.name}) tek bir kader düğümünde birleşiyor. İki ruh arayışını tamamlayarak birbirinde huzur ve sonsuz yuva buluyor.`;
      adviceText = `Bu bağ evrenin size sunduğu nadide bir kadersel hediyedir; birbirinizin kıymetini her an bilin.`;
    }

    pairs.push({
      title: positions[i]?.title || `${i + 1}. Seviye Karşılaşması`,
      posLabel: positions[i]?.posLabel || 'Ayna Karşılaşması',
      score: synergy.score,
      elementSynergy: `${e1.elementName} & ${e2.elementName} — ${synergy.label}`,
      synergyBadge: `${e1.elementName} + ${e2.elementName} (${synergy.label})`,
      synthesis: synthesisText,
      advice: adviceText,
      p1CardName: c1.name,
      p1Element: e1.elementName,
      p1Keywords: e1.keywords,
      p1Archetype: e1.loveArchetype,
      p2CardName: c2.name,
      p2Element: e2.elementName,
      p2Keywords: e2.keywords,
      p2Archetype: e2.loveArchetype,
    });
  }

  const overallScore = Math.round(totalScore / (compareCount || 1));

  let overallStatus = 'Yüksek Ruhsal Uyum & Aşk Rezonansı ✨';
  let overallSummary = `${p1Name} ve ${p2Name} arasındaki kart enerjileri %${overallScore} oranında güçlü bir manyetik çekim ve elementel ahenk gösteriyor. Karşılıklı kart dizilimi iki ruhun birbirine ayna olduğunu ve ortak bir frekansta buluştuğunu teyit ediyor.`;

  if (overallScore >= 90) {
    overallStatus = 'Kozmik Ruh Eşi & Kusursuz Uyum 🔥💍';
  } else if (overallScore < 80) {
    overallStatus = 'Dönüştürücü & Büyüten Tutkulu Bağ ⚡';
    overallSummary = `${p1Name} ve ${p2Name} birbirini derinden çeken fakat aynı zamanda dönüştüren güçlü bir enerjiye sahip. Zıtlıklar doğru yönetildiğinde aranızdaki bağ sarsılmaz bir güce dönüşebilir.`;
  }

  let bridgeAnalysis;
  if (bridgeCard) {
    const bridgeEl = getCardElement(bridgeCard.id);
    bridgeAnalysis = {
      title: 'Kadersel Köprü & Ortak Enerji Merkezi',
      cardName: bridgeCard.name,
      meaning: `${bridgeCard.name} (${bridgeEl.elementName} Elementi), ${p1Name} ve ${p2Name}'in birleştiği kadersel noktayı temsil ediyor. Bu bağın ana teması: ${bridgeEl.keywords.join(' • ')}. Birlikteyken hayatınızda en çok bu enerji büyüyecek.`,
    };
  }

  return {
    overallScore,
    overallStatus,
    overallSummary,
    pairs,
    bridgeAnalysis,
  };
}
