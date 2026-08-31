import type { TarotOrientation } from './tarot';

export interface CardKeywordData {
  upright: string[];
  reversed: string[];
}

export const TAROT_ALL_KEYWORDS: Record<string, CardKeywordData> = {
  // --- BÜYÜK ARKANA (MAJOR ARCANA) ---
  'deli': {
    upright: ['Yeni Başlangıç', 'Masumiyet', 'Özgür Ruh'],
    reversed: ['Dikkatsizlik', 'Risk', 'Kararsızlık'],
  },
  'buyucu': {
    upright: ['İrade', 'Ustalık', 'Yaratıcılık'],
    reversed: ['Yanılsama', 'Güvensizlik', 'Manipülasyon'],
  },
  'bas_rahibe': {
    upright: ['Sezgi', 'Gizem', 'İçsel Bilgelik'],
    reversed: ['Sırların Açığa Çıkması', 'Yüzeysellik', 'Kopukluk'],
  },
  'imparatorice': {
    upright: ['Bereket', 'Doğurganlık', 'Şefkat'],
    reversed: ['Bağımlılık', 'Yaratıcı Tıkanıklık', 'İhmal'],
  },
  'imparator': {
    upright: ['Otorite', 'Disiplin', 'Liderlik'],
    reversed: ['Zorbalık', 'Kontrol Kaybı', 'Katılık'],
  },
  'aziz': {
    upright: ['Maneviyat', 'Rehberlik', 'Gelenek'],
    reversed: ['Kalıpları Kırma', 'Geleneklere İsyan', 'Bireysellik'],
  },
  'asiklar': {
    upright: ['Aşk & Çekim', 'Uyum', 'Kutsal Seçim'],
    reversed: ['Uyumsuzluk', 'Yanlış Tercih', 'Duygusal Çatışma'],
  },
  'savas_arabasi': {
    upright: ['Zafer', 'İrade Gücü', 'Odaklanma'],
    reversed: ['Yön Kaybı', 'Saldırganlık', 'Engeller'],
  },
  'guc': {
    upright: ['Cesaret', 'Şefkat', 'İçsel Direnç'],
    reversed: ['Özgüvensizlik', 'Zaafiyet', 'Korku'],
  },
  'ermis': {
    upright: ['İçsel Arayış', 'Bilgelik', 'Yalnızlık'],
    reversed: ['İzolasyon', 'Dışlanma', 'Aşırı İçe Kapanma'],
  },
  'kader_carki': {
    upright: ['Kader', 'Şans', 'Dönüm Noktası'],
    reversed: ['Kötü Talih', 'Direnç', 'Durgunluk'],
  },
  'adalet': {
    upright: ['Dürüstlük', 'Hak', 'Denge'],
    reversed: ['Haksızlık', 'Sorumsuzluk', 'Önyargı'],
  },
  'asilan_adam': {
    upright: ['Teslimiyet', 'Yeni Bakış Açısı', 'Aydınlanma'],
    reversed: ['Gereksiz Erteleme', 'Direnç', 'Faydasız Fedakarlık'],
  },
  'olum': {
    upright: ['Köklü Dönüşüm', 'Bitişler', 'Yeniden Doğuş'],
    reversed: ['Değişime Direnç', 'Korku', 'Geçmişe Takılma'],
  },
  'denge': {
    upright: ['Sabır', 'Uyum', 'Ölçülülük'],
    reversed: ['Dengesizlik', 'Aşırılık', 'Sabırsızlık'],
  },
  'seytan': {
    upright: ['Bağımlılık', 'Maddi Tutku', 'Gölge Yönler'],
    reversed: ['Özgürleşme', 'Farkındalık', 'Zincirleri Kırma'],
  },
  'kule': {
    upright: ['Ani Yıkım', 'Uyanış', 'Köklü Değişim'],
    reversed: ['Yıkımdan Kaçınma', 'Korku', 'Yüzleşmeyi Erteleme'],
  },
  'yildiz': {
    upright: ['Umut', 'İlham', 'Ruhsal Şifa'],
    reversed: ['Umutsuzluk', 'İnanç Kaybı', 'Karamsarlık'],
  },
  'ay': {
    upright: ['Sezgiler', 'Bilinçaltı', 'İllüzyon'],
    reversed: ['Korkuları Aşma', 'Gerçeklerin Ortaya Çıkışı', 'Netlik'],
  },
  'gunes': {
    upright: ['Mutluluk', 'Canlılık', 'Aydınlanma'],
    reversed: ['Geçici Bulutlar', 'Aşırı İyimserlik', 'Geciken Sevinç'],
  },
  'mahkeme': {
    upright: ['Uyanış', 'Hesaplaşma', 'Yenilenme'],
    reversed: ['Kendini Suçlama', 'Kararsızlık', 'Görmezden Gelme'],
  },
  'dunya': {
    upright: ['Tamamlanma', 'Bütünlük', 'Büyük Başarı'],
    reversed: ['Yarım Kalan İşler', 'Gecikme', 'Eksiklik'],
  },

  // --- KUPALAR (CUPS - SU ELEMENTİ) ---
  'kupa_asi': {
    upright: ['Saf Sevgi', 'Duygusal Başlangıç', 'Sezgi'],
    reversed: ['Duygusal Tıkanıklık', 'Kalp Kırıklığı', 'Bastırılmış Hisler'],
  },
  'kupa_ikilisi': {
    upright: ['Aşk Bağı', 'Karşılıklı Çekim', 'Ruhsal Uyum'],
    reversed: ['İletişimsizlik', 'Soğukluk', 'Dengesiz İlişki'],
  },
  'kupa_uclusu': {
    upright: ['Kutlama', 'Dostluk', 'Paylaşılan Neşe'],
    reversed: ['Dedikodu', 'Aşırılık', 'Dışlanma Hissi'],
  },
  'kupa_dortlusu': {
    upright: ['İçe Dönüş', 'Fırsatları Görme', 'Durgunluk'],
    reversed: ['Uyanış', 'Fırsatı Yakalama', 'Harekete Geçiş'],
  },
  'kupa_beslisi': {
    upright: ['Kayıp & Yas', 'Pişmanlık', 'Duygusal Kırgınlık'],
    reversed: ['İyileşme', 'Kabul Ediş', 'Umuda Tutunma'],
  },
  'kupa_altilisi': {
    upright: ['Nostalji', 'Saf Masumiyet', 'Geçmişten Gelen Bağ'],
    reversed: ['Geçmişe Saplanma', 'Olgunlaşamama', 'Geleceğe Odaklanma'],
  },
  'kupa_yedilisi': {
    upright: ['Hayaller', 'Seçenekler', 'İllüzyon'],
    reversed: ['Gerçekçilik', 'Net Karar', 'Sisin Dağılması'],
  },
  'kupa_sekizlisi': {
    upright: ['Veda Ediş', 'Arayış', 'Ruhsal Yolculuk'],
    reversed: ['Korkudan Kaçış', 'Kararsız Kalma', 'Geri Dönüş'],
  },
  'kupa_dokuzlusu': {
    upright: ['Dileklerin Gerçekleşmesi', 'Huzur', 'Doyum'],
    reversed: ['Açgözlülük', 'Yüzeysel Tatmin', 'Geciken Dilek'],
  },
  'kupa_onlusu': {
    upright: ['Aile Saadeti', 'Ebedi Aşk', 'Tam Mutluluk'],
    reversed: ['Aile İçi Sürtüşme', 'Duygusal Kopukluk', 'Huzursuzluk'],
  },
  'kupa_prensi': {
    upright: ['Duygusal Mesaj', 'Sezgisellik', 'Yumuşak Başlangıç'],
    reversed: ['Alınganlık', 'Duygusal Güvensizlik', 'Kırılganlık'],
  },
  'kupa_sovalyesi': {
    upright: ['Romantizm', 'Teklif', 'Zarafet'],
    reversed: ['Samimiyetsizlik', 'Dengesiz Duygular', 'Boş Vaatler'],
  },
  'kupa_kralicesi': {
    upright: ['Empati', 'Şefkat', 'Derin Sezgi'],
    reversed: ['Aşırı Duygusallık', 'Manipülasyon', 'İhmal'],
  },
  'kupa_krali': {
    upright: ['Duygusal Olgunluk', 'Cömertlik', 'Sakin Güç'],
    reversed: ['Duygusal Soğukluk', 'Baskı', 'Hissizleşme'],
  },

  // --- KILIÇLAR (SWORDS - HAVA ELEMENTİ) ---
  'kilic_asi': {
    upright: ['Zihinsel Netlik', 'Gerçek', 'Yeni Fikir'],
    reversed: ['Kafa Karışıklığı', 'Zihinsel Çatışma', 'Yanlış Karar'],
  },
  'kilic_ikilisi': {
    upright: ['Kararsızlık', 'Çıkmaz', 'Denge Arayışı'],
    reversed: ['Karar Verme', 'Gözlerin Açılması', 'Gerçekle Yüzleşme'],
  },
  'kilic_uclusu': {
    upright: ['Kalp Ağrısı', 'Kırgınlık', 'Acı Gerçek'],
    reversed: ['İyileşme Başlangıcı', 'Affetme', 'Acıyı Bırakma'],
  },
  'kilic_dortlusu': {
    upright: ['Dinlenme', 'Meditasyon', 'Zihinsel İnziva'],
    reversed: ['Tükenmişlik', 'Uyanış Zorunluluğu', 'Harekete Geçme'],
  },
  'kilic_beslisi': {
    upright: ['Mücadele', 'Hırslar', 'Kazanırken Kaybetme'],
    reversed: ['Uzlaşma', 'Yenilgiyi Kabul', 'Çatışmayı Bitirme'],
  },
  'kilic_altilisi': {
    upright: ['Sakin Sulara Geçiş', 'İyileşme Yolculuğu', 'Geçmişi Geride Bırakma'],
    reversed: ['Sorunların Peşini Bırakmaması', 'Direnç', 'Geciken Yolculuk'],
  },
  'kilic_yedilisi': {
    upright: ['Strateji', 'Zeka', 'Gizlilik & Takip'],
    reversed: ['İtiraf', 'Yüzleşme', 'Gizliliğin Bozulması'],
  },
  'kilic_sekizlisi': {
    upright: ['Kendi Koyduğu Sınırlar', 'Tutsaklık', 'Korkular'],
    reversed: ['Özgürleşme', 'Cesaret Bulma', 'Korkuları Yıkma'],
  },
  'kilic_dokuzlusu': {
    upright: ['Kaygı & Endişe', 'Uykusuz Geceler', 'Baskı'],
    reversed: ['Umut Işığı', 'Kaygının Azalması', 'Gerçeği Fark Etme'],
  },
  'kilic_onlusu': {
    upright: ['Bitiş & Dip Nokta', 'Eski Düzenin Sonu', 'Şafak Öncesi'],
    reversed: ['Yeniden Toparlanma', 'En Kötünün Geride Kalması', 'Direnç'],
  },
  'kilic_prensi': {
    upright: ['Merak', 'Keskin Zeka', 'Yeni Haber'],
    reversed: ['Savunmacılık', 'Aşırı Eleştiri', 'Dedikodu'],
  },
  'kilic_sovalyesi': {
    upright: ['Hızlı Eylem', 'Cesaret', 'Kararlılık'],
    reversed: ['Sabırsızlık', 'Kaba Kuvvet', 'Düşüncesizce Atılma'],
  },
  'kilic_kralicesi': {
    upright: ['Bağımsızlık', 'Zeka', 'Dürüstlük'],
    reversed: ['Aşırı Katılık', 'Soğuk Mesafe', 'Acımasız Eleştiri'],
  },
  'kilic_krali': {
    upright: ['Mantık', 'Adil Hüküm', 'Otorite'],
    reversed: ['Zorbalık', 'Önyargı', 'Merhametsizlik'],
  },

  // --- DEĞNEKLER (WANDS - ATEŞ ELEMENTİ) ---
  'degnek_asi': {
    upright: ['İlham', 'Yaratıcı Tutku', 'Cesur Başlangıç'],
    reversed: ['Gecikme', 'Motivasyon Kaybı', 'Tereddüt'],
  },
  'degnek_ikilisi': {
    upright: ['Gelecek Planı', 'Vizyon', 'Keşif'],
    reversed: ['Korku', 'Plansızlık', 'Sıkışmışlık'],
  },
  'degnek_uclusu': {
    upright: ['Ufukları Genişletme', 'Gelişim', 'Beklenen Fırsat'],
    reversed: ['Gecikmeler', 'Hayal Kırıklığı', 'Bekleyiş'],
  },
  'degnek_dortlusu': {
    upright: ['Kutlama', 'Ev Huzuru', 'İstikrar & Başarı'],
    reversed: ['Ev İçi Gerginlik', 'Geciken Kutlama', 'Geçici Huzursuzluk'],
  },
  'degnek_beslisi': {
    upright: ['Tatlı Rekabet', 'Görüş Ayrılığı', 'Dinamizm'],
    reversed: ['Çatışmadan Kaçınma', 'Uzlaşma', 'Yorgunluk'],
  },
  'degnek_altilisi': {
    upright: ['Zafer & Takdir', 'Başarı', 'Özgüven'],
    reversed: ['Kibir', 'Geciken Başarı', 'Düşüş Korkusu'],
  },
  'degnek_yedilisi': {
    upright: ['Mevziyi Koruma', 'Cesur Direniş', 'Kararlılık'],
    reversed: ['Pes Etme', 'Yorulma', 'Baskı Altında Ezilme'],
  },
  'degnek_sekizlisi': {
    upright: ['Hızlı Gelişmeler', 'Müjdeli Haber', 'Akış'],
    reversed: ['Gecikme', 'Panik', 'Yanlış İletişim'],
  },
  'degnek_dokuzlusu': {
    upright: ['Dayanıklılık', 'Son Adım', 'Teyakkuz'],
    reversed: ['Tükenmişlik', 'Direnç Kaybı', 'Şüphecilik'],
  },
  'degnek_onlusu': {
    upright: ['Ağır Sorumluluk', 'Baskı', 'Hedefe Az Kaldı'],
    reversed: ['Yükleri Hafifletme', 'Paylaşma', 'Tükenme'],
  },
  'degnek_prensi': {
    upright: ['Heyecan Verici Fikir', 'Maceracı Ruh', 'İlham'],
    reversed: ['Kararsızlık', 'Tembellik', 'Yarım Kalan İstek'],
  },
  'degnek_sovalyesi': {
    upright: ['Cesaret', 'Tutkulu Enerji', 'Hızlı İlerleme'],
    reversed: ['Öfke', 'Acelecilik', 'Dikkatsizlik'],
  },
  'degnek_kralicesi': {
    upright: ['Özgüven', 'Karizma', 'Sıcakkanlı Liderlik'],
    reversed: ['Kıskançlık', 'Bencillik', 'Öfke Patlaması'],
  },
  'degnek_krali': {
    upright: ['Vizyoner Lider', 'İlham Verici Güç', 'Yaratıcılık'],
    reversed: ['Baskıcı Tutum', 'Aşırı Gurur', 'Sabırsızlık'],
  },

  // --- TILSIMLAR (PENTACLES - TOPRAK ELEMENTİ) ---
  'tilsim_asi': {
    upright: ['Maddi Fırsat', 'Somut Başarı', 'Bereket Tohumu'],
    reversed: ['Kaçırılan Fırsat', 'Maddi Endişe', 'Harcamalarda Dikkatsizlik'],
  },
  'tilsim_ikilisi': {
    upright: ['Denge', 'Esneklik', 'Kaynak Yönetimi'],
    reversed: ['Dengesizlik', 'Aşırı Yüklenme', 'Maddi Karmaşa'],
  },
  'tilsim_uclusu': {
    upright: ['Ustalık', 'İşbirliği', 'Takdir Görme'],
    reversed: ['İşbirliği Eksikliği', 'Kalitesizlik', 'Tembellik'],
  },
  'tilsim_dortlusu': {
    upright: ['Güvenlik', 'Tasarruf', 'Maddi İstikrar'],
    reversed: ['Açgözlülük', 'Kaybetme Korkusu', 'Katı Tutuculuk'],
  },
  'tilsim_beslisi': {
    upright: ['Maddi Sıkıntı', 'Dışlanma', 'Yardım Arayışı'],
    reversed: ['Toparlanma', 'Işığı Görme', 'Yeni Umut'],
  },
  'tilsim_altilisi': {
    upright: ['Cömertlik', 'Denge & Adalet', 'Paylaşım'],
    reversed: ['Bencillik', 'Borçlanma', 'Gizli Çıkarlar'],
  },
  'tilsim_yedilisi': {
    upright: ['Sabır', 'Emeklerin Büyümesi', 'Değerlendirme'],
    reversed: ['Sabırsızlık', 'Boşa Giden Emek', 'Tembellik'],
  },
  'tilsim_sekizlisi': {
    upright: ['Çalışkanlık', 'Zanaat', 'Sürekli Gelişim'],
    reversed: ['Hırs Eksikliği', 'Tembellik', 'Tekdüzelik'],
  },
  'tilsim_dokuzlusu': {
    upright: ['Lüks & Bağımsızlık', 'Huzur', 'Emeklerin Meyvesi'],
    reversed: ['Maddi Bağımlılık', 'Yüzeysel Zenginlik', 'Yalnızlık'],
  },
  'tilsim_onlusu': {
    upright: ['Miras', 'Kalıcı Refah', 'Köklü Aile Gücü'],
    reversed: ['Miras Anlaşmazlığı', 'Maddi Çöküş', 'Güvensizlik'],
  },
  'tilsim_prensi': {
    upright: ['Öğrenme İsteği', 'Somut Adım', 'Güvenilirlik'],
    reversed: ['Tembellik', 'Plansızlık', 'Sorumsuzluk'],
  },
  'tilsim_sovalyesi': {
    upright: ['Sebat', 'Sadakat', 'Adım Adım Başarı'],
    reversed: ['İnatçılık', 'Aşırı Ağırkanlılık', 'Tembellik'],
  },
  'tilsim_kralicesi': {
    upright: ['Bereket', 'Pratik Zeka', 'Huzurlu Ev'],
    reversed: ['Maddi Bağımlılık', 'İhmal', 'Endişe'],
  },
  'tilsim_krali': {
    upright: ['Zenginlik', 'Güvenilirlik', 'Usta Yöneticilik'],
    reversed: ['Açgözlülük', 'Katılık', 'Maddiyatçılık'],
  },
};

export function getTarotKeywordList(cardId: string, orientation: TarotOrientation = 'upright'): string[] {
  if (!cardId) {
    return orientation === 'reversed' ? ['Dönüşüm', 'İçsel Ders', 'Farkındalık'] : ['Işık', 'Gelişim', 'Fırsat'];
  }

  const normId = cardId.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Direkt eşleşme
  let found = TAROT_ALL_KEYWORDS[normId];
  
  // Tire veya alt çizgi varyasyonları
  if (!found) {
    const dashedId = normId.replace(/_/g, '-');
    found = (TAROT_ALL_KEYWORDS as any)[dashedId];
  }

  // Özel normalize denemeleri (örn: kupa_6 -> kupa_altilisi, wands_king -> degnek_krali vb.)
  if (!found) {
    for (const key of Object.keys(TAROT_ALL_KEYWORDS)) {
      const cleanKey = key.replace(/_/g, '');
      const cleanNorm = normId.replace(/_/g, '');
      if (cleanKey === cleanNorm || cleanKey.includes(cleanNorm) || cleanNorm.includes(cleanKey)) {
        found = TAROT_ALL_KEYWORDS[key];
        break;
      }
    }
  }

  if (found) {
    return orientation === 'reversed' ? found.reversed : found.upright;
  }

  return orientation === 'reversed' ? ['Dönüşüm', 'İçsel Ders', 'Farkındalık'] : ['Işık', 'Gelişim', 'Fırsat'];
}
