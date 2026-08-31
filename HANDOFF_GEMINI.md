# Devir Teslim Notu — Mistik Rehber (Fal) Uygulaması

Bu proje şu ana kadar Claude Code ile çalışıldı, artık Gemini/Antigravity ile devam edilecek. Aşağıdaki bağlam olmadan iş güvenle sürdürülemez — lütfen tamamını oku.

## ⚠️ EN ÖNEMLİ KURAL — ÖNCE BUNU OKU

Bu projede daha önce Gemini ile yapılan bir anasayfa "redesign"ı, eski ~25 doğrudan-erişim butonunu birkaç geniş kategoriye sıkıştırırken **çoğu özelliğe giden navigasyon yolunu sessizce kaybetmişti** (Doğum Haritası, Rüya Kitaplığı, Numeroloji, Biyoritim, Ay Takvimi, Yükselen Burcum, Burç Uyumu, Burç Özellikleri, Sihirli Küre, Günün İlham Kartı, Günlük Olumlama, Duygu Günlüğü — hepsi kodda duruyordu ama hiçbir buton onlara gitmiyordu). Kullanıcı bunu günler sonra fark etti ve büyük bir güven kaybı yaşadı.

**Bu yüzden, herhangi bir ekranı yeniden tasarlarken veya düzenlerken:**
1. Değişiklikten ÖNCE, o ekrandaki tüm `navigation.navigate(...)` çağrılarını `grep` ile listele.
2. Değişiklikten SONRA, aynı listeyi tekrar çıkar ve **hiçbirinin kaybolmadığını** doğrula. Bir hedefe giden buton kaldırıyorsan, mutlaka başka (ve gerçekten tıklanabilir) bir yere taşı — asla sessizce silme.
3. `npx tsc --noEmit -p .` her zaman 0 hata vermeli (route adları tip kontrolünden geçer, bu da yanlış yazılmış rota isimlerini otomatik yakalar).
4. Büyük bir görsel/yapısal değişiklik yapmadan önce kullanıcıya kısaca ne değişeceğini özetle, özellikle "şu buton artık farklı bir yerde/şekilde" gibi noktaları.

## Proje Nedir

React Native (Expo SDK 53) ile yazılmış bir fal/astroloji uygulaması ("Mistik Rehber"). Kahve falı, tarot, Katina, İskambil, rün, I Ching, numeroloji, astroloji, rüya yorumlama gibi 20'den fazla "fal" türü içeriyor. TypeScript strict, `npx tsc --noEmit -p .` ile tip kontrolü yapılıyor — her değişiklikten sonra bunu çalıştır.

## Az Önce Tamamlanan İşler (artık `master`'da, kalıcı)

1. **Tema değişikliği**: Eski "Cosmic Indigo" (koyu galaksi-moru) paleti, "Yumuşak Siyah" (neredeyse siyah zemin + canlı altın `#FFC93C` vurgu) paletiyle değiştirildi.
   - Merkezi renkler: `src/theme/colors.ts`
   - **Önemli teknik ders**: Bu dosya 131+ dosyada import ediliyor ama pek çok ekran renkleri `colors.ts` sabitleri yerine **sabit hex/rgba literalleri olarak doğrudan kopyalamıştı** (ör. `rgba(11, 10, 31, 0.75)` yerine `NIGHT_DEEP` sabitini kullanmak yerine). Bu yüzden `colors.ts`'i değiştirmek tek başına yetmedi — ~150 tekrar eden literal, ~94 dosyada tek tek bulunup değiştirildi. **Yeni bir renk eklerken/değiştirirken önce `colors.ts`'teki sabiti kullan, asla hex/rgba'yı elle yazma.**
2. **Kader Kasabası** oyunu tamamen kaldırıldı (kullanıcı isteği — geliştirilmeyecek bir özellikti), yerine **Oyun Merkezi** placeholder ekranı ve alt menü butonu kondu. 3D altyapı (`src/components/game/Town3DCanvas.tsx`) kasıtlı olarak dokunulmadan bırakıldı (ileride yeniden kullanılacak).
3. **Anasayfa (`src/screens/HomeScreen.tsx`) tamamen yeniden kuruldu**: eski büyük dikey `CompactCategoryCard`'lar kaldırıldı (dosya silindi), yerine yatay kaydırmalı raf/carousel bileşeni **`src/components/home/FortuneShelf.tsx`** geldi. Her kategori (Fallar, Rüya, Burç, Sayılar, İç Huzur) artık bir raf; her özelliğin kendi dokunulabilir kartı var — **hiçbir navigasyon hedefi kaybolmadı, hepsi tek tek doğrulandı.**
4. Yeni bir hero bileşeni: **`src/components/home/SoulOrbHero.tsx`** — sürüklenerek döndürülebilen, altı mistik ikonun döndüğü bir "ruh küresi" (mevcut `OrbGlow` + `PanResponder` sürükleme deseni üzerine kuruldu, yeni native bağımlılık eklenmedi).
5. Alt sekme çubuğu (`src/navigation/MainTabs.tsx`) özel PNG ikonlar yerine düz `Ionicons` kullanıyor artık.
6. **Katina Aşk Falı içerik/mantık hatası düzeltildi ve tamamlandı**:
   - `CardDeckTableScreen.tsx`'teki `getCardDetails()` fonksiyonu, JSON'daki var olmayan alan adlarını okuduğu için Katina ve İskambil'de yazılmış içerik hiç ekrana gelmiyordu — düzeltildi.
   - Katina artık gerçekten **65 kart**: 52 sembolik kart (`src/data/katina_card_details.json` — Helenik/İzmir efsanesi temalı özgün figür+hikaye) + 13 yeni "element/ruh kartı" (`src/data/katina_element_cards.json`).
   - Gerçek Katina geleneğindeki **"element kartları ritüeli"** kuruldu: fala başlarken 4 element kartı ayrı çekilip kenara ayrılıyor, ana açılım bittikten sonra `CardDeckTableScreen.tsx` içinde açılıp "Genel Sonuç Enerjisi" (Olumlu/Dikkat Gerektiriyor/Karışık) hesaplanıyor.

## Yarım Kalan / Önerilen Sıradaki İşler

1. **Gerçek cihaz/emülatörde görsel test hiç yapılmadı.** Yeni tema, yeni anasayfa (özellikle sürüklenebilir küre), yeni sekme çubuğu — hiçbiri fiziksel olarak çalıştırılıp doğrulanmadı. **İlk iş bu olmalı**: `npx expo start` ile açıp anasayfayı, tüm rafları, küre sürüklemeyi, Katina falını baştan sona test et.
2. **İskambil Saray Falı** — kullanıcı Katina ile karşılaştırma istemişti. İskambil'in içeriği (`src/data/iskambil_card_details.json`) zaten tamdı (52/52 kart, tüm alanlar dolu), sadece render hatası vardı (düzeltildi). Muhtemelen ek bir iş gerekmiyor ama kullanıcıyla teyit edilmedi.
3. **Diğer fal türlerinin içerik denetimi** — kullanıcı "falları düzenleyelim, Katina'dan başlayalım" dedi; yani sırada muhtemelen başka fal türleri de var (kahve, el, yüz, rün, I Ching, bakla, vb.) — her birinin `CardDeckTableScreen.tsx`'teki `getCardDetails()` dalını ve ilgili JSON veri dosyasını aynı yöntemle (alan adı eşleşmesi doğru mu, içerik dolu mu) kontrol etmek gerekebilir.
4. **"Katina Kart Anlamları" referans ekranı yok** — sözlük menüsünde (`SozlerKoskuDrawerModal.tsx`) sadece "Tarot Kartları" ve "İskambil Kartları" var, Katina için ayrı bir sözlük girişi yok (`KartAnlamlariScreen.tsx`'in route tipi sadece `'iskambil' | 'tarot'` kabul ediyor — `src/navigation/types.ts:68`). Katina artık zengin içeriğe sahip olduğu için istenirse eklenebilir.
5. **Orphan ekran**: `src/screens/KatinaScreen.tsx` (AI destekli, ayrı bir 3-kart Katina falı) `App.tsx`'te kayıtlı ama hiçbir yerden `navigation.navigate('Katina')` çağrısı yok — ulaşılamaz durumda. Ne yapılacağına karar verilmedi (yeniden bağla / kaldır / bilerek bırak).
6. **Görsel varlıklar hâlâ eski renk paletinde**: `src/assets/icons/ust_banner.png` (artık kullanılmıyor ama dosya duruyor), `src/components/tarot/MysticTableBackground.tsx`'teki ana arka plan görseli (`genelarkaplan.webp`) hâlâ mor/kozmik tonlarda çizilmiş bir resim — kodla değiştirilemez, yeni görsel gerekir.

## Kritik Kodlama Kuralları (Bu Projede Öğrenilenler)

- **Renk değişikliği yaparken**: Her zaman `src/theme/colors.ts`'teki sabitleri kullan/güncelle. Elle hex/rgba yazma — eğer illa yazman gerekiyorsa, aynı literal başka dosyalarda da tekrarlanmış olabilir, `grep -rn "aynı-literal" src/` ile kontrol et.
- **Bir ekranı/bileşeni kaldırırken**: Önce `grep -rn "BileşenAdı" src/` ile başka yerden kullanılmadığını doğrula, sonra sil.
- **Yeni bir fal/deste içeriği eklerken**: `src/data/katina_card_details.json` + `src/data/katina_element_cards.json` + `CardDeckTableScreen.tsx`'teki `getCardDetails()`/`generateDeckPool()` dallarının nasıl birbirine bağlandığına bak — bu artık kanıtlanmış bir desen.
- **Her değişiklikten sonra** `npx tsc --noEmit -p .` çalıştır, 0 hata olmalı.
- **Git**: `master` branch'i şu an tüm bu işleri içeriyor (tema + Katina), ayrı bir tema branch'i yok artık. Büyük/riskli bir değişikliğe başlamadan önce yeni bir branch açmak (`git checkout -b <isim>`) ve işi orada yapmak, kullanıcının "geri alabilme" güvenini koruyor — bu projede kullanıcı buna çok önem veriyor.
- **Commit mesajları** Türkçe (ASCII, Türkçe karakter kullanılmadan) yazılıyor, kısa bir başlık + gerekirse madde madde açıklama.

## Kullanıcı Hakkında

Uygulamanın geliştiricisi/sahibi. Teknik değil ama net ve doğrudan geri bildirim veriyor. Daha önce bir AI aracının (Gemini) sessizce özellik kaybına yol açması yüzünden temkinli — **her değişiklikte şeffaf ol, ne değiştiğini/neyin nerede kaldığını açıkça söyle, "hiçbir şey silinmedi" demeden önce gerçekten doğrula.**
