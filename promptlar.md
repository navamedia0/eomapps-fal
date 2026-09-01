# Mistik Rehber — Buton & Bölüm Arkaplan Görseli Prompt Kütüphanesi
### Netflix Tarzı Premium Karanlık Kimlik — Gemini Görsel Üretici İçin Kopyala-Yapıştır Promptlar

---

## 0. NEDEN ŞU ANKİ GÖRSELLER SORUNLU?

Ekran görüntülerine baktığımda 3 temel sorun görüyorum:
1. **Stil tutarsızlığı** — bazı kartlar fotoğrafik (Kahve Falı, Yüz Falı), bazıları illüstrasyon (İskambil, Melek Kartları), bazıları neredeyse boş (41 Bakla Falı). Aynı uygulamada 3 farklı görsel dil var gibi duruyor.
2. **Kompozisyon tekrarı** — birden fazla kartta aynı "masada yayılmış obje + mum ışığı" formülü tekrar ediyor, göz ayırt edemiyor.
3. **"Yapay zeka kokusu"** — aşırı parlak/saturated renkler, plastik dokular, gereksiz simetri; bu genelde promptlarda "8k, hyperrealistic, octane render, vibrant colors" gibi klişe ifadeler kullanılmasından kaynaklanır. Aşağıdaki promptlarda bunlardan kaçındım.

**Çözüm:** Her görsel aynı "fotoğraf departmanından" çıkmış gibi hissettirecek TEK bir teknik/ışık/renk formülü + her fal için BENZERSİZ bir "hero obje" (o falı simgeleyen tek bir ana nesne, tekrar etmeyen).

---

## 1. ORTAK STİL DNA'SI (Her Prompt'un Sonuna Ekle)

Aşağıdaki bloğu **her tek görsel promptunun sonuna değiştirmeden ekle**. Bu, tüm kart setinin aynı "editoryal fotoğraf stüdyosundan" çıkmış gibi görünmesini sağlayan sabit imza.

```
STYLE: Moody editorial studio photography, extreme macro/close-up framing,
single dramatic warm amber-gold rim light (#D4AF37) against near-black
background (#0A0A0A charcoal gradient), soft volumetric haze, shallow depth
of field with creamy bokeh, visible fine material textures (wood grain,
worn fabric weave, aged paper, tarnished metal, mineral surface), subtle
35mm film grain, muted true-to-life color palette (no oversaturation),
asymmetrical off-center composition, vertical 4:5 aspect ratio, soft
vignette fading to pure black at the edges for seamless UI card overlay.
STRICTLY AVOID: text, logos, watermarks, human faces, human figures,
cartoon/flat illustration style, glossy 3D render look, neon colors,
symmetrical centered stock-photo composition, oversharpened HDR look.
```

**Neden işe yarıyor:**
- "Extreme macro / close-up" → her görsel otomatik olarak farklı, çünkü kompozisyonu obje belirliyor, sahne değil.
- "Single dramatic rim light" → tüm set aynı ışık imzasını taşıyor, göz bunu bir bütün olarak algılıyor (Netflix kapak sanatlarının yaptığı tam olarak bu).
- "Muted true-to-life palette" + "film grain" → yapay/plastik AI görünümünü kırıyor.
- "No human faces/figures" → senin talebini garanti altına alıyor.

---

## 2. FAL ÇEŞİTLERİ KART GÖRSELLERİ (Öncelikli — 12 Adet)

Her birine kendine has, tekrar etmeyen bir "hero obje" verdim. Format: `[SUBJECT] + [Bölüm 1'deki STYLE bloğu]`

### 2.1 Kahve Falı
```
SUBJECT: An upturned Turkish coffee cup resting on its saucer, dried coffee
grounds forming organic swirling patterns along the inner rim, a faint wisp
of steam still rising from the empty cup, tiny cracks of warm light catching
the sediment texture, tarnished copper coffee pot (cezve) softly blurred in
the background.
```

### 2.2 Tarot Falı
*(Not: gerçek Rider-Waite tarot görselleri telif korumalı — bu yüzden orijinal/soyut bir kart tasarımı istiyoruz, mevcut bir destenin kopyası değil.)*
```
SUBJECT: A hand-fanned spread of ornate tarot cards seen from a low angle,
only the intricately patterned card backs visible (original abstract
geometric mandala pattern in gold foil on deep indigo card stock, no
recognizable existing tarot iconography), one card catching a warm glow
at its edge, thin candle smoke drifting across the frame.
```

### 2.3 Katina Aşk Falı
```
SUBJECT: Two vintage playing cards leaning against each other like a small
tent on dark velvet fabric, a single red silk ribbon loosely wound between
them, a few loose dried rose petals scattered nearby, soft warm candle
bokeh glowing behind.
```

### 2.4 El Falı
*(İnsan eli fotoğrafı yerine, "çizgi analizi" temasını soyut/grafiksel anlatan bir versiyon — gerçekçi insan derisi görüntüsünden kaçınıyoruz.)*
```
SUBJECT: An artistic macro study of intertwined golden line-art overlaying
a dark textured stone surface, resembling palm lines merging into
constellation-like star charts, thin luminous gold threads tracing curved
paths across a charcoal-black backdrop, no visible skin texture or realistic
hand anatomy — purely graphic/linework in style, like engraved gold filigree
on obsidian.
```

### 2.5 İskambil Falı
```
SUBJECT: A tight spread of classic playing cards fanned across dark green
felt, only the ornate red-and-gold card backs visible, a single card corner
lifted slightly to reveal a hint of a black suit symbol, warm spotlight
raking across the felt texture.
```

### 2.6 Su Falı
```
SUBJECT: Extreme close-up of a shallow brass bowl filled with still dark
water, concentric ripples frozen mid-motion, a single candle flame
reflected as a warm golden streak across the water surface, faint steam
curling above.
```

### 2.7 Yüz Falı
*(Gerçek insan yüzü yerine, "yüz analizi" temasını klasik heykel estetiğiyle anlatan bir versiyon.)*
```
SUBJECT: A weathered classical marble bust in side profile, dramatically
side-lit so half the face dissolves into shadow, thin golden ratio grid
lines etched subtly across the surface like an analytical overlay, dust
particles visible in the light beam, ancient stone texture with fine
cracks.
```

### 2.8 Melek Kartları
```
SUBJECT: A single pristine white feather resting on dark navy silk fabric,
soft ethereal backlight creating a subtle golden halo glow around its edges,
faint out-of-focus card corner (gold-trimmed, cream-colored) visible at the
frame's edge, delicate dust motes floating in the light.
```

### 2.9 Balmumu Falı
```
SUBJECT: A thin stream of melted candle wax frozen mid-pour into a bowl of
dark water, the wax caught mid-transformation into an abstract organic
shape, warm amber light glinting off the molten surface, the candle itself
softly blurred in the background.
```

### 2.10 41 Bakla Falı
```
SUBJECT: A cluster of dried fava beans (bakla) scattered in a deliberate
circular pattern on dark aged burlap cloth, dramatic raking side light
emphasizing each bean's natural texture and shadow, a few beans slightly
out of focus in the foreground for depth.
```

### 2.11 Lenormand Falı
```
SUBJECT: A small stack of miniature oracle cards fanned slightly, showing
only ornate antique-style card backs (original muted botanical engraving
pattern in faded gold and burgundy, no existing Lenormand deck artwork
copied), resting on a worn leather-bound book, warm library lamp light
from the side.
```

### 2.12 Rün Falı
```
SUBJECT: Scattered rune stones on fine dark sand, each stone showing a
faint carved symbol lit from a low raking angle so the carvings cast long
shadows, weathered granite texture, one stone slightly forward and in
sharp focus while the rest fall into soft blur.
```

### ✅ Kontrol
- [ ] 12 görselin hiçbiri aynı kompozisyon formülünü tekrar etmiyor (masaüstü + mum ışığı klişesi kırıldı)
- [ ] Hiçbirinde gerçek insan yüzü/figürü yok
- [ ] Hepsi aynı ışık/renk imzasını taşıyor (Bölüm 1 suffix'i eklendi)

---

## 3. "TÜM FAL ÇEŞİTLERİ" SAYFASI — FİLTRE SEKME İKONLARI

Bunlar küçük, sade simge-arkaplanları olmalı (kart görsellerinden daha soyut, ikon niteliğinde).

### 3.1 Tümü (yıldız ikonu arkaplanı)
```
SUBJECT: An extreme close-up of a single hand-forged gold star ornament,
softly out of focus, resting on dark fabric, minimal and abstract —
functions as a subtle textured backdrop rather than a literal object shot.
```

### 3.2 Kart Desteleri
```
SUBJECT: The tightly cropped edge of a stacked deck of cards, showing only
the layered paper-thin edges fanned slightly, warm rim light catching the
stack's texture, extreme macro abstraction.
```

### 3.3 Fotoğraflı
```
SUBJECT: A vintage brass magnifying glass lens in extreme close-up, warm
light refracting softly through the glass, resting on dark aged paper
texture.
```

### 3.4 Antik & Remil
```
SUBJECT: A weathered antique brass compass or astrolabe fragment, extreme
macro close-up of its engraved surface, dust and patina visible, warm low
side light.
```

---

## 4. ANA SAYFA ÖĞELERİ

### 4.1 Günlük Yoklama Banner ("Bugünkü yoklamanı yap, +5 coin kazan")
```
SUBJECT: A small stack of gold coins catching warm light, one coin mid-fall
frozen in motion with a soft motion blur trail, dark background, a faint
glowing calendar-page corner blurred in the far background — communicates
"daily reward" without literal calendar iconography.
```

### 4.2 "Ücretsiz Coin Kazan" Kartı
```
SUBJECT: A slightly opened ornate treasure chest corner, warm golden light
spilling out from within, a few gold coins visible catching the light at
the opening edge, rest of the chest falling into soft shadow.
```

### 4.3 "Mini Oyunlar" Kartı
```
SUBJECT: A set of antique carved dice mid-roll (motion blur on one die),
resting on dark felt, warm rim light catching their edges, a soft
out-of-focus game token in the background.
```

### 4.4 Coin İkonu (jeton bakiyesi)
```
SUBJECT: A single ornate gold coin in extreme macro, engraved star pattern
visible on its surface, warm directional light creating a soft highlight
along its curved edge, dark background.
```

### 4.5 Elmas İkonu (elmas bakiyesi)
```
SUBJECT: A single faceted deep-violet gemstone in extreme macro, warm rim
light catching its cut edges and creating small internal light refractions,
dark background.
```

### 4.6 Zodyak Çarkı Kategori İkonları (Merkez Yıldız Etrafındaki 6 İkon)
> Bu ikonların tam etiketlerini net okuyamadım; aşağıda yaygın mistik-uygulama kategorileri için öneriler var — kendi etiketlerine göre eşleştir. Format aynı kalacak şekilde konuyu değiştirmen yeterli.

**Burç Yorumu:**
```
SUBJECT: A single constellation pattern etched in fine gold thread against
deep charcoal fabric, extreme macro, soft glow along the thread lines.
```

**Ay Takvimi / Ay Burcu:**
```
SUBJECT: A thin crescent moon silhouette carved into dark stone, extreme
macro close-up, warm light grazing across its carved edge.
```

**Numeroloji:**
```
SUBJECT: Antique brass number-stamp dies scattered on dark velvet, extreme
macro, one die in sharp focus showing an embossed digit, warm side light.
```

**Rüya Tabiri:**
```
SUBJECT: A single dried lavender sprig resting beside a small antique glass
vial, extreme macro, soft warm backlight, dreamlike shallow focus.
```

**Astroloji / Doğum Haritası:**
```
SUBJECT: A fragment of an antique brass astrolabe, engraved concentric
rings, extreme macro, warm raking light across the engravings.
```

**Meditasyon / Nefes:**
```
SUBJECT: A single lit incense stick, thin smoke curling upward against a
near-black background, warm amber light catching the smoke trail.
```

### 4.7 "Mistik Rehber" Başlık Dekoru (hilal motifleri)
```
SUBJECT: A pair of thin gold crescent moon line-art forms, extreme macro,
engraved into dark stone or metal surface, minimal and elegant, soft warm
highlight along the engraved edge.
```

---

## 5. ALT NAVİGASYON ÇUBUĞU (Basit İkon Seti — Farklı Yaklaşım Gerekir)

Alt navigasyon (Ana Sayfa, Keşfet, Sohbet, Oyun Merkezi, Mağaza, Profil) için **fotoğrafik arkaplan görseli önermiyorum** — bu alan küçük, sık tıklanan ve hızlı okunması gereken bir alan; burada fotoğrafik doku okunabilirliği düşürür ve Netflix gibi premium uygulamaların çoğu da alt navigasyonda **sade, tutarlı çizgi ikon (line icon) seti** kullanır, fotoğraf değil.

**Önerim:** Bu 6 ikonu tek bir promptla, tek seferde, tutarlı bir set olarak ürettir:

```
SUBJECT: A cohesive set of 6 minimal line-art icons in a single consistent
style: (1) a simple house/home outline, (2) a compass, (3) a speech bubble,
(4) a game controller, (5) a shopping bag, (6) a person silhouette. All
drawn with the same thin elegant gold line weight (#D4AF37), on transparent
or pure black background, no fill, no shading, no gradient, no realistic
detail — flat minimal geometric line icons matching a premium dark luxury
app aesthetic, evenly spaced in a single row.
STRICTLY AVOID: photographic texture, 3D rendering, drop shadows, color
fill, realistic depth.
```

---

## 6. UYGULAMA NOTLARI

1. **Sırayla üret, hepsini aynı oturumda yapma.** Gemini'ye bir kerede 2-3 görsel promptu ver, sonuçları yan yana koyup ışık/renk tutarlılığını gözden geçir, sonra devam et. Aksi halde 20 görsel arasında fark edilmeyen küçük ton kaymaları birikip yine "tutarsız" bir set ortaya çıkabilir.
2. **Referans görsel ver.** İlk 2-3 görsel istediğin gibi çıktıysa, sonraki promptlara "önceki görsellerle aynı ışık/renk paletini koru" diye ekleyip o görselleri referans olarak (varsa image-to-image / reference image özelliğiyle) ekle — bu tutarlılığı ciddi oranda artırır.
3. **Kart üzerine metin/başlık overlay'ini görselin İÇİNE ekletme** — "Kahve Falı" yazısını UI tarafında (React Native Text component) bindir, görseli sadece arkaplan olarak kullan. Promptlarda zaten "no text" dedik, bu tutarlılığı bozmasın diye önemli.
4. **41 Bakla Falı gibi eksik/boş kartları önce tamamla** — ekran görüntünde bu kart boş duruyordu, muhtemelen üretim sırasında atlanmış; listeye dahil ettim.
5. **Telif hakkı notu:** Tarot ve Lenormand promptlarında bilinçli olarak "mevcut deste görselini kopyalama, orijinal desen" diye belirttim — Gemini'nin ünlü tarot destelerinin (Rider-Waite vb.) görsellerini birebir taklit etmesini istemiyoruz, hem telif riski hem de "tanıdık ama bize ait değil" hissi yaratır.
