const DAY_MS = 24 * 60 * 60 * 1000;

export type Biorhythm = { physical: number; emotional: number; intellectual: number };

export function calculateBiorhythm(birthDate: Date, targetDate: Date = new Date()): Biorhythm {
  const days = Math.floor((targetDate.getTime() - birthDate.getTime()) / DAY_MS);
  const cycle = (period: number) => Math.round(Math.sin((2 * Math.PI * days) / period) * 100);
  return {
    physical: cycle(23),
    emotional: cycle(28),
    intellectual: cycle(33),
  };
}

export function biorhythmTone(value: number): string {
  if (Math.abs(value) <= 5) return 'bugün geçiş (kritik) gününde; dengeyi bulmak biraz zaman alabilir';
  if (value > 66) return 'zirvede; kendini oldukça güçlü hissedebilirsin';
  if (value > 0) return 'yükselişte; enerjin artıyor';
  if (value > -66) return 'düşüşte; biraz daha temkinli olmakta fayda var';
  return 'en düşük noktasına yakın; kendine nazik davran ve dinlenmeye zaman ayır';
}
