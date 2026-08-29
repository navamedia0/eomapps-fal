import type { TarotOrientation } from './tarot';

const MAJOR_KEYWORDS: Record<string, { upright: string[]; reversed: string[] }> = {
  deli: {
    upright: ['Yeni Başlangıç', 'Masumiyet', 'Özgür Ruh'],
    reversed: ['Dikkatsizlik', 'Risk', 'Kararsızlık'],
  },
  buyucu: {
    upright: ['Güç', 'Beceri', 'Yaratıcılık'],
    reversed: ['Yanılsama', 'Güvensizlik', 'Kullanılmayan Güç'],
  },
  bas_rahibe: {
    upright: ['Sezgi', 'Gizem', 'İçsel Bilgelik'],
    reversed: ['Sırların Açığa Çıkması', 'Yüzeysellik', 'Kopukluk'],
  },
  imparatorice: {
    upright: ['Bereket', 'Doğurganlık', 'Sevgi'],
    reversed: ['Bağımlılık', 'Yaratıcı Tıkanıklık', 'İhmal'],
  },
  imparator: {
    upright: ['Otorite', 'Disiplin', 'Liderlik'],
    reversed: ['Zorbalık', 'Kontrol Kaybı', 'Esneklik Eksikliği'],
  },
  aziz: {
    upright: ['Gelenek', 'Manevi Rehberlik', 'İnanç'],
    reversed: ['Kalıpları Kırma', 'Geleneklere İsyan', 'Bireysellik'],
  },
  asiklar: {
    upright: ['Aşk', 'Uyum', 'Önemli Seçim'],
    reversed: ['Uyumsuzluk', 'Yanlış Tercih', 'Çatışma'],
  },
  savas_arabasi: {
    upright: ['Zafer', 'İrade', 'Hedefe Odaklanma'],
    reversed: ['Yön Kaybı', 'Saldırganlık', 'Engeller'],
  },
  guc: {
    upright: ['Cesaret', 'Şefkat', 'İçsel Dayanıklılık'],
    reversed: ['Özgüvensizlik', 'Zaafiyet', 'Korku'],
  },
  ermis: {
    upright: ['İçsel Arayış', 'Yalnızlık', 'Bilgelik'],
    reversed: ['İzolasyon', 'Yalnızlık Hissi', 'Geri Çekilme'],
  },
  kader_carki: {
    upright: ['Şans', 'Kader', 'Dönüm Noktası'],
    reversed: ['Kötü Şans', 'Direnç', 'Durgunluk'],
  },
  adalet: {
    upright: ['Dürüstlük', 'Hak', 'Denge'],
    reversed: ['Haksızlık', 'Sorumsuzluk', 'Önyargı'],
  },
  asilan_adam: {
    upright: ['Teslimiyet', 'Yeni Bakış Açısı', 'Fedakarlık'],
    reversed: ['Gereksiz Erteleme', 'Direnç', 'Durgunluk'],
  },
  olum: {
    upright: ['Dönüşüm', 'Bitişler', 'Yenilenme'],
    reversed: ['Değişime Direnç', 'Korku', 'Geçmişe Takılı Kalma'],
  },
  denge: {
    upright: ['Sabır', 'Uyum', 'Ölçülülük'],
    reversed: ['Dengesizlik', 'Aşırılık', 'Sabırsızlık'],
  },
  seytan: {
    upright: ['Bağımlılık', 'Maddiyat', 'Gölge Yönler'],
    reversed: ['Özgürleşme', 'Farkındalık', 'Bağları Koparma'],
  },
  kule: {
    upright: ['Ani Yıkım', 'Uyanış', 'Köklü Değişim'],
    reversed: ['Felaketten Kaçınma', 'Korku', 'Yıkımı Erteleme'],
  },
  yildiz: {
    upright: ['Umut', 'İlham', 'Şifa'],
    reversed: ['Umutsuzluk', 'İnanç Kaybı', 'Karamsarlık'],
  },
  ay: {
    upright: ['Sezgiler', 'Bilinçaltı', 'İllüzyon'],
    reversed: ['Gerçeklerin Açığa Çıkması', 'Korkuları Aşma', 'Netlik'],
  },
  gunes: {
    upright: ['Mutluluk', 'Canlılık', 'Aydınlanma'],
    reversed: ['Geçici Bulutlar', 'Aşırı İyimserlik', 'Geciken Neşe'],
  },
  mahkeme: {
    upright: ['Uyanış', 'Hesaplaşma', 'Yeniden Doğuş'],
    reversed: ['Kendini Suçlama', 'Kararsızlık', 'Görmezden Gelme'],
  },
  dunya: {
    upright: ['Tamamlanma', 'Bütünlük', 'Başarı'],
    reversed: ['Yarım Kalan İşler', 'Gecikme', 'Eksiklik'],
  },
};

export function getTarotKeywordList(cardId: string, orientation: TarotOrientation = 'upright'): string[] {
  const normId = cardId.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const found = MAJOR_KEYWORDS[normId];
  if (found) {
    return orientation === 'reversed' ? found.reversed : found.upright;
  }
  return orientation === 'reversed' ? ['Dönüşüm', 'İçsel Ders', 'Farkındalık'] : ['Işık', 'Gelişim', 'Fırsat'];
}
