import { Body, Illumination, MoonPhase, NextMoonQuarter, SearchMoonQuarter } from 'astronomy-engine';

export type MoonPhaseName =
  | 'Yeni Ay'
  | 'Hilal (Büyüyen)'
  | 'İlk Dördün'
  | 'Şişkin Ay (Büyüyen)'
  | 'Dolunay'
  | 'Şişkin Ay (Küçülen)'
  | 'Son Dördün'
  | 'Hilal (Küçülen)';

export type MoonPhaseInfo = {
  phaseAngle: number;
  illumination: number;
  phaseName: MoonPhaseName;
  nextNewMoon: Date;
  nextFullMoon: Date;
};

function phaseNameFromAngle(angle: number): MoonPhaseName {
  if (angle < 22.5 || angle >= 337.5) return 'Yeni Ay';
  if (angle < 67.5) return 'Hilal (Büyüyen)';
  if (angle < 112.5) return 'İlk Dördün';
  if (angle < 157.5) return 'Şişkin Ay (Büyüyen)';
  if (angle < 202.5) return 'Dolunay';
  if (angle < 247.5) return 'Şişkin Ay (Küçülen)';
  if (angle < 292.5) return 'Son Dördün';
  return 'Hilal (Küçülen)';
}

function findNextQuarters(from: Date): { nextNewMoon: Date; nextFullMoon: Date } {
  let quarter = SearchMoonQuarter(from);
  const found: Partial<Record<number, Date>> = {};
  for (let i = 0; i < 6 && (found[0] === undefined || found[2] === undefined); i += 1) {
    found[quarter.quarter] = quarter.time.date;
    quarter = NextMoonQuarter(quarter);
  }
  return { nextNewMoon: found[0]!, nextFullMoon: found[2]! };
}

export function calculateMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const phaseAngle = MoonPhase(date);
  const illumination = Illumination(Body.Moon, date).phase_fraction;
  const { nextNewMoon, nextFullMoon } = findNextQuarters(date);
  return {
    phaseAngle,
    illumination,
    phaseName: phaseNameFromAngle(phaseAngle),
    nextNewMoon,
    nextFullMoon,
  };
}
