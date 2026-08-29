import type { TarotOrientation } from '@/services/tarot';

export type TarotKeywordsDef = {
  upright: string[];
  reversed: string[];
};

export const TAROT_KEYWORDS: Record<string, TarotKeywordsDef> = {
  // --- BÜYÜK ARKANA (22 KART) ---
  deli: {
    upright: ['Masumiyet', 'Yeni Başlangıç', 'Özgürlük'],
    reversed: ['Pervasızlık', 'Dikkatsizlik', 'Risk'],
  },
  buyucu: {
    upright: ['İrade', 'Yaratım Gücü', 'Ustalık'],
    reversed: ['Manipülasyon', 'İllüzyon', 'Güç Kaybı'],
  },
  'bas-rahibe': {
    upright: ['Sezgi', 'Gizem', 'İçsel Bilgelik'],
    reversed: ['Yüzeysellik', 'Gizli Düşmanlık', 'Bastırılmış Duygu'],
  },
  imparatorice: {
    upright: ['Bereket', 'Şefkat', 'Yaratıcılık'],
    reversed: ['Bağımlılık', 'Kısırlık', 'İhmal'],
  },
  imparator: {
    upright: ['Otorite', 'Düzen', 'İstikrar'],
    reversed: ['Tiranlık', 'Katılık', 'Disiplinsizlik'],
  },
  aziz: {
    upright: ['Rehberlik', 'İnanç', 'Gelenek'],
    reversed: ['Dogmatizm', 'Uyumsuzluk', 'İsyan'],
  },
  asiklar: {
    upright: ['Aşk', 'Uyum', 'Ruh Bağı'],
    reversed: ['Kararsızlık', 'Uyumsuzluk', 'Ayrılık'],
  },
  'savas-arabasi': {
    upright: ['Zafer', 'İrade', 'Kontrol'],
    reversed: ['Kontrol Kaybı', 'Yıkım', 'Saldırganlık'],
  },
  guc: {
    upright: ['Cesaret', 'Sabır', 'İçsel Güç'],
    reversed: ['Zayıflık', 'Korku', 'Özgüvensizlik'],
  },
  ermis: {
    upright: ['Bilgelik', 'İçsel Arayış', 'Rehber Işık'],
    reversed: ['İzolasyon', 'Yalnızlık', 'Katılık'],
  },
  'kader-carki': {
    upright: ['Şans', 'Talih', 'Dönüm Noktası'],
    reversed: ['Talihsizlik', 'Direnç', 'Kırılma'],
  },
  adalet: {
    upright: ['Hakikat', 'Denge', 'Dürüstlük'],
    reversed: ['Haksızlık', 'Önyargı', 'Dengesizlik'],
  },
  'asilan-adam': {
    upright: ['Fedakarlık', 'Teslimiyet', 'Yeni Bakış'],
    reversed: ['Bencillik', 'Direnç', 'Çıkmaz'],
  },
  olum: {
    upright: ['Dönüşüm', 'Yenilenme', 'Kaçınılmaz Son'],
    reversed: ['Değişime Direnç', 'Durgunluk', 'Takıntı'],
  },
  denge: {
    upright: ['Uyum', 'İtidal', 'Sabır'],
    reversed: ['Aşırılık', 'Dengesizlik', 'Sabırsızlık'],
  },
  seytan: {
    upright: ['Tutku', 'Bağımlılık', 'Gölge Yönler'],
    reversed: ['Özgürleşme', 'Uyanış', 'Prangaları Kırma'],
  },
  kule: {
    upright: ['Ani Yıkım', 'Aydınlanma', 'Radikal Değişim'],
    reversed: ['Felaketten Kaçış', 'Direnç', 'Bastırma'],
  },
  yildiz: {
    upright: ['Umut', 'İlham', 'İyileşme'],
    reversed: ['Umutsuzluk', 'Karamsarlık', 'İnançsızlık'],
  },
  ay: {
    upright: ['Sezgi', 'İllüzyon', 'Bilinçaltı'],
    reversed: ['Sırların Çözülmesi', 'Berraklık', 'Korkuları Aşma'],
  },
  gunes: {
    upright: ['Neşe', 'Başarı', 'Canlılık'],
    reversed: ['Geçici Karamsarlık', 'Ego', 'Gölgelenme'],
  },
  mahkeme: {
    upright: ['Uyanış', 'Hesaplaşma', 'Yeniden Doğuş'],
    reversed: ['Pişmanlık', 'Kendini Suçlama', 'Tereddüt'],
  },
  dunya: {
    upright: ['Tamamlanma', 'Bütünlük', 'Zafer'],
    reversed: ['Yarım Kalmışlık', 'Gecikme', 'Eksiklik'],
  },

  // --- KUPA TAKIMI (SU - DUYGU & AŞK) ---
  'kupa-asi': {
    upright: ['Saf Sevgi', 'Yeni Başlangıç', 'İlham'],
    reversed: ['Duygusal Boşluk', 'Bastırılmış Hisler', 'Kırgınlık'],
  },
  'kupa-ikilisi': {
    upright: ['Karşılıklı Aşk', 'Uyum', 'Ruh Eşi'],
    reversed: ['Uyumsuzluk', 'Soğukluk', 'İletişimsizlik'],
  },
  'kupa-uclusu': {
    upright: ['Kutlama', 'Dostluk', 'Birlik ve Neşe'],
    reversed: ['Dedikodu', 'Dışlanma', 'Aşırılık'],
  },
  'kupa-dortlusu': {
    upright: ['Bıkkınlık', 'İçe Kapanma', 'Fırsatı Kaçırma'],
    reversed: ['Farkındalık', 'Harekete Geçme', 'Yeniden İlgi'],
  },
  'kupa-beslisi': {
    upright: ['Kayıp', 'Pişmanlık', 'Yas ve Hüzün'],
    reversed: ['Kabulleniş', 'İyileşme', 'Umudun Doğuşu'],
  },
  'kupa-altilisi': {
    upright: ['Nostalji', 'Çocukluk', 'Tatlı Anılar'],
    reversed: ['Geçmişe Takılma', 'Büyüme Korkusu', 'Olgunlaşma'],
  },
  'kupa-yedilisi': {
    upright: ['Hayaller', 'Çoklu Seçenekler', 'İllüzyon'],
    reversed: ['Netlik', 'Gerçekle Yüzleşme', 'Doğru Karar'],
  },
  'kupa-sekizlisi': {
    upright: ['Vazgeçiş', 'Ruhsal Yolculuk', 'Terk Etme'],
    reversed: ['Geri Dönüş', 'Kararsızlık', 'Korku'],
  },
  'kupa-dokuzlusu': {
    upright: ['Dileklerin Kabulü', 'Tatmin', 'Mutluluk'],
    reversed: ['Doyumsuzluk', 'Kibir', 'Yüzeysel Zevk'],
  },
  'kupa-onlusu': {
    upright: ['Aile Huzuru', 'Sonsuz Saadet', 'Tam Bütünlük'],
    reversed: ['Aile Çatışması', 'Huzursuzluk', 'Kopukluk'],
  },
  'kupa-prensi': {
    upright: ['Romantik Haber', 'Masumiyet', 'Sezgisel Mesaj'],
    reversed: ['Duygusal Güvensizlik', 'Kırılganlık', 'Kötü Haber'],
  },
  'kupa-sovalyesi': {
    upright: ['Romantik Teklif', 'Cazibe', 'Tutkulu Yolculuk'],
    reversed: ['Aldatma', 'Duygusal Dengesizlik', 'Gerçekdışılık'],
  },
  'kupa-kralicesi': {
    upright: ['Şefkat', 'Derin Sezgi', 'Duygusal Bilgelik'],
    reversed: ['Aşırı Duygusallık', 'Bağımlılık', 'Kıskançlık'],
  },
  'kupa-krali': {
    upright: ['Duygusal Olgunluk', 'Cömertlik', 'Merhamet'],
    reversed: ['Duygu Sömürüsü', 'Soğukluk', 'Manipülasyon'],
  },

  // --- DEĞNEK TAKIMI (ATEŞ - TUTKU & EYLEM) ---
  'degnek-asi': {
    upright: ['Yeni Kıvılcım', 'Tutku', 'Yaratıcı Girişim'],
    reversed: ['Gecikme', 'İlham Eksikliği', 'Enerji Kaybı'],
  },
  'degnek-ikilisi': {
    upright: ['Gelecek Planı', 'Vizyon', 'Karar Aşaması'],
    reversed: ['Korkaklık', 'Kararsızlık', 'Kısıtlanma'],
  },
  'degnek-uclusu': {
    upright: ['Genişleme', 'Yeni Ufuklar', 'İlerleme'],
    reversed: ['Engeller', 'Bekleyiş', 'Hayal Kırıklığı'],
  },
  'degnek-dortlusu': {
    upright: ['Yuva Huzuru', 'Kutlama', 'İstikrar'],
    reversed: ['Geçici Huzursuzluk', 'Taşınma Stresi', 'Gecikme'],
  },
  'degnek-beslisi': {
    upright: ['Rekabet', 'Çatışma', 'Fikir Ayrılığı'],
    reversed: ['Uzlaşma', 'Çatışmanın Bitmesi', 'Kaçış'],
  },
  'degnek-altilisi': {
    upright: ['Zafer', 'Takdir Toplama', 'Başarı'],
    reversed: ['Kibir', 'Başarısızlık', 'Geciken Takdir'],
  },
  'degnek-yedilisi': {
    upright: ['Cesur Savunma', 'Direnç', 'Meydan Okuma'],
    reversed: ['Pes Etme', 'Tükenmişlik', 'Yalnız Kalma'],
  },
  'degnek-sekizlisi': {
    upright: ['Hızlı Gelişme', 'Müjdeli Haber', 'Hareket'],
    reversed: ['Gecikme', 'Yanlış Anlaşılma', 'Durgunluk'],
  },
  'degnek-dokuzlusu': {
    upright: ['Son Direniş', 'Sebat', 'Tedbirlilik'],
    reversed: ['Tükenme', 'Savunmasızlık', 'İnatçılık'],
  },
  'degnek-onlusu': {
    upright: ['Ağır Sorumluluk', 'Yük', 'Tükenmişlik'],
    reversed: ['Yükü Hafifletme', 'Teslimiyet', 'Rahatlama'],
  },
  'degnek-prensi': {
    upright: ['Heyecanlı Fikir', 'Keşif', 'Yeni Macera'],
    reversed: ['Kararsızlık', 'Tembellik', 'Sabırsızlık'],
  },
  'degnek-sovalyesi': {
    upright: ['Cesur Atılım', 'Enerji', 'Macera Ruhu'],
    reversed: ['Acelecilik', 'Öfke', 'Düşüncesizce Risk'],
  },
  'degnek-kralicesi': {
    upright: ['Karizma', 'Özgüven', 'Canlılık'],
    reversed: ['Kıskançlık', 'Bencillik', 'Öfke Patlaması'],
  },
  'degnek-krali': {
    upright: ['Liderlik', 'Vizyonerlik', 'Girişimci Güç'],
    reversed: ['Otoriterlik', 'Katılık', 'Acele Kararlar'],
  },

  // --- KILIÇ TAKIMI (HAVA - ZİHİN & GERÇEK) ---
  'kilic-asi': {
    upright: ['Zihinsel Netlik', 'Hakikat', 'Büyük Zafer'],
    reversed: ['Kafa Karışıklığı', 'Yanılgı', 'Yalanlar'],
  },
  'kilic-ikilisi': {
    upright: ['Çıkmaz', 'Kararsızlık', 'Ateşkes'],
    reversed: ['Gözlerin Açılması', 'Zorunlu Seçim', 'Gerçekler'],
  },
  'kilic-uclusu': {
    upright: ['Kalp Kırıklığı', 'Keder', 'Ayrılık Acısı'],
    reversed: ['İyileşme Süreci', 'Affetme', 'Acının Dinmesi'],
  },
  'kilic-dortlusu': {
    upright: ['Dinlenme', 'Zihinsel Mola', 'İyileşme'],
    reversed: ['Yeniden Canlanma', 'Stres', 'Uyanış'],
  },
  'kilic-beslisi': {
    upright: ['Bencil Zafer', 'Çatışma', 'Kırgınlık'],
    reversed: ['Uzlaşma', 'Pişmanlık', 'Zararı Kabul Etme'],
  },
  'kilic-altilisi': {
    upright: ['Zorluktan Uzaklaşma', 'Geçiş', 'Huzura Yolculuk'],
    reversed: ['Geçmişe Bağlanma', 'Fırtınalı Dönem', 'Çıkmaz'],
  },
  'kilic-yedilisi': {
    upright: ['Gizlilik', 'Strateji', 'Kurnazlık'],
    reversed: ['İtiraflar', 'Yakalanma', 'Dürüstlük'],
  },
  'kilic-sekizlisi': {
    upright: ['Zihinsel Tutsaklık', 'Çaresizlik Hissi', 'Sınırlanma'],
    reversed: ['Özgürleşme', 'Çözüm Bulma', 'Güç Toplama'],
  },
  'kilic-dokuzlusu': {
    upright: ['Gece Kabusları', 'Kaygı', 'Suçluluk'],
    reversed: ['Korkularla Yüzleşme', 'Umut', 'Rahatlama'],
  },
  'kilic-onlusu': {
    upright: ['Kaçınılmaz Bitiş', 'Dibi Görme', 'Yeni Şafak'],
    reversed: ['Küllerinden Doğuş', 'İyileşme', 'Geçmişi Bırakma'],
  },
  'kilic-prensi': {
    upright: ['Merak', 'Keskin Zeka', 'Uyanıklık'],
    reversed: ['Dedikodu', 'Saldırgan Sözler', 'Kurnazlık'],
  },
  'kilic-sovalyesi': {
    upright: ['Hızlı Hamle', 'Keskin Zeka', 'Hırs ve Atılım'],
    reversed: ['Saldırganlık', 'Sabırsızlık', 'Düşüncesiz Eylem'],
  },
  'kilic-kralicesi': {
    upright: ['Bağımsızlık', 'Keskin Zeka', 'Dürüstlük'],
    reversed: ['Soğukluk', 'Acımasız Eleştiri', 'Kin'],
  },
  'kilic-krali': {
    upright: ['Akıl ve Mantık', 'Otorite', 'Adalet'],
    reversed: ['Zalimlik', 'Bencillik', 'Zihinsel Baskı'],
  },

  // --- TILSIM TAKIMI (TOPRAK - MADDE & GÜVENLİK) ---
  'tilsim-asi': {
    upright: ['Maddi Fırsat', 'Bolluk', 'Sağlam Başlangıç'],
    reversed: ['Kaçan Fırsat', 'Maddi Kayıp', 'İstikrarsızlık'],
  },
  'tilsim-ikilisi': {
    upright: ['Denge', 'Esneklik', 'Çok Yönlülük'],
    reversed: ['Dengesizlik', 'Aşırı Yük', 'Maddi Kaos'],
  },
  'tilsim-uclusu': {
    upright: ['Ustalık', 'Takım Çalışması', 'İnşa ve Emek'],
    reversed: ['Uyumsuzluk', 'Kalitesiz İş', 'İletişim Kopukluğu'],
  },
  'tilsim-dortlusu': {
    upright: ['Güvenlik Arayışı', 'Birikim', 'Tutuculuk'],
    reversed: ['Aşırı Harcama', 'Bırakmayı Öğrenme', 'Cömertlik'],
  },
  'tilsim-beslisi': {
    upright: ['Maddi Darlık', 'Yalnızlık', 'Dışlanma'],
    reversed: ['Maddi İyileşme', 'Yardım Eli', 'Umut Kapısı'],
  },
  'tilsim-altilisi': {
    upright: ['Cömertlik', 'Paylaşım', 'Yardım ve Destek'],
    reversed: ['Borç', 'Bencillik', 'Adaletsiz Paylaşım'],
  },
  'tilsim-yedilisi': {
    upright: ['Sabır', 'Emek', 'Hasat Beklentisi'],
    reversed: ['Sabırsızlık', 'Boşa Giden Emek', 'Tembellik'],
  },
  'tilsim-sekizlisi': {
    upright: ['Zanaat', 'Çok Çalışma', 'Ustalık Yolunda'],
    reversed: ['Hilesiz Emek', 'Motivasyon Eksikliği', 'Tembellik'],
  },
  'tilsim-dokuzlusu': {
    upright: ['Maddi Bağımsızlık', 'Refah', 'Özgüven'],
    reversed: ['Yalnızlık', 'Gösteriş', 'Maddi Güvensizlik'],
  },
  'tilsim-onlusu': {
    upright: ['Kalıcı Refah', 'Aile Mirası', 'Güvence'],
    reversed: ['Miras Çatışması', 'Maddi Kayıp', 'Aile Sorunları'],
  },
  'tilsim-prensi': {
    upright: ['Pratik Öğrenme', 'Fırsat Haberi', 'Azim'],
    reversed: ['Tembellik', 'Kaçan Fırsat', 'Odaklanamama'],
  },
  'tilsim-sovalyesi': {
    upright: ['Çalışkanlık', 'Güvenilirlik', 'Sabırlı İlerleme'],
    reversed: ['Tembellik', 'Durgunluk', 'İnatçılık'],
  },
  'tilsim-kralicesi': {
    upright: ['Bereket', 'Şefkat', 'Pratik Anaçlık'],
    reversed: ['Maddi Endişe', 'İhmalkarlık', 'Bağımlılık'],
  },
  'tilsim-krali': {
    upright: ['Finansal Güç', 'Bereket', 'Güvenilirlik'],
    reversed: ['Açgözlülük', 'İnat', 'Maddiyatçılık'],
  },
};

export function getTarotKeywordList(cardId: string, orientation: TarotOrientation = 'upright'): string[] {
  const entry = TAROT_KEYWORDS[cardId];
  if (!entry) return [];
  return orientation === 'reversed' ? entry.reversed : entry.upright;
}

export function getTarotKeywords(cardId: string, orientation: TarotOrientation = 'upright'): string {
  const list = getTarotKeywordList(cardId, orientation);
  return list.join(' • ');
}
