import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_BPM = 40;
const MAX_BPM = 240;
const BEAT_FLASH_MS = 140;

function clampBpm(value) {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

/**
 * Shared metronome clock for UI and beat-gated pitch strategies.
 * @param {number} [initialBpm=60]
 */
export function useMetronome(initialBpm = 60) {
  const [enabled, setEnabled] = useState(false);
  const [bpm, setBpm] = useState(clampBpm(initialBpm));
  const [beatActive, setBeatActive] = useState(false);

  const enabledRef = useRef(false);
  enabledRef.current = enabled;

  const beatSerialRef = useRef(0);
  const nextBeatAtRef = useRef(null);
  const timerRef = useRef(null);
  const flashTimerRef = useRef(null);

  const metronomeClockRef = useRef({
    enabledRef,
    beatSerialRef,
  });

  const triggerBeat = useCallback(() => {
    beatSerialRef.current += 1;
    setBeatActive(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setBeatActive(false), BEAT_FLASH_MS);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      nextBeatAtRef.current = null;
      setBeatActive(false);
      return undefined;
    }

    const intervalMs = 60000 / bpm;

    const schedule = () => {
      const now = performance.now();
      if (nextBeatAtRef.current == null) {
        nextBeatAtRef.current = now + intervalMs;
        triggerBeat();
      }
      const delay = nextBeatAtRef.current - now;
      timerRef.current = setTimeout(() => {
        triggerBeat();
        nextBeatAtRef.current += intervalMs;
        schedule();
      }, Math.max(0, delay));
    };

    nextBeatAtRef.current = null;
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      nextBeatAtRef.current = null;
    };
  }, [enabled, bpm, triggerBeat]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const setBpmClamped = useCallback((value) => {
    setBpm(clampBpm(value));
  }, []);

  return {
    enabled,
    setEnabled,
    bpm,
    setBpm: setBpmClamped,
    beatActive,
    metronomeClock: metronomeClockRef.current,
  };
}
