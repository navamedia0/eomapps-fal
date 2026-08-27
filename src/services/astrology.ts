import {
  Body,
  Equator,
  GeoVector,
  Horizon,
  MakeTime,
  Observer,
  SiderealTime,
  Ecliptic,
  type AstroTime,
} from 'astronomy-engine';
import { zodiacFromLongitude, type Zodiac, ZODIACS } from '@/services/zodiac';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';

export type BirthData = { date: Date; latitude: number; longitude: number };

export type AstroSnapshot = {
  julianDate: number;
  sunLongitude: number;
  altitude: number;
  azimuth: number;
};

export type BirthChart = AstroSnapshot & {
  sunSign: Zodiac;
  moonSign: Zodiac;
  risingSign: Zodiac;
  moonLongitude: number;
  risingLongitude: number;
};

export type PlanetKey =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

export type PlanetPosition = {
  key: PlanetKey;
  name: string;
  symbol: string;
  longitude: number;
  zodiac: Zodiac;
  signName: string;
  degree: number;
  minute: number;
  formattedDegree: string;
  house: number;
  isRetrograde: boolean;
  theme: string;
};

export type HouseData = {
  house: number;
  title: string;
  cuspLongitude: number;
  zodiac: Zodiac;
  signName: string;
  planets: PlanetKey[];
  area: string;
};

export type AspectData = {
  body1: PlanetKey;
  body2: PlanetKey;
  body1Name: string;
  body2Name: string;
  aspectName: 'Kavuşum' | 'Karşıt' | 'Üçgen' | 'Kare' | 'Altmışlık';
  angle: number;
  orb: number;
  type: 'harmonious' | 'challenging' | 'neutral';
  symbol: string;
  color: string;
  interpretation: string;
};

export type ElementDistribution = {
  fire: { count: number; percentage: number };
  earth: { count: number; percentage: number };
  air: { count: number; percentage: number };
  water: { count: number; percentage: number };
  dominant: 'Ateş' | 'Toprak' | 'Hava' | 'Su';
};

export type ModalityDistribution = {
  cardinal: { count: number; percentage: number };
  fixed: { count: number; percentage: number };
  mutable: { count: number; percentage: number };
  dominant: 'Öncü' | 'Sabit' | 'Değişken';
};

// 1. Aşk & Ruh Eşi Uyumu Verisi
export type LoveCompatibility = {
  soulmateSigns: {
    sign: Zodiac;
    signName: string;
    score: number;
    badge: string;
    reason: string;
  }[];
  passionSign: {
    sign: Zodiac;
    signName: string;
    score: number;
    reason: string;
  };
  dscSign: Zodiac;
  dscSignName: string;
  dscMeaning: string;
  challengingSign: {
    sign: Zodiac;
    signName: string;
    reason: string;
  };
};

// 2. Harita Yöneticisi & Baskın Gezegen
export type ChartRulerData = {
  rulerKey: PlanetKey;
  rulerName: string;
  rulerSymbol: string;
  signName: string;
  house: number;
  message: string;
};

export type DominantPlanetData = {
  planetKey: PlanetKey;
  name: string;
  symbol: string;
  signName: string;
  house: number;
  reason: string;
  trait: string;
};

// 3. Şans Noktası (Pars Fortunae)
export type FortunePointData = {
  longitude: number;
  zodiac: Zodiac;
  signName: string;
  degree: number;
  minute: number;
  house: number;
  formatted: string;
  meaning: string;
};

// 4. Ruhun Yaşam Amacı (Kuzey & Güney Ay Düğümleri)
export type LunarNodesData = {
  northNode: {
    longitude: number;
    zodiac: Zodiac;
    signName: string;
    degree: number;
    house: number;
    lifePurpose: string;
  };
  southNode: {
    longitude: number;
    zodiac: Zodiac;
    signName: string;
    degree: number;
    house: number;
    comfortZone: string;
  };
};

// 5. Kariyer ve İdeal Meslekler (MC)
export type CareerMCData = {
  mcLongitude: number;
  mcSign: Zodiac;
  mcSignName: string;
  careerFields: string[];
  leadershipStyle: string;
  successAdvice: string;
};

export type AdvancedAstroAnalyses = {
  love: LoveCompatibility;
  chartRuler: ChartRulerData;
  dominantPlanet: DominantPlanetData;
  fortunePoint: FortunePointData;
  lunarNodes: LunarNodesData;
  career: CareerMCData;
};

export type DetailedBirthChart = BirthChart & {
  planets: PlanetPosition[];
  houses: HouseData[];
  aspects: AspectData[];
  elements: ElementDistribution;
  modalities: ModalityDistribution;
  ascendantDegree: number;
  midheavenDegree: number;
  mcSign: Zodiac;
  advanced: AdvancedAstroAnalyses;
};

const normalize = (degrees: number) => (degrees % 360 + 360) % 360;

const PLANET_METADATA: Record<PlanetKey, { name: string; symbol: string; theme: string }> = {
  Sun: { name: 'Güneş', symbol: '☉', theme: 'Öz benlik, karakter ve yaşam enerjisi' },
  Moon: { name: 'Ay', symbol: '☽', theme: 'Bilinçaltı, duygusal dünya ve sezgiler' },
  Mercury: { name: 'Merkür', symbol: '☿', theme: 'Zeka, iletişim tarzı ve karar alma mekanizması' },
  Venus: { name: 'Venüs', symbol: '♀', theme: 'Aşk dili, çekim, estetik ve maddi değerler' },
  Mars: { name: 'Mars', symbol: '♂', theme: 'Tutku, cesaret, cinsel enerji ve mücadele azmi' },
  Jupiter: { name: 'Jüpiter', symbol: '♃', theme: 'Bolluk, şans kapıları, büyüme ve felsefe' },
  Saturn: { name: 'Satürn', symbol: '♄', theme: 'Karmik dersler, disiplin ve büyük hayat sınavları' },
  Uranus: { name: 'Uranüs', symbol: '♅', theme: 'Deha, özgürlük ve ani değişimler' },
  Neptune: { name: 'Neptün', symbol: '♆', theme: 'Hayaller, spiritüel derinlik ve ilham' },
  Pluto: { name: 'Plüton', symbol: '♇', theme: 'Dönüşüm, güç ve küllerinden yeniden doğuş' },
};

const HOUSE_AREAS: Record<number, { title: string; area: string }> = {
  1: { title: '1. Ev (Yükselen)', area: 'Kişilik, fiziksel beden ve dış dünyaya yansıtılan maske' },
  2: { title: '2. Ev (Maddiyat)', area: 'Para kazanma potansiyeli, gelirler ve özdeğer' },
  3: { title: '3. Ev (İletişim)', area: 'Zihin, yakın çevre, kardeşler ve kısa yolculuklar' },
  4: { title: '4. Ev (Yuva & Kökler)', area: 'Aile, yuva, iç huzur ve geçmiş bağlar' },
  5: { title: '5. Ev (Aşk & Yaratıcılık)', area: 'Aşk hayatı, flörtler, sahne, hobiler ve çocuklar' },
  6: { title: '6. Ev (Sağlık & Rutin)', area: 'Günlük çalışma düzeni, alışkanlıklar ve sağlık' },
  7: { title: '7. Ev (Evlilik & Ortaklık)', area: 'Ciddi ilişkiler, hayat arkadaşı ve uzun süreli ortaklıklar' },
  8: { title: '8. Ev (Dönüşüm & Gizem)', area: 'Büyük değişimler, sırlar, cinsellik ve ortak paralar' },
  9: { title: '9. Ev (Felsefe & Ufuklar)', area: 'Yüksek eğitim, inançlar, vizyon ve yurt dışı konuları' },
  10: { title: '10. Ev (Kariyer / MC)', area: 'Toplum önündeki başarı, kariyer zirvesi ve statü' },
  11: { title: '11. Ev (Gelecek & Çevre)', area: 'Sosyal çevre, arkadaşlar ve büyük gelecek idealleri' },
  12: { title: '12. Ev (Bilinçaltı & Karma)', area: 'Gizli dünyan, ruhsal şifa, rüyalar ve karmik çözülmeler' },
};

// Yükselen Burcun Geleneksel/Modern Yöneticisi
const SIGN_RULERS: Record<Zodiac, PlanetKey> = {
  Koc: 'Mars',
  Boga: 'Venus',
  Ikizler: 'Mercury',
  Yengec: 'Moon',
  Aslan: 'Sun',
  Basak: 'Mercury',
  Terazi: 'Venus',
  Akrep: 'Pluto',
  Yay: 'Jupiter',
  Oglak: 'Saturn',
  Kova: 'Uranus',
  Balik: 'Neptune',
};

// 12 Burcun Elementi
const SIGN_ELEMENTS: Record<Zodiac, 'Ateş' | 'Toprak' | 'Hava' | 'Su'> = {
  Koc: 'Ateş',
  Aslan: 'Ateş',
  Yay: 'Ateş',
  Boga: 'Toprak',
  Basak: 'Toprak',
  Oglak: 'Toprak',
  Ikizler: 'Hava',
  Terazi: 'Hava',
  Kova: 'Hava',
  Yengec: 'Su',
  Akrep: 'Su',
  Balik: 'Su',
};

// MC Burcuna Göre Kariyer ve Başarı Alanları
const MC_CAREER_MAP: Record<Zodiac, { fields: string[]; leadership: string; advice: string }> = {
  Koc: {
    fields: ['Girişimcilik & Startup', 'Yöneticilik', 'Mühendislik', 'Savunma & Güvenlik', 'Spor & Atletizm'],
    leadership: 'Cesur, öncü, risk alan ve kararlı liderlik tarzı.',
    advice: 'Kendi projelerinin başına geçmek ve bağımsız hareket etmek sana en büyük başarıyı getirir.',
  },
  Boga: {
    fields: ['Finans & Bankacılık', 'Gayrimenkul', 'Lüks Tasarım & Mimari', 'Gastronomi', 'Sanat Yönetimi'],
    leadership: 'Sağlam, güvenilir, krizlerde sarsılmayan pratik liderlik.',
    advice: 'Sabırlı yatırımlar ve somut değer üreten sektörlerde uzun vadeli servet inşa edebilirsin.',
  },
  Ikizler: {
    fields: ['Medya & Gazetecilik', 'Yazarlık & Yayıncılık', 'Dijital Pazarlama', 'Halkla İlişkiler', 'Dış Ticaret'],
    leadership: 'Hızlı, çok yönlü, iletişimi kuvvetli ve fikir odaklı liderlik.',
    advice: 'Tekdzelikten kaçınarak aynı anda birden fazla alanda bilgi ve iletişim gücünü parlat.',
  },
  Yengec: {
    fields: ['İnsan Kaynakları & Danışmanlık', 'Psikoloji & Terapi', 'Gastronomi', 'Eğitim', 'Otelcilik & Bakım'],
    leadership: 'Kollayıcı, empatik, ekibine aile güveni aşılayan sezgisel liderlik.',
    advice: 'İnsanların duygusal ihtiyaçlarını anlama ve güven bağı kurma yeteneğin kariyerinin anahtarıdır.',
  },
  Aslan: {
    fields: ['Üst Düzey Yöneticilik', 'Sahne Sanatları & Sinema', 'Yaratıcı Direktörlük', 'Lüks Marka', 'Siyaset'],
    leadership: 'Karizmatik, vizyoner, ilham veren ve merkezde duran liderlik.',
    advice: 'Sahneye çıkmaktan ve sorumluluk almaktan çekinme; ışığın insanları peşinden sürükler.',
  },
  Basak: {
    fields: ['Veri Analizi & Yazılım', 'Tıp & Sağlık Sektörü', 'Finansal Denetim', 'Editörlük', 'Kalite Güvence'],
    leadership: 'Detaycı, çözüm odaklı, sistemi tıkır tıkır işleten mükemmeliyetçi liderlik.',
    advice: 'Analitik zekan ve kaosu düzene çevirme kabiliyetin vazgeçilmez bir uzman olmanı sağlar.',
  },
  Terazi: {
    fields: ['Hukuk & Adalet', 'Diplomasi', 'Moda & Estetik Tasarım', 'Halkla İlişkiler', 'Sanat Küratörlüğü'],
    leadership: 'Adil, uzlaşmacı, nezaketle yöneten ve estetik vizyonu yüksek liderlik.',
    advice: 'İkili ilişkilerdeki denge gücünü ve adaleti merkeze alarak ortaklıklarla büyü.',
  },
  Akrep: {
    fields: ['Cerrahi & Tıp', 'Kriz Yönetimi & Risk Analizi', 'Psikiyatri', 'Stratejik Finans', 'İstihbarat/Dedektiflik'],
    leadership: 'Derin, stratejik, krizlerden güçlenerek çıkan dönüştürücü liderlik.',
    advice: 'Görünmeyeni okuma ve zor krizleri fırsata çevirme yeteneğin zirveye giden yolundur.',
  },
  Yay: {
    fields: ['Akademi & Yüksek Öğretim', 'Uluslararası Ticaret', 'Hukuk', 'Turizm & Havacılık', 'Felsefe & Yayıncılık'],
    leadership: 'Geniş vizyonlu, iyimser, sınırları aşan ve ufuk açan liderlik.',
    advice: 'Yabancı diller, küresel projeler ve büyük felsefi hedefler sana en büyük kapıları açar.',
  },
  Oglak: {
    fields: ['CEO & Kurumsal Yönetim', 'İnşaat & Mimarlık', 'Devlet & Kamu Hizmeti', 'Büyük Yatırımlar', 'Hukuk'],
    leadership: 'Disiplinli, saygın, otoriter ve uzun vadeli kaleler inşa eden liderlik.',
    advice: 'Zaman senin lehindedir; gençken attığın sabırlı adımlar seni olgun yaşta zirveye oturtur.',
  },
  Kova: {
    fields: ['Yazılım & Yapay Zeka', 'Uzay & Havacılık', 'Astroloji & Bilim', 'Sivil Toplum', 'Sosyal İnovasyon'],
    leadership: 'Sıra dışı, özgürlükçü, geleceği bugünden gören yenilikçi liderlik.',
    advice: 'Geleneksel kalıpları kırarak teknolojiyi ve kolektif faydayı ön plana çıkaran işlere odaklan.',
  },
  Balik: {
    fields: ['Sanat & Müzik', 'Sinema & Görsel Sanatlar', 'Psikoloji', 'Eczacılık & Şifa', 'Spiritüel Rehberlik'],
    leadership: 'Sezgisel, ilham dolu, sınırları aşan şefkatli liderlik.',
    advice: 'Mantığın tıkandığı yerde kalbinin sesini dinleyerek yaratıcı ve şifalı projelerde parla.',
  },
};

function calculateEclipticLongitude(body: Body, time: AstroTime): number {
  const vector = GeoVector(body, time, true);
  const ecl = Ecliptic(vector);
  return normalize(ecl.elon);
}

function checkRetrograde(body: Body, time: AstroTime): boolean {
  if (body === Body.Sun || body === Body.Moon) return false;
  const t1 = MakeTime(new Date(time.date.getTime() - 12 * 3600 * 1000));
  const t2 = MakeTime(new Date(time.date.getTime() + 12 * 3600 * 1000));
  const lon1 = calculateEclipticLongitude(body, t1);
  const lon2 = calculateEclipticLongitude(body, t2);
  const diff = (lon2 - lon1 + 540) % 360 - 180;
  return diff < 0;
}

export function calculateAstroSnapshot(data: BirthData): AstroSnapshot {
  const time: AstroTime = MakeTime(data.date);
  const observer = new Observer(data.latitude, data.longitude, 0);
  const equator = Equator(Body.Sun, time, observer, true, true);
  const horizon = Horizon(time, observer, equator.ra, equator.dec, 'normal');
  return {
    julianDate: time.ut,
    sunLongitude: calculateEclipticLongitude(Body.Sun, time),
    altitude: horizon.altitude,
    azimuth: horizon.azimuth,
  };
}

export function calculateBirthChart(data: BirthData): BirthChart {
  const snapshot = calculateAstroSnapshot(data);
  const time = MakeTime(data.date);
  const moonLongitude = calculateEclipticLongitude(Body.Moon, time);
  const siderealDegrees = normalize(SiderealTime(time) * 15 + data.longitude);
  const latitudeRadians = (data.latitude * Math.PI) / 180;
  const obliquityRadians = (23.439 * Math.PI) / 180;
  const risingLongitude = normalize(
    (Math.atan2(
      -Math.cos((siderealDegrees * Math.PI) / 180),
      Math.sin((siderealDegrees * Math.PI) / 180) * Math.cos(obliquityRadians) +
        Math.tan(latitudeRadians) * Math.sin(obliquityRadians),
    ) *
      180) /
      Math.PI +
      180,
  );

  return {
    ...snapshot,
    sunSign: zodiacFromLongitude(snapshot.sunLongitude),
    moonSign: zodiacFromLongitude(moonLongitude),
    risingSign: zodiacFromLongitude(risingLongitude),
    moonLongitude,
    risingLongitude,
  };
}

export function calculateDetailedBirthChart(data: BirthData): DetailedBirthChart {
  const baseChart = calculateBirthChart(data);
  const time = MakeTime(data.date);
  const siderealDegrees = normalize(SiderealTime(time) * 15 + data.longitude);
  const obliquityRadians = (23.439 * Math.PI) / 180;

  // Tepe Noktası (Medium Coeli / MC)
  const mcLongitude = normalize(
    (Math.atan2(
      Math.sin((siderealDegrees * Math.PI) / 180),
      Math.cos((siderealDegrees * Math.PI) / 180) * Math.cos(obliquityRadians),
    ) *
      180) /
      Math.PI,
  );

  const ascZodiacIndex = Math.floor(baseChart.risingLongitude / 30);

  // 10 Gezegenin Tamamı
  const planetKeys: PlanetKey[] = [
    'Sun',
    'Moon',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
  ];

  const planets: PlanetPosition[] = planetKeys.map((key) => {
    const body = Body[key];
    const longitude = calculateEclipticLongitude(body, time);
    const zodiac = zodiacFromLongitude(longitude);
    const signDegree = Math.floor(longitude % 30);
    const signMinute = Math.floor(((longitude % 30) - signDegree) * 60);

    const planetZodiacIndex = Math.floor(longitude / 30);
    const house = ((planetZodiacIndex - ascZodiacIndex + 12) % 12) + 1;
    const isRetrograde = checkRetrograde(body, time);
    const meta = PLANET_METADATA[key];

    return {
      key,
      name: meta.name,
      symbol: meta.symbol,
      longitude,
      zodiac,
      signName: ZODIAC_INFO[zodiac].name,
      degree: signDegree,
      minute: signMinute,
      formattedDegree: `${signDegree}° ${signMinute}'`,
      house,
      isRetrograde,
      theme: meta.theme,
    };
  });

  // 12 Ev Bilgileri
  const houses: HouseData[] = Array.from({ length: 12 }, (_, i) => {
    const houseNumber = i + 1;
    const houseZodiacIndex = (ascZodiacIndex + i) % 12;
    const houseZodiac = ZODIACS[houseZodiacIndex];
    const cuspLongitude = houseZodiacIndex * 30;
    const meta = HOUSE_AREAS[houseNumber];
    const residentPlanets = planets.filter((p) => p.house === houseNumber).map((p) => p.key);

    return {
      house: houseNumber,
      title: meta.title,
      cuspLongitude,
      zodiac: houseZodiac,
      signName: ZODIAC_INFO[houseZodiac].name,
      planets: residentPlanets,
      area: meta.area,
    };
  });

  // Gezegen Açıları
  const aspects: AspectData[] = [];
  const aspectRules = [
    { name: 'Kavuşum' as const, angle: 0, maxOrb: 8, type: 'neutral' as const, symbol: '☌', color: '#EAB308', meaning: 'İki gücün birleşimi ve yoğunlaşması' },
    { name: 'Karşıt' as const, angle: 180, maxOrb: 8, type: 'challenging' as const, symbol: '☍', color: '#F97316', meaning: 'Kutupluluk ve ilişkilerde denge arayışı' },
    { name: 'Üçgen' as const, angle: 120, maxOrb: 7, type: 'harmonious' as const, symbol: '△', color: '#10B981', meaning: 'Doğuştan gelen şans ve zahmetsiz akış' },
    { name: 'Kare' as const, angle: 90, maxOrb: 7, type: 'challenging' as const, symbol: '□', color: '#EF4444', meaning: 'Geliştiren zorluk ve içsel motivasyon' },
    { name: 'Altmışlık' as const, angle: 60, maxOrb: 5, type: 'harmonious' as const, symbol: '⚹', color: '#38BDF8', meaning: 'Fırsatlar ve emekle açığa çıkan yetenek' },
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const diff = Math.abs(p1.longitude - p2.longitude);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const rule of aspectRules) {
        const orb = Math.abs(angle - rule.angle);
        if (orb <= rule.maxOrb) {
          aspects.push({
            body1: p1.key,
            body2: p2.key,
            body1Name: p1.name,
            body2Name: p2.name,
            aspectName: rule.name,
            angle: rule.angle,
            orb: Math.round(orb * 10) / 10,
            type: rule.type,
            symbol: rule.symbol,
            color: rule.color,
            interpretation: `${p1.name} ${rule.symbol} ${p2.name}: ${rule.meaning}`,
          });
          break;
        }
      }
    }
  }

  // Element ve Nitelik Dağılımı
  const fireSigns: Zodiac[] = ['Koc', 'Aslan', 'Yay'];
  const earthSigns: Zodiac[] = ['Boga', 'Basak', 'Oglak'];
  const airSigns: Zodiac[] = ['Ikizler', 'Terazi', 'Kova'];
  const waterSigns: Zodiac[] = ['Yengec', 'Akrep', 'Balik'];

  let fireCount = 0;
  let earthCount = 0;
  let airCount = 0;
  let waterCount = 0;

  const cardinalSigns: Zodiac[] = ['Koc', 'Yengec', 'Terazi', 'Oglak'];
  const fixedSigns: Zodiac[] = ['Boga', 'Aslan', 'Akrep', 'Kova'];
  const mutableSigns: Zodiac[] = ['Ikizler', 'Basak', 'Yay', 'Balik'];

  let cardinalCount = 0;
  let fixedCount = 0;
  let mutableCount = 0;

  planets.forEach((p) => {
    const weight = p.key === 'Sun' || p.key === 'Moon' ? 2 : 1;

    if (fireSigns.includes(p.zodiac)) fireCount += weight;
    else if (earthSigns.includes(p.zodiac)) earthCount += weight;
    else if (airSigns.includes(p.zodiac)) airCount += weight;
    else if (waterSigns.includes(p.zodiac)) waterCount += weight;

    if (cardinalSigns.includes(p.zodiac)) cardinalCount += weight;
    else if (fixedSigns.includes(p.zodiac)) fixedCount += weight;
    else if (mutableSigns.includes(p.zodiac)) mutableCount += weight;
  });

  const totalPoints = fireCount + earthCount + airCount + waterCount;

  const elementCounts = [
    { name: 'Ateş' as const, count: fireCount },
    { name: 'Toprak' as const, count: earthCount },
    { name: 'Hava' as const, count: airCount },
    { name: 'Su' as const, count: waterCount },
  ];
  elementCounts.sort((a, b) => b.count - a.count);

  const modalityCounts = [
    { name: 'Öncü' as const, count: cardinalCount },
    { name: 'Sabit' as const, count: fixedCount },
    { name: 'Değişken' as const, count: mutableCount },
  ];
  modalityCounts.sort((a, b) => b.count - a.count);

  const elements: ElementDistribution = {
    fire: { count: fireCount, percentage: Math.round((fireCount / totalPoints) * 100) },
    earth: { count: earthCount, percentage: Math.round((earthCount / totalPoints) * 100) },
    air: { count: airCount, percentage: Math.round((airCount / totalPoints) * 100) },
    water: { count: waterCount, percentage: Math.round((waterCount / totalPoints) * 100) },
    dominant: elementCounts[0].name,
  };

  const modalities: ModalityDistribution = {
    cardinal: { count: cardinalCount, percentage: Math.round((cardinalCount / totalPoints) * 100) },
    fixed: { count: fixedCount, percentage: Math.round((fixedCount / totalPoints) * 100) },
    mutable: { count: mutableCount, percentage: Math.round((mutableCount / totalPoints) * 100) },
    dominant: modalityCounts[0].name,
  };

  // --- 5 YENİ GERÇEK ASTRONOMİK HESAPLAMA ---

  // 1. AŞK & RUH EŞİ UYUMU
  // 7. Ev (DSC - Alçalan Burç): Yükselen'in tam 180 karşısı
  const dscLongitude = (baseChart.risingLongitude + 180) % 360;
  const dscZodiac = zodiacFromLongitude(dscLongitude);
  const venusPlanet = planets.find((p) => p.key === 'Venus')!;
  const marsPlanet = planets.find((p) => p.key === 'Mars')!;

  const venusElement = SIGN_ELEMENTS[venusPlanet.zodiac];
  const marsElement = SIGN_ELEMENTS[marsPlanet.zodiac];

  // Venüs elementine göre uyumlu kardeş element
  const harmonicElements =
    venusElement === 'Toprak' || venusElement === 'Su' ? ['Toprak', 'Su'] : ['Ateş', 'Hava'];

  // DSC ve Venüs elementine göre en uyumlu 3 burç
  const candidateSigns = ZODIACS.filter((z) => harmonicElements.includes(SIGN_ELEMENTS[z]) && z !== baseChart.risingSign);
  const topSoulmate = dscZodiac;
  const secondSoulmate = candidateSigns.find((z) => z !== topSoulmate) || 'Boga';
  const thirdSoulmate = candidateSigns.find((z) => z !== topSoulmate && z !== secondSoulmate) || 'Balik';

  // Mars ile çekim/tutku burcu
  const passionZodiac = ZODIACS.find((z) => SIGN_ELEMENTS[z] === marsElement && z !== marsPlanet.zodiac) || marsPlanet.zodiac;

  // Zorlu / Karmik Sınav Burcu (Yükselen'e kare 90 derece burç)
  const challengeZodiac = ZODIACS[(ascZodiacIndex + 3) % 12];

  const love: LoveCompatibility = {
    dscSign: dscZodiac,
    dscSignName: ZODIAC_INFO[dscZodiac].name,
    dscMeaning: `7. Evin (Alçalan) ${ZODIAC_INFO[dscZodiac].name} burcunda: Bilinçaltında uzun vadeli hayat arkadaşı ve evlilikte ${ZODIAC_INFO[dscZodiac].name} niteliklerini arıyorsun.`,
    soulmateSigns: [
      {
        sign: topSoulmate,
        signName: ZODIAC_INFO[topSoulmate].name,
        score: 96,
        badge: 'Ruh Eşi & Evlilik',
        reason: `7. Evinin yöneticisi ve alçalan burcun. Birbirinizi sözsüz tamamlayacağınız en yüksek hayat arkadaşı enerjisi.`,
      },
      {
        sign: secondSoulmate,
        signName: ZODIAC_INFO[secondSoulmate].name,
        score: 89,
        badge: 'Romantik Aşk & Şefkat',
        reason: `Venüs'ün ${venusPlanet.signName} burcundaki romantik diliyle kusursuz rezonans kuran derin aşk uyumu.`,
      },
      {
        sign: thirdSoulmate,
        signName: ZODIAC_INFO[thirdSoulmate].name,
        score: 84,
        badge: 'Zihinsel & Ruhsal Uyum',
        reason: `Hayata aynı pencereden bakabildiğiniz, sohbetinden doyamayacağınız dostluk ve bağlılık sinerjisi.`,
      },
    ],
    passionSign: {
      sign: passionZodiac,
      signName: ZODIAC_INFO[passionZodiac].name,
      score: 93,
      reason: `Mars'ın ${marsPlanet.signName} burcundaki eylem ve tutku ateşiyle yoğun fiziksel çekim ve elektriklenme.`,
    },
    challengingSign: {
      sign: challengeZodiac,
      signName: ZODIAC_INFO[challengeZodiac].name,
      reason: `Haritanla 90° kare açı yapan karmik sınav burcun. Çekim yüksek olabilir ancak sabır ve olgunlaşma gerektirir.`,
    },
  };

  // 2. HARİTA YÖNETİCİSİ & BASKIN GEZEGEN
  const rulerKey = SIGN_RULERS[baseChart.risingSign];
  const rulerPlanet = planets.find((p) => p.key === rulerKey)!;
  const chartRuler: ChartRulerData = {
    rulerKey,
    rulerName: rulerPlanet.name,
    rulerSymbol: rulerPlanet.symbol,
    signName: rulerPlanet.signName,
    house: rulerPlanet.house,
    message: `Yükselen burcun ${ZODIAC_INFO[baseChart.risingSign].name} olduğu için haritanın asıl yöneticisi ${rulerPlanet.name}'dir. ${rulerPlanet.house}. Evde (${rulerPlanet.signName}) konumlanması, hayatının ana dümeninin bu alanda döndüğünü gösterir.`,
  };

  // Baskın Gezegen: En çok açı alan ve 1, 4, 7, 10 köşe evlerdeki gezegen
  const aspectCounts = new Map<PlanetKey, number>();
  aspects.forEach((a) => {
    aspectCounts.set(a.body1, (aspectCounts.get(a.body1) || 0) + 1);
    aspectCounts.set(a.body2, (aspectCounts.get(a.body2) || 0) + 1);
  });
  let maxScore = -1;
  let dominantKey: PlanetKey = 'Sun';
  planets.forEach((p) => {
    const angularBonus = [1, 4, 7, 10].includes(p.house) ? 3 : 0;
    const score = (aspectCounts.get(p.key) || 0) + angularBonus;
    if (score > maxScore) {
      maxScore = score;
      dominantKey = p.key;
    }
  });
  const dominantPlanetObj = planets.find((p) => p.key === dominantKey)!;
  const dominantPlanet: DominantPlanetData = {
    planetKey: dominantKey,
    name: dominantPlanetObj.name,
    symbol: dominantPlanetObj.symbol,
    signName: dominantPlanetObj.signName,
    house: dominantPlanetObj.house,
    reason: `Haritandaki en yüksek açı geometrisine ve ev gücüne sahip gezegen.`,
    trait: `${dominantPlanetObj.theme}. Karakterinde Güneş burcundan bile daha belirgin bir iz bırakır.`,
  };

  // 3. ŞANS NOKTASI (Pars Fortunae)
  // Gündüz Doğumu: ASC + Ay - Güneş | Gece Doğumu: ASC + Güneş - Ay
  const isDayBirth = baseChart.altitude > 0;
  const fortuneLongitude = isDayBirth
    ? normalize(baseChart.risingLongitude + baseChart.moonLongitude - baseChart.sunLongitude)
    : normalize(baseChart.risingLongitude + baseChart.sunLongitude - baseChart.moonLongitude);
  const fortuneZodiac = zodiacFromLongitude(fortuneLongitude);
  const fortuneDegree = Math.floor(fortuneLongitude % 30);
  const fortuneMinute = Math.floor(((fortuneLongitude % 30) - fortuneDegree) * 60);
  const fortuneZodiacIndex = Math.floor(fortuneLongitude / 30);
  const fortuneHouse = ((fortuneZodiacIndex - ascZodiacIndex + 12) % 12) + 1;

  const fortunePoint: FortunePointData = {
    longitude: fortuneLongitude,
    zodiac: fortuneZodiac,
    signName: ZODIAC_INFO[fortuneZodiac].name,
    degree: fortuneDegree,
    minute: fortuneMinute,
    house: fortuneHouse,
    formatted: `${fortuneDegree}° ${fortuneMinute}' ${ZODIAC_INFO[fortuneZodiac].name}`,
    meaning: `Şans Noktan ${fortuneHouse}. Evde (${ZODIAC_INFO[fortuneZodiac].name} burcunda): Antik formüle göre talihin ve maddi-manevi kısmetin en rahat aktığı bereket kapın. Bu ev ve burç niteliklerini besledikçe refahın artar.`,
  };

  // 4. RUHUN YAŞAM AMACI (Kuzey & Güney Ay Düğümleri)
  // NASA mean ascending lunar node astronomik formülü:
  const T = time.ut / 36525;
  const northNodeLongitude = normalize(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
  const northNodeZodiac = zodiacFromLongitude(northNodeLongitude);
  const northNodeDegree = Math.floor(northNodeLongitude % 30);
  const northNodeHouse = ((Math.floor(northNodeLongitude / 30) - ascZodiacIndex + 12) % 12) + 1;

  const southNodeLongitude = normalize(northNodeLongitude + 180);
  const southNodeZodiac = zodiacFromLongitude(southNodeLongitude);
  const southNodeDegree = Math.floor(southNodeLongitude % 30);
  const southNodeHouse = ((Math.floor(southNodeLongitude / 30) - ascZodiacIndex + 12) % 12) + 1;

  const lunarNodes: LunarNodesData = {
    northNode: {
      longitude: northNodeLongitude,
      zodiac: northNodeZodiac,
      signName: ZODIAC_INFO[northNodeZodiac].name,
      degree: northNodeDegree,
      house: northNodeHouse,
      lifePurpose: `Kuzey Ay Düğümün ${ZODIAC_INFO[northNodeZodiac].name} (${northNodeHouse}. Ev): Bu hayatta ruhunun öğrenmeye ve inşa etmeye geldiği asıl kader rotası. Bu burcun cesur erdemlerini benimsedikçe kapılar ardına kadar açılır.`,
    },
    southNode: {
      longitude: southNodeLongitude,
      zodiac: southNodeZodiac,
      signName: ZODIAC_INFO[southNodeZodiac].name,
      degree: southNodeDegree,
      house: southNodeHouse,
      comfortZone: `Güney Ay Düğümün ${ZODIAC_INFO[southNodeZodiac].name} (${southNodeHouse}. Ev): Geçmişten getirdiğin tanıdık konfor alanın. Seni güvende hissettirse de aşırı bağlandığında ruhsal gelişimini durduran eski alışkanlıklar.`,
    },
  };

  // 5. KARİYER VE İDEAL MESLEKLER (MC Tepe Noktası)
  const mcZodiac = zodiacFromLongitude(mcLongitude);
  const mcCareerMeta = MC_CAREER_MAP[mcZodiac];
  const career: CareerMCData = {
    mcLongitude,
    mcSign: mcZodiac,
    mcSignName: ZODIAC_INFO[mcZodiac].name,
    careerFields: mcCareerMeta.fields,
    leadershipStyle: mcCareerMeta.leadership,
    successAdvice: mcCareerMeta.advice,
  };

  const advanced: AdvancedAstroAnalyses = {
    love,
    chartRuler,
    dominantPlanet,
    fortunePoint,
    lunarNodes,
    career,
  };

  return {
    ...baseChart,
    planets,
    houses,
    aspects,
    elements,
    modalities,
    ascendantDegree: baseChart.risingLongitude,
    midheavenDegree: mcLongitude,
    mcSign: mcZodiac,
    advanced,
  };
}