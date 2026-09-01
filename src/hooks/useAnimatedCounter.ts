import { useEffect, useRef, useState } from 'react';

// Bakiye satın alma sonrası anında zıplamak yerine tatlı ve dinamik bir
// sayaç efektiyle yükselsin (örn: 100 → 300 satın alındığında).
// İlk yüklemede veya 0'dan gerçek değere otururken ASLA animasyon oynamaz,
// anında gerçek bakiye gösterilir.
export function useAnimatedCounter(target: number, durationMs = 1400): number {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // İlk başlangıç veya ilk veri gelişinde (0'dan ilk kez yükleniyorsa) animasyonsuz anında otur
    if (prevTarget.current === null || (prevTarget.current === 0 && target > 0 && display === 0)) {
      prevTarget.current = target;
      setDisplay(target);
      return;
    }

    // Hedef değişmediyse işlem yapma
    if (target === prevTarget.current) return;

    const start = prevTarget.current;
    const end = target;
    prevTarget.current = target;

    // Sadece satın alma ile bakiye arttığında (start > 0 ve end > start) animasyon yap
    // Bakiye harcandığında veya sıfırlandığında anında güncelle
    if (start <= 0 || end <= start) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setDisplay(end);
      return;
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (rawProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setDisplay(end);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, display]);

  return display;
}
