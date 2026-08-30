export type RuneSpreadId = 1 | 3 | 5 | 9;

export type RuneSpreadDef = {
  id: RuneSpreadId | number;
  name: string;
  description: string;
  positions: string[];
  priceCoins: number;
  // Rün falının kendine has yorumlama tekniği: Tarot'un aksine rünler
  // MYTOLOJİK ve doğrudan/kehanet niteliklidir — sembolik hikaye anlatımından
  // çok, tanrısal bir "evet/hayır/dikkat" netliği taşır.
  readingTechnique: string;
};

// Otantik Nordik/Vikinglere ait rün falı açılımları — Tarot'un Kelt Haçı ya da
// At Nalı gibi düzenlerinin kopyası DEĞİL, rün geleneğinin kendi sayısal
// kutsallığından (3 Norn, 9 Dünya) türetilmiş açılımlar.
export const RUNE_SPREADS: RuneSpreadDef[] = [
  {
    id: 1,
    name: '1 Rün',
    description: 'Odin\'in Rünü — tek bir rün çekerek doğrudan, dolambaçsız bir cevap veya günün rehberliği.',
    positions: ['Odin\'in Rünü'],
    priceCoins: 0,
    readingTechnique: 'Tek rün, kehanet niteliğinde net ve doğrudan bir mesaj olarak yorumlanır — Tarot gibi şiirsel değil, bir kâhinin dosdoğru sözü gibi.',
  },
  {
    id: 3,
    name: '3 Rün',
    description: 'Norn Üçlüsü — kaderi ören üç kız kardeşin (Urd, Verdandi, Skuld) bakış açısıyla geçmiş, şimdi ve gelecek.',
    positions: ['Urd — Geçmişin Kökü (Ördüğü İplik)', 'Verdandi — Şimdi Dokunan (Oluş Halindeki İplik)', 'Skuld — Olması Gereken (Geleceğin İpliği)'],
    priceCoins: 0,
    readingTechnique: 'Üç Norn\'un ördüğü tek bir kader ipliği gibi düşünülmeli — üç rün ayrı ayrı değil, zamanın Urd\'dan Skuld\'a doğru akan tek bir örgüsü olarak birbirine bağlanarak yorumlanmalı.',
  },
  {
    id: 5,
    name: '5 Rün',
    description: 'Kuzey Haçı — bir konunun özünü ve dört yönden (üzerindeki etki, kökü, geçmişi, geleceği) gelen güçleri gösteren rün-taşı haçı.',
    positions: ['1. Konunun Özü (Merkez)', '2. Üzerindeki İlahi Etki (Üst)', '3. Kök / Temel (Alt)', '4. Geçmişten Gelen Güç (Sol)', '5. Yaklaşan Kader (Sağ)'],
    priceCoins: 30,
    readingTechnique: 'Merkezdeki rün konunun özüdür; diğer dört rün ona dört yönden (Nordik pusulanın dört köşesi gibi) etki eden güçlerdir. Yorumda merkez rün ile her yön arasında açık bir sebep-sonuç bağı kurulmalı.',
  },
  {
    id: 9,
    name: '9 Rün',
    description: 'Yggdrasil\'in 9 Dünyası — Odin\'in bilgeliği kazanmak için 9 gece Yggdrasil\'e asılı kaldığı efsaneye dayanan, kozmosun 9 katmanını temsil eden büyük açılım.',
    positions: [
      '1. Asgard — Tanrısal İrade & Kimlik',
      '2. Vanaheim — Bereket & Duygusal Zenginlik',
      '3. Ljusalfheim — İlham & Aydınlanma',
      '4. Midgard — Günlük Yaşam & Somut Gerçeklik',
      '5. Jotunheim — Karşılaşılan Dev Engeller',
      '6. Muspelheim — Tutku, Arzu & Dönüştürücü Ateş',
      '7. Niflheim — Bilinçaltı Korkular & Buzul Sessizlik',
      '8. Svartalfheim — Gizli Yetenekler & El Emeği Çaba',
      '9. Helheim — Kapanış, Miras & Bırakılması Gereken',
    ],
    priceCoins: 80,
    readingTechnique: 'Dokuz rün, Yggdrasil\'in üç katmanı (Üst dünyalar 1-3, Orta dünyalar 4-6, Alt dünyalar 7-9) halinde gruplanarak okunmalı — önce her katmanın kendi içindeki 3 rün bir arada yorumlanmalı, sonra üst-orta-alt arasındaki yükseliş/iniş hikayesi bütünsel olarak bağlanmalı.',
  },
];

export function findRuneSpread(id: RuneSpreadId | number | string): RuneSpreadDef {
  const spread = RUNE_SPREADS.find((entry) => entry.id === id || String(entry.id) === String(id));
  if (spread) return spread;

  const posCount = typeof id === 'number' && id > 0 ? id : 3;
  return {
    id: posCount,
    name: `${posCount} Rün Açılımı`,
    description: `${posCount} rünlük açılım.`,
    positions: Array.from({ length: posCount }, (_, i) => `${i + 1}. Rün`),
    priceCoins: 50,
    readingTechnique: 'Rünler doğrudan ve kehanet niteliğinde, sırasıyla yorumlanmalı.',
  };
}
