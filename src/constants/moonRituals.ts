import type { MoonPhaseName } from '@/services/moonPhase';

export const MOON_PHASE_ICONS: Record<MoonPhaseName, string> = {
  'Yeni Ay': 'moon-new',
  'Hilal (Büyüyen)': 'moon-waxing-crescent',
  'İlk Dördün': 'moon-first-quarter',
  'Şişkin Ay (Büyüyen)': 'moon-waxing-gibbous',
  Dolunay: 'moon-full',
  'Şişkin Ay (Küçülen)': 'moon-waning-gibbous',
  'Son Dördün': 'moon-last-quarter',
  'Hilal (Küçülen)': 'moon-waning-crescent',
};

export const MOON_PHASE_INFO: Record<MoonPhaseName, { description: string; ritual: string }> = {
  'Yeni Ay': {
    description: 'Gökyüzü karanlık; yeni bir döngünün ilk tohumları atılıyor.',
    ritual: 'Bu gece tam sana göre bir gece: bir kağıt al, bu ay ne istediğini yaz. Süslemene gerek yok, sadece aklından geçeni dök.',
  },
  'Hilal (Büyüyen)': {
    description: 'İnce bir ışık hattı beliriyor; niyetler yavaşça büyümeye başlıyor.',
    ritual: 'Geçen hafta yazdığın o niyetler hâlâ orada duruyor mu? Bugün onlardan birine küçük, gerçek bir adım at.',
  },
  'İlk Dördün': {
    description: 'Ay yarı aydınlık; enerji ve kararlılık gerektiren bir eşik anı.',
    ritual: 'Ertelediğin o karar var ya, tam da bugünlük. Zor gelse de bir adım at, geri kalanı kendiliğinden gelir.',
  },
  'Şişkin Ay (Büyüyen)': {
    description: 'Ay neredeyse dolmak üzere; ilerleme ve inceltme zamanı.',
    ritual: 'Başladığın işe bir göz at, neyin iyi gittiğine bak. Dolunaya birkaç gün kaldı, kendini biraz toparlamanın zamanı.',
  },
  Dolunay: {
    description: 'Ay tam ışığıyla parlıyor; duygular ve farkındalık zirvede.',
    ritual: 'Bu gece dışarı çık, ay ışığına biraz bak. Şükran duyduğun üç şeyi sessizce say; bu basit ama şaşırtıcı derecede iyi geliyor.',
  },
  'Şişkin Ay (Küçülen)': {
    description: 'Işık yavaşça azalıyor; toplama ve değerlendirme zamanı.',
    ritual: 'Dolunayda fark ettiğin şeyi hemen unutma. Bir cümleyle bile olsa not al, birkaç gün sonra işine yarayacak.',
  },
  'Son Dördün': {
    description: 'Ay yeniden yarı aydınlık; bırakma ve arınma enerjisi güçlü.',
    ritual: 'Telefonundaki, dolabındaki ya da kafandaki bir şeyi bugün bırak. Küçük bir "temizlik" bile bu gece tam sana göre.',
  },
  'Hilal (Küçülen)': {
    description: 'Işık iyice inceliyor; dinlenme ve içe dönüş zamanı yaklaşıyor.',
    ritual: 'Bu akşam erken yat, kendine biraz sessizlik ayır. Yeni ay yaklaşıyor, biraz dinlenmeyi hak ediyorsun.',
  },
};
