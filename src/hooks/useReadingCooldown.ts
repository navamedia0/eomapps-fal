import { useCallback, useEffect, useRef, useState } from 'react';
import { getRemainingCongestionSeconds, reportCongestion } from '@/services/aiQueue';
import type { ReadingType } from '@/constants/aiQueue';

// Drives the "sistem yoğun" countdown UI — but only ever shows something when
// the AI proxy has genuinely told us it's congested (a real 429 with
// congestion: true), never as a blanket per-request timer. Call
// `notifyCongested(retryAfterSeconds)` from a screen's catch block when that
// happens; `remaining` stays 0 the rest of the time, including during normal
// solo use.
export function useReadingCooldown(type: ReadingType) {
  const [remaining, setRemaining] = useState(0);
  // True once the initial AsyncStorage read has resolved.
  const [checked, setChecked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ensureInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      const seconds = await getRemainingCongestionSeconds(type);
      setRemaining(seconds);
      if (seconds <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);
  }, [type]);

  useEffect(() => {
    getRemainingCongestionSeconds(type).then((seconds) => {
      setRemaining(seconds);
      setChecked(true);
      if (seconds > 0) ensureInterval();
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [type, ensureInterval]);

  const notifyCongested = useCallback(
    (retryAfterSeconds: number) => {
      reportCongestion(type, retryAfterSeconds);
      setRemaining(retryAfterSeconds);
      ensureInterval();
    },
    [type, ensureInterval],
  );

  return { remaining, checked, notifyCongested };
}
