import { useCallback, useEffect, useRef, useState } from 'react';
import { getRemainingCooldownSeconds } from '@/services/aiQueue';
import { READING_COOLDOWN_SECONDS, type ReadingType } from '@/constants/aiQueue';

// Drives the pre-emptive "sırada bekleniyor" countdown UI: mirrors the
// server/service-layer cooldown locally so a screen can disable its trigger
// and show a live countdown instead of letting the user fire a request that
// the backend will just reject. `notifyStarted` is called right after the
// gated request is kicked off (success or failure) to snap the local
// countdown to the full duration immediately, without waiting for storage.
export function useReadingCooldown(type: ReadingType) {
  const [remaining, setRemaining] = useState(0);
  // True once the initial AsyncStorage read has resolved — callers that want
  // to auto-fire a request the moment the cooldown clears must wait for this,
  // otherwise they'd race the async check and fire during the brief window
  // where `remaining` is still its 0 initial value.
  const [checked, setChecked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ensureInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      const seconds = await getRemainingCooldownSeconds(type);
      setRemaining(seconds);
      if (seconds <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);
  }, [type]);

  useEffect(() => {
    getRemainingCooldownSeconds(type).then((seconds) => {
      setRemaining(seconds);
      setChecked(true);
      if (seconds > 0) ensureInterval();
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [type, ensureInterval]);

  const notifyStarted = useCallback(() => {
    setRemaining(READING_COOLDOWN_SECONDS[type]);
    ensureInterval();
  }, [type, ensureInterval]);

  return { remaining, checked, notifyStarted };
}
