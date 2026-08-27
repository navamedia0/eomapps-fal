import katinaMeanings from '@/data/katina_meanings.json';
import iskambilDetails from '@/data/iskambil_card_details.json';

export type IskambilCardDetail = {
  name: string;
  figure: string;
  element: string;
  meaning: string;
  story: string;
  advice: string;
};

const MEANINGS: Record<string, string> = katinaMeanings;
const DETAILS: Record<string, IskambilCardDetail> = iskambilDetails as Record<string, IskambilCardDetail>;

export function getKatinaMeaning(id: string): string | undefined {
  return DETAILS[id]?.meaning ?? MEANINGS[id];
}

export function getKatinaCardDetail(id: string): IskambilCardDetail | undefined {
  return DETAILS[id];
}
