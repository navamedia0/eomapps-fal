import type { BirthFormValue } from '@/components/BirthDataForm';

const TURKEY_UTC_OFFSET = 3;

export type BirthDateResult = { date: Date; error: null } | { date: null; error: string };

export function resolveBirthDate(value: BirthFormValue): BirthDateResult {
  const dayNum = Number(value.day);
  const monthNum = Number(value.month);
  const yearNum = Number(value.year);
  const hourNum = value.unknownTime ? 12 : Number(value.hour);
  const minuteNum = value.unknownTime ? 0 : Number(value.minute);

  if (!dayNum || !monthNum || !yearNum || yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return { date: null, error: 'Lütfen geçerli bir doğum tarihi gir.' };
  }
  const localCheck = new Date(yearNum, monthNum - 1, dayNum);
  if (localCheck.getMonth() !== monthNum - 1 || localCheck.getDate() !== dayNum) {
    return { date: null, error: 'Lütfen geçerli bir doğum tarihi gir.' };
  }
  if (!value.unknownTime && (!value.hour || !value.minute)) {
    return { date: null, error: 'Lütfen doğum saatini seç ya da "bilmiyorum" seçeneğini işaretle.' };
  }
  if (value.cityIndex === null) {
    return { date: null, error: 'Lütfen doğum yerine en yakın şehri seç.' };
  }

  const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum, hourNum - TURKEY_UTC_OFFSET, minuteNum));
  return { date, error: null };
}
