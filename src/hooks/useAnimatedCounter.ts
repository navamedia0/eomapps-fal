import { useEffect, useRef, useState } from 'react';

// Bakiye satın alma sonrası anında zıplamak yerine hızlıca sayarak yükselsin
// diye (150 → 151 → 152 ... gibi ama çok hızlı) — ~4 saniyede tamamlanan,
// yavaşlayarak duran (ease-out) bir sayaç. İlk yüklemede (henüz önceki bir
// değer yokken) animasyon oynamadan doğrudan hedefe oturur.
export function useAnimatedCounter(target: number, durationMs = 4000): number {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const initialized = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      prevTarget.current = target;
      setDisplay(target);
      return;
    }
    if (target === prevTarget.current) return;

    const start = prevTarget.current;
    const end = target;
    const startTime = Date.now();
    prevTarget.current = target;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (rawProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}
