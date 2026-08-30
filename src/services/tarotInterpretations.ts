/**
 * Modern, Authentic & Esoteric Tarot Interpretation Dictionary
 * Replaces crude/archaic literal translations with deep psychological,
 * relational, and archetype-based divination wisdom.
 */

export interface TarotCardLexiconItem {
  name: string;
  upright: string;
  reversed: string;
  love: string;
  career: string;
  advice: string;
  story: string;
  keywords: string[];
}

export const MODERN_TAROT_INTERPRETATIONS: Record<string, TarotCardLexiconItem> = {
  // --- KILIÇ SERİSİ (HAVA ELEMENTİ) ---
  'kilic-asi': {
    name: 'Kılıç Ası',
    upright: 'Zihinsel berraklık, hakikatin açığa çıkması, zafer ve keskin kararlılık.',
    reversed: 'Fikir karmaşası, kararsızlık veya aceleci hükümler.',
    love: 'İlişkide tüm şüphelerin dağıldığı, açık ve net konuşmaların yapıldığı dürüst bir dönem.',
    career: 'Zekanızı ve analitik gücünüzü kullanarak yeni projelerde mutlak bir zafer elde etme vakti.',
    advice: 'Tereddütleri bir kenara bırakın; hakikatin ışığında net ve cesur kararlar alın.',
    story: 'Buluttan uzanan ilahi el, zafer tacını taşıyan çift taraflı kılıcı tutar. Zihnin ve hakikatin yanılsamalara karşı mutlak zaferini simgeler.',
    keywords: ['Zihinsel Berraklık', 'Hakikat', 'Zafer', 'Net Karar'],
  },
  'kilic-ikilisi': {
    name: 'Kılıç İkilisi',
    upright: 'Denge arayışı, ateşkes, iç sesini dinleme ve tarafsız değerlendirme.',
    reversed: 'Kararsızlıktan bunalma, yüzleşmekten kaçınma veya sahte barış.',
    love: 'İlişkide kalbinizin ve mantığınızın tartıya konduğu, sakin ve dengeli bir uzlaşı dönemi.',
    career: 'İki seçenek arasında tarafsız kalıp en stratejik hamleyi belirleme zamanı.',
    advice: 'Gözlerinizi dış dünyanın gürültüsüne kapatıp kalbinizin ve mantığınızın ortak sesine kulak verin.',
    story: 'Gözleri bağlı oturan kadın, iki kılıcı göğsünde çapraz dengede tutar. Dış gözle değil, içsel sezgiyle verilen derin kararları temsil eder.',
    keywords: ['İçsel Denge', 'Ateşkes', 'Seçim', 'Sükunet'],
  },
  'kilic-uclusu': {
    name: 'Kılıç Üçlüsü',
    upright: 'Duygusal yüzleşme, kalp kırıklığının şifalanması ve zihinsel uyanış.',
    reversed: 'Eski yaraların kapanması, affediş ve duygusal yenilenme.',
    love: 'Geçmişten gelen bir kırgınlığın açıkça konuşulup şifalandırılması gereken kadersel bir eşik.',
    career: 'Beklentilerinizi revize ederek daha gerçekçi ve sağlam adımlarla ilerleme dönemi.',
    advice: 'Acıyı bastırmak yerine onu olgunlaştırıcı bir hayat dersi olarak kabul edin ve yükü bırakın.',
    story: 'Fırtınalı gökyüzünde üç kılıç bir kalbi deler; acının geçici olduğunu ve ardından arındırıcı yağmurla yeni bir başlangıcın geleceğini anlatır.',
    keywords: ['Arınma', 'Şifalanma', 'Olgunlaşma', 'Yüzleşme'],
  },
  'kilic-dortlusu': {
    name: 'Kılıç Dörtlüsü',
    upright: 'Dinlenme, zihinsel meditasyon, geri çekilme ve içsel güç toplama.',
    reversed: 'Yeniden harekete geçme, inzivanın bitişi ve tazelenmiş enerji.',
    love: 'Tartışmalardan ve stresten uzaklaşıp ilişkinin sükunet içinde nefes almasına izin verme vakti.',
    career: 'Yoğun tempoya kısa bir mola verip stratejilerinizi gözden geçirme zamanı.',
    advice: 'Savaş meydanından bir adım geri çekilin; en güçlü zaferler dinlenmiş bir zihinle kazanılır.',
    story: 'Şövalye mabette huzur içinde yatar. Bu bir yenilgi değil, ruhun ve bedenin yeniden toparlanması için kutsal bir mola anıdır.',
    keywords: ['İnziva', 'Zihinsel Mola', 'Huzur', 'Güç Toplama'],
  },
  'kilic-beslisi': {
    name: 'Kılıç Beşlisi',
    upright: 'Egoyu bir kenara bırakma, sınırları fark etme ve gereksiz çatışmalardan çekilme.',
    reversed: 'Uzlaşma arayışı, pişmanlıkları telafi etme ve barış kapısı.',
    love: 'Haklı çıkma hırsı yerine mutluluğu ve anlayışı seçme zamanı; sevgi egodan üstündür.',
    career: 'Yıpratıcı rekabetlerden uzak durarak kendi etik ve profesyonel çizginizi koruyun.',
    advice: 'Her savaşı kazanmak zorunda değilsiniz; bazen geri adım atmak en büyük bilgeliktir.',
    story: 'Alanın galibi kılıçları toplasa da arkasında hüzünlü figürler bırakır. Kart, her bedeli ödemeye değmeyen "Pirus Zaferleri"ne karşı uyarır.',
    keywords: ['Ego Sınavı', 'Uzlaşma', 'Stratejik Geri Çekilme', 'Olgunluk'],
  },
  'kilic-altilisi': {
    name: 'Kılıç Altılısı',
    upright: 'Fırtınalı sulardan sakin limanlara geçiş, içsel iyileşme ve yeni ufuklar.',
    reversed: 'Geçmişe takılı kalma veya değişime karşı içsel direnç.',
    love: 'İlişkideki krizlerin geride kaldığı, sükunet ve karşılıklı güven dolu bir döneme adım atış.',
    career: 'Zorlu bir projenin ardından iş hayatınızda istikrarlı ve rahat bir geçiş süreci.',
    advice: 'Geçmişin ağırlıklarını geride bırakın; önünüzde daha aydınlık ve huzurlu sular var.',
    story: 'Kayıkçı yolcularını dingin kıyıya taşır. Kılıçlar kayığa saplıdır ama batırmaz; tecrübeler yük değil, rehberdir.',
    keywords: ['Sakin Liman', 'Geçiş Dönemi', 'Huzur', 'Yolculuk'],
  },
  'kilic-yedilisi': {
    name: 'Kılıç Yedilisi',
    upright: 'Stratejik düşünme, kurnazlık yerine akılcılık, gizli planlar ve bireysel manevra.',
    reversed: 'Açık yüreklilik, sırların çözülmesi ve doğru yola dönüş.',
    love: 'Partnerinizle aranızda hiçbir gizli ajanda bırakmadan tamamen açık ve şeffaf olma vakti.',
    career: 'Zekanızı ve taktik kabiliyetinizi kullanarak engelleri kurnazlıkla değil akılla aşın.',
    advice: 'Kestirme yollara değil, sağlam ve güvenilir adımlara yönelin; dürüstlük en büyük kalkandır.',
    story: 'Figür beş kılıcı taşırken geriye iki kılıç bırakır. Akıllıca hamlelerin, niyetlerin samimiyetiyle dengelenmesi gerektiğini fısıldar.',
    keywords: ['Strateji', 'Gizlilik', 'Akılcı Manevra', 'Şeffaflık'],
  },
  'kilic-sekizlisi': {
    name: 'Kılıç Sekizlisi',
    upright: 'Zihinsel sınırlamaların farkına varma, illüzyondan kurtulma ve özgürleşme.',
    reversed: 'Korkulardan kurtuluş, yeni bakış açısı ve prangaları kırma.',
    love: 'Kendi kurduğunuz güvensizlik ve şüphe kafesinden çıkıp sevgiye teslim olma zamanı.',
    career: 'Sizi kısıtlayan inançları yıkarak potansiyelinizi ortaya çıkaracak kapıyı aralayın.',
    advice: 'Bağlar gevşektir ve çıkış yolu açıktır; sadece gözlerinizi açıp gerçeği görmeye cesaret edin.',
    story: 'Gözleri bağlı kadın kılıçlarla çevrilidir ancak ayakları serbesttir. Tutsaklığın fiziksel değil, zihinsel bir yanılsama olduğunu anlatır.',
    keywords: ['Özgürleşme', 'Farkındalık', 'İçsel Güç', 'Uyanış'],
  },
  'kilic-dokuzlusu': {
    name: 'Kılıç Dokuzlusu',
    upright: 'Gece endişeleri, zihinsel kuruntulardan arınma ve karanlığın ardından gelen şafak.',
    reversed: 'Kabusların bitişi, umudun yeniden yeşermesi ve iç huzur.',
    love: 'Kendi zihninizde büyüttüğünüz senaryoları bir kenara bırakıp partnerinizle sevgiyle paylaşın.',
    career: 'Yersiz evham ve stres yerine somut verilere odaklanarak kaygılarınızı yatıştırın.',
    advice: 'Karanlık en çok şafaktan önce yoğundur; zihninizin yarattığı gölgelerin sizi yönetmesine izin vermeyin.',
    story: 'Yatağında oturan figür başını ellerinin arasına almıştır. Kart, dertlerin çoğunun zihinde büyütülen gölgeler olduğunu hatırlatır.',
    keywords: ['Zihinsel Şifa', 'Korkuları Aşma', 'Şafak', 'Huzur'],
  },
  'kilic-onlusu': {
    name: 'Kılıç Onlusu',
    upright: 'Eski bir döngünün nihai kapanışı, dibe vuruşun ardından başlayan yeniden doğuş.',
    reversed: 'Yeniden ayağa kalkış, küllerinden doğma ve kaçınılmaz kurtuluş.',
    love: 'İlişkideki eski kalıpların ve yanlış anlaşılmaların tamamen bitip tertemiz bir sayfa açılması.',
    career: 'Sizi yıpratan bir sürecin sona ermesi ve sıfırdan çok daha güçlü bir başlangıç yapma fırsatı.',
    advice: 'Biten şeyi zorla tutmayın; kapanan her kapı arkasında yeni bir altın şafak saklar.',
    story: 'Ufukta kara bulutların arasından altın sarısı bir şafak yükselir. En karanlık anın bittiğini ve yeni hayatın başladığını müjdeler.',
    keywords: ['Dönüşüm', 'Sonlanış & Başlangıç', 'Altın Şafak', 'Yeniden Doğuş'],
  },

  // --- KUPA SERİSİ (SU ELEMENTİ) ---
  'kupa-asi': {
    name: 'Kupa Ası',
    upright: 'Saf sevgi akışı, duygusal doluluk, ruhsal şifa ve yeni bir aşk tohumu.',
    reversed: 'Duyguları bastırma, içe kapanma veya sevgi akışında tıkanıklık.',
    love: 'Kalbinizi tamamen açacağınız, koşulsuz sevgi ve romantizm dolu mucizevi bir bağ.',
    career: 'Yaratıcılığınızın taştığı, işinize sevgi ve ilham kattığınız son derece verimli bir dönem.',
    advice: 'Sevginin kutsal kasesinden kana kana için; duygularınızı ifade etmekten asla korkmayın.',
    story: 'İlahi kaseden taşan beş su pınarı nilüfer gölüne dökülür. Kalbin sınırsız sevgi ve şefkat kapasitesini simgeler.',
    keywords: ['Saf Aşk', 'Duygusal Bereket', 'İlham', 'Şifa'],
  },
  'kupa-ikilisi': {
    name: 'Kupa İkilisi',
    upright: 'Ruh eşi bağı, karşılıklı çekim, kusursuz uyum ve kalplerin birleşmesi.',
    reversed: 'Ufak tefek iletişim kazaları veya dengelenmesi gereken beklentiler.',
    love: 'İki ruhun birbirinde eridiği, derin sadakat ve göz temasıyla anlaşan masalsı bir aşk.',
    career: 'Karşılıklı saygı ve güvene dayalı, son derece kazançlı ve uyumlu bir ortaklık.',
    advice: 'Partnerinizin gözlerindeki kendi yansımanızı onurlandırın; sevgi paylaştıkça çoğalır.',
    story: 'Genç bir kadın ve erkek kadehlerini tokuşturur; üzerlerinde Hermes\'in kanatlı asası ve aslan başı parlar. Kutsal ruhsal birleşmeyi anlatır.',
    keywords: ['Ruh Eşi', 'Kusursuz Çekim', 'Karşılıklı Sevgi', 'Birlik'],
  },
  'kupa-uclusu': {
    name: 'Kupa Üçlüsü',
    upright: 'Kutlama, neşe, dostluk, paylaşılan mutluluk ve sevgi çemberi.',
    reversed: 'Sosyal yorgunluk veya ilişkinin mahremiyetine odaklanma ihtiyacı.',
    love: 'Birlikte neşeli anlar paylaştığınız, çevrenizin de onaylayıp kutladığı sevinç dolu bir dönem.',
    career: 'Ekip çalışmasında büyük bir başarıyı birlikte kutlama ve takdir edilme zamanı.',
    advice: 'Hayatın güzelliklerini sevdiklerinizle kutlayın; neşe paylaşıldıkça berekete dönüşür.',
    story: 'Üç kadın dans ederek kadehlerini kaldırır. Sevginin, arkadaşlığın ve kardeşçe dayanışmanın coşkusunu temsil eder.',
    keywords: ['Kutlama', 'Neşe', 'Dostluk', 'Bereket'],
  },
  'kupa-dortlusu': {
    name: 'Kupa Dörtlüsü',
    upright: 'İçsel doyumsuzluk, meditasyon, sunulan yeni fırsatları fark etme çağrısı.',
    reversed: 'Aşkta yeni bir kıvılcım, kabuğundan çıkış ve hayata yeniden coşkuyla katılma.',
    love: 'Alışkanlıkların getirdiği monotonluğu kırıp partnerinizin size uzattığı yeni sevgi jestini fark edin.',
    career: 'Mevcut durumdan sıkılmak yerine önünüzde duran gizli fırsatlara odaklanın.',
    advice: 'Gözünüzü önünüzdeki kadehlerden kaldırıp evrenin size sunduğu yeni kadehi kucaklayın.',
    story: 'Ağacın altında oturan figür üç kadehe bakar; buluttan uzanan dördüncü kadehi henüz görmemiştir. Kart, uyanışa çağrıdır.',
    keywords: ['Fırsatları Görme', 'Uyanış', 'Yenilenme', 'Kabuktan Çıkış'],
  },
  'kupa-beslisi': {
    name: 'Kupa Beşlisi',
    upright: 'Geçmiş kayıpların ardından kalan güzelliklere odaklanma ve duygusal olgunluk.',
    reversed: 'Umutların yeniden doğuşu, affediş ve geleceğe umutla bakma.',
    love: 'Dökülen kadehlere değil, aranızda hala dipdiri duran 2 sağlam kadehe (aşka) sarılma vakti.',
    career: 'Kaçan fırsatlara takılmak yerine elinizdeki sağlam kaynaklarla yeni başarılar kurun.',
    advice: 'Arkaya değil, önünüze bakın; nehir üzerindeki köprü sizi yeni bir geleceğe çağırıyor.',
    story: 'Siyah pelerinli adam üç devrilmiş kadehe bakar, arkasındaki iki dolu kadehi ve nehri geçen köprüyü fark etmesi gerekir.',
    keywords: ['Güzellikleri Görme', 'Köprü', 'Olgunluk', 'Umut'],
  },
  'kupa-altilisi': {
    name: 'Kupa Altılısı',
    upright: 'Nostalji, çocuksu saf masumiyet, geçmişten gelen ruhsal bağlar ve hediye.',
    reversed: 'Geçmişin yükünü bırakıp bugünün olgun sevgisine adım atma.',
    love: 'Birbirinize en saf, hesapsız ve masum duygularla yaklaştığınız, sıcacık bir sevgi limanı.',
    career: 'Geçmiş tecrübelerinizin ve eski dostluklarınızın kapınızı çalıp bereket getirmesi.',
    advice: 'İçinizdeki çocuğu ve aşkınızın en saf ilk günkü halini yaşatın.',
    story: 'Çocuk figürü, içi çiçeklerle dolu bir kadehi diğerine hediye eder. Masumiyetin ve saf sevginin zamansız güzelliğini anlatır.',
    keywords: ['Saf Masumiyet', 'Nostalji', 'Sıcak Yuva', 'Kadersel Hediye'],
  },
  'kupa-yedilisi': {
    name: 'Kupa Yedilisi',
    upright: 'Hayal gücü, yaratıcı vizyonlar, seçenekler arasından en doğru olanı sezgiyle seçme.',
    reversed: 'İllüzyonların dağılması, netlik kazanma ve somut adımlar atma.',
    love: 'Aşkınızda fanteziler ve hayaller zengin olsa da, aranızdaki bağı somut adımlarla taçlandırma vakti.',
    career: 'Pek çok cazip fikir arasından kalbinize ve geleceğinize en uygun olan ana hedefe odaklanın.',
    advice: 'Hayal kurmaktan korkmayın ama ayaklarınızı yere sağlam basarak en doğru kadehi seçin.',
    story: 'Bulutların üzerinde yedi kadeh içinde taç, mücevher, ejderha ve şato gibi semboller parlar. Kalbin doğru seçimi yapmasını fısıldar.',
    keywords: ['Yaratıcı Vizyon', 'Doğru Seçim', 'İlham', 'Netleşme'],
  },
  'kupa-sekizlisi': {
    name: 'Kupa Sekizlisi',
    upright: 'Ruhsal arayış, daha yüksek bir anlama doğru yürüyüş, yükleri sevgiyle geride bırakma.',
    reversed: 'Ait olduğu yere geri dönüş, bağlılık ve kalıcı huzur.',
    love: 'İlişkiyi sığ sulardan çıkarıp daha derin, ruhsal ve olgun bir boyuta taşıma kararlılığı.',
    career: 'Sizi artık tatmin etmeyen rutinleri geride bırakıp gerçek tutkunuza doğru ilerleme cesareti.',
    advice: 'Ruhunuzun çağrısına uyun; bazen dağlara doğru yürümek kalbin en büyük uyanışıdır.',
    story: 'Ay ışığı altında kırmızı pelerinli yolcu sekiz kadehi geride bırakıp dağlara doğru tırmanır. Yüksek maneviyata geçişi simgeler.',
    keywords: ['Ruhsal Yolculuk', 'Derinlik', 'Olgunlaşma', 'Yüksek Anlam'],
  },
  'kupa-dokuzlusu': {
    name: 'Kupa Dokuzlusu',
    upright: 'Dilek kartı! Kalbin en derin arzusunun gerçekleşmesi, memnuniyet ve bolluk.',
    reversed: 'İçsel tatmin arayışı veya maddiyattan öte manevi doyum ihtiyacı.',
    love: 'İlişkinizde arzu ettiğiniz tüm mutluluğun, huzurun ve tatminin gerçekleşeceği altın dönem.',
    career: 'Maddi ve manevi hedeflerinizin tam bir başarı ve refahla taçlandığı bereketli zaman.',
    advice: 'Dileklerinizin gerçekleştiğini hissedin ve evrene şükranla teşekkür edin.',
    story: 'Kollarını kavuşturmuş neşeli figür dokuz kadehin önünde oturur. Tarot\'un en uğurlu dilek kartıdır.',
    keywords: ['Dileklerin Kabulü', 'Büyük Memnuniyet', 'Bolluk', 'Mutluluk'],
  },
  'kupa-onlusu': {
    name: 'Kupa Onlusu',
    upright: 'Kusursuz aile saadeti, sonsuz mutluluk, kadersel evlilik ve kalıcı yuva.',
    reversed: 'Aile içi ufak pürüzlerin sevgi ve anlayışla çözülmesi.',
    love: 'Ruh eşinizle ömür boyu sürecek kutsal bir yuva, evlilik ve koşulsuz aile saadeti.',
    career: 'İş ortamınızda aile sıcaklığı ve uzun vadeli huzurlu bir istikrar.',
    advice: 'Sevginizin ve birlikteliğinizin gücüne inanın; siz gökkuşağının altındaki kutsanmış çiftsiniz.',
    story: 'Gökkuşağının altındaki on kadeh neşeli bir aileyi aydınlatır. Duygusal tamamlanmanın ve nihai mutluluğun sembolüdür.',
    keywords: ['Aile Saadeti', 'Kutsal Birlik', 'Kalıcı Yuva', 'Sonsuz Aşk'],
  },
};

export function getModernTarotMeaning(cardId: string): TarotCardLexiconItem | null {
  const normId = cardId.toLowerCase().replace(/_/g, '-');
  return MODERN_TAROT_INTERPRETATIONS[normId] || null;
}
