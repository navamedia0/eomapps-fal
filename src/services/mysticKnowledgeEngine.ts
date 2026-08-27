import kahveDb from '@/data/kahve_derin_veritabani.json';
import ruyaDb from '@/data/ruya_derin_veritabani.json';
import retorikDb from '@/data/falci_retorik_kaliplari.json';
import mysticDb from '@/data/tarot_katina_palm_derin.json';
import yuzDb from '@/data/yuz_fali_derin.json';

export interface CoffeeSymbolDetail {
  genel: string;
  ask: string;
  kariyer_para: string;
  uyari_golge: string;
}

export interface CoffeeCombination {
  semboller: string[];
  anlam: string;
  falci_yorumu: string;
}

/**
 * Kahve falı için fincan topografyasını, sembol kombinasyonlarını ve
 * 4 boyutlu analiz kurallarını AI promptuna entegre eden zenginleştirici.
 */
export function buildRichCoffeeContext(): string {
  const topografya = Object.entries(retorikDb.fincan_topografyasi_kullanim_rehberi)
    .map(([bolge, aciklama]) => `- [${bolge.toUpperCase()}]: ${aciklama}`)
    .join('\n');

  const sembolOrnekleri = Object.entries(kahveDb.semboller)
    .slice(0, 15)
    .map(([isim, detay]) => {
      const d = detay as CoffeeSymbolDetail;
      return `- ${isim.toUpperCase()}:\n  * Genel: ${d.genel}\n  * Aşk: ${d.ask}\n  * Kariyer/Maddi: ${d.kariyer_para}\n  * Uyarı/Gölge: ${d.uyari_golge}`;
    })
    .join('\n');

  const kombinasyonOrnekleri = (kahveDb.kombinasyonlar as CoffeeCombination[])
    .slice(0, 5)
    .map((k) => `- [${k.semboller.join(' + ').toUpperCase()}]: ${k.anlam} (Falcı Örneği: "${k.falci_yorumu}")`)
    .join('\n');

  const retorikGiris = retorikDb.giris_kaliplari.kahve.join('\n* ');
  const retorikGecis = retorikDb.gecis_ve_baglama_kaliplari.slice(0, 4).join('\n* ');
  const retorikKapanis = retorikDb.kapani_rituel_ve_dilek_kaliplari.slice(0, 3).join('\n* ');

  return `
--- MİSTİK VE KADİM KAHVE FALI BİLGİ BANKASI REHBERİ ---

1. FİNCAN TOPOGRAFYASI VE KONUMSAL OKUMA KURALLARI:
${topografya}

2. DÖRT BOYUTLU SEMBOL OKUMA DERİNLİĞİ:
${sembolOrnekleri}

3. SEMBOL KOMBİNASYONU VE İKİLİ ETKİ ÖRNEKLERİ:
${kombinasyonOrnekleri}

4. GERÇEK FALCI VE MEDYUM ÜSLUP / HİTABET REHBERİ:
* Giriş/Aura Sezgisi:*
* ${retorikGiris}
* Geçiş ve Gizem Bağlaçları:*
* ${retorikGecis}
* Uğurlu Kapanış ve Niyet Mühürleme:*
* ${retorikKapanis}
---`;
}

/**
 * Rüya yorumu için Jungiyen psikanaliz arketiplerini, halk tabirlerini ve
 * derin içgörü sorularını derleyen zenginleştirici.
 */
export function buildRichDreamContext(): string {
  const arketipler = Object.entries(ruyaDb.psikanalitik_arketipler)
    .map(([key, val]: [string, any]) => `- [${val.arketip}]: ${val.anlam} (${val.analiz_rehberi || ''})`)
    .join('\n');

  const yayginTemalar = Object.entries(ruyaDb.yaygin_ruya_temalari)
    .map(([tema, val]: [string, any]) => `- ${tema.toUpperCase()}: Psikanaliz: ${val.psikanaliz} | Halk: ${val.halk_tabiri} | Sentez: ${val.sentez_yorum}`)
    .join('\n');

  const sorular = ruyaDb.derin_soru_ve_içgörü_kaliplari.map((s) => `* "${s}"`).join('\n');

  return `
--- MİSTİK & PSİKANALİTİK RÜYA BİLGİ BANKASI ---

1. JUNGIYEN VE FREUDIEN BİLİNÇALTI ARKETİPLERİ:
${arketipler}

2. TEMEL RÜYA SENARYOLARI VE ÇÖZÜMLEMELERİ:
${yayginTemalar}

3. SOHBETİ DERİNLEŞTİREN İÇGÖRÜ SORULARI (Kapanışta ilham alabileceğin örnek sorular):
${sorular}
---`;
}

/**
 * Yüz Falı / İlmi Sima için 3 ana bölge, organ ve hat sembolizmini derleyen zenginleştirici.
 */
export function buildRichFaceContext(): string {
  const ucBolge = Object.entries(yuzDb.uc_ana_bolge)
    .map(([bolge, val]: [string, any]) => `- [${bolge.toUpperCase()}] (${val.yas_donemi}): ${val.temsil_ettigi} — Analiz Anahtarı: ${val.analiz_anahtari}`)
    .join('\n');

  const organlar = Object.entries(yuzDb.yuz_organ_ve_hat_sembolizmi)
    .map(([organ, detaylar]: [string, any]) => {
      const altMaddeler = Object.entries(detaylar)
        .map(([tip, aciklama]) => `    * ${tip.replace(/_/g, ' ')}: ${aciklama}`)
        .join('\n');
      return `  - ${organ.toUpperCase()}:\n${altMaddeler}`;
    })
    .join('\n');

  const benler = Object.entries(yuzDb.ozel_isaretler_ve_benler)
    .map(([ben, aciklama]) => `  - ${ben.replace(/_/g, ' ').toUpperCase()}: ${aciklama}`)
    .join('\n');

  return `
--- KADİM İLMİ SİMA VE MIAN XIANG YÜZ OKUMA BİLGİ BANKASI ---

1. YÜZÜN ÜÇ TEMEL KADER VE YAŞAM BÖLGESİ:
${ucBolge}

2. ORGAN VE HAT SEMBOLİZMİ (FİZYONOMİ ANALİZİ):
${organlar}

3. ÖZEL İŞARETLER, BENLER VE AURA ÇİZGİLERİ:
${benler}
---`;
}

/**
 * Tarot, Katina ve El Falı derin kombinasyonlarını döndüren yardımcı.
 */
export function buildRichMysticContext(kind: 'tarot' | 'katina' | 'palm'): string {
  if (kind === 'tarot') {
    const komb = (mysticDb.tarot_kombinasyonlari || [])
      .map((k: any) => `- ${k.kartlar.join(' + ')} (${k.tema}): ${k.derin_yorum}`)
      .join('\n');
    return `\n\n--- DERİN TAROT KOMBİNASYONLARI ---\n${komb}\n---`;
  }
  if (kind === 'katina') {
    const kat = Object.entries(mysticDb.katina_derin_dinamikler || {})
      .map(([k, v]) => `- [${k.toUpperCase()}]: ${v}`)
      .join('\n');
    return `\n\n--- DERİN KATİNA İLİŞKİ DİNAMİKLERİ ---\n${kat}\n---`;
  }
  if (kind === 'palm') {
    const palm = Object.entries(mysticDb.el_fali_derin_topografya || {})
      .map(([k, v]: [string, any]) => `- [${k.toUpperCase()}] (${v.konum}): ${v.anlam}`)
      .join('\n');
    return `\n\n--- DERİN EL FALI TOPOGRAFYASI VE ÖZEL İŞARETLER ---\n${palm}\n---`;
  }
  return '';
}
