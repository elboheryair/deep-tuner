import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from '../lib/pitchDetection.js';
import { createPitchSmoother } from '../lib/smoothPitch.js';
import {
  TUNING_PRESETS,
  centsFromTarget,
  frequencyToNote,
  stringTargetToFrequency,
} from '../lib/notes.js';

const IN_TUNE_CENTS = 5;
const MATCH_HOLD_MS = 400;

/**
 * @param {object} options
 * @param {boolean} [options.headless=false]
 * @param {{ note: string, octave: number, label?: string }|null} [options.targetNote] - external target override
 * @param {(payload: { inTune: boolean, cents: number, frequency: number }) => void} [options.onNoteMatch]
 * @param {string} [options.initialPresetId='standard']
 * @param {number} [options.initialStringIndex=0]
 * @param {number} [options.metronomeBpm=120]
 */
export function useTuner({
  headless = false,
  targetNote: externalTarget = null,
  onNoteMatch,
  initialPresetId = 'standard',
  initialStringIndex = 0,
  metronomeBpm = 120,
} = {}) {
  const [listening, setListening] = useState(false);
  const [presetId, setPresetId] = useState(initialPresetId);
  const [stringIndex, setStringIndex] = useState(initialStringIndex);
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [micError, setMicError] = useState(null);
  const [referencePlaying, setReferencePlaying] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);
  const timeDomainBufferRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const lastMatchRef = useRef({ inTune: false, at: 0 });
  const targetFrequencyRef = useRef(0);
  const pitchSmootherRef = useRef(null);
  if (!pitchSmootherRef.current) {
    pitchSmootherRef.current = createPitchSmoother();
  }

  const preset = TUNING_PRESETS[presetId] ?? TUNING_PRESETS.standard;
  const internalTarget = preset.strings[stringIndex] ?? preset.strings[0];
  const activeTarget = externalTarget ?? internalTarget;
  const targetFrequency = stringTargetToFrequency(activeTarget);
  targetFrequencyRef.current = targetFrequency ?? 0;

  const cents =
    targetFrequency && detectedFrequency
      ? centsFromTarget(detectedFrequency, targetFrequency)
      : 0;

  const detected = frequencyToNote(detectedFrequency);
  const inTune = Math.abs(cents) <= IN_TUNE_CENTS && detectedFrequency > 0;

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  }, []);

  const stopDetectionLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopMic = useCallback(() => {
    stopDetectionLoop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        /* already disconnected */
      }
      analyserRef.current = null;
    }
    pitchSmootherRef.current?.reset();
    setListening(false);
    setDetectedFrequency(0);
  }, [stopDetectionLoop]);

  const runDetectionLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;
    if (!analyser || !ctx) return;

    const buffer = timeDomainBufferRef.current;
    analyser.getFloatTimeDomainData(buffer);
    const hint = targetFrequencyRef.current;
    const rawFreq = detectPitch(buffer, ctx.sampleRate, {
      hintFrequency: hint > 0 ? hint : undefined,
    });
    const displayFreq = pitchSmootherRef.current.step(
      rawFreq ?? null,
      hint > 0 ? hint : 0,
    );
    if (displayFreq) {
      setDetectedFrequency(displayFreq);
    }

    rafRef.current = requestAnimationFrame(runDetectionLoop);
  }, []);

  const startMic = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      source.connect(analyser);
      analyserRef.current = analyser;
      timeDomainBufferRef.current = new Float32Array(analyser.fftSize);

      setListening(true);
      stopDetectionLoop();
      rafRef.current = requestAnimationFrame(runDetectionLoop);
    } catch (err) {
      setMicError(err?.message ?? 'Microphone access denied');
      stopMic();
    }
  }, [getAudioContext, runDetectionLoop, stopDetectionLoop, stopMic]);

  const toggleListening = useCallback(() => {
    if (listening) {
      stopMic();
    } else {
      startMic();
    }
  }, [listening, startMic, stopMic]);

  const stopReferenceTone = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {
        /* already stopped */
      }
      oscillatorRef.current = null;
    }
    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch {
        /* noop */
      }
      gainRef.current = null;
    }
    setReferencePlaying(false);
  }, []);

  const playReferenceTone = useCallback(async () => {
    if (!targetFrequency) return;
    stopReferenceTone();

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = targetFrequency;
    gain.gain.value = 0.25;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscillatorRef.current = osc;
    gainRef.current = gain;
    setReferencePlaying(true);

    osc.onended = () => setReferencePlaying(false);
  }, [getAudioContext, stopReferenceTone, targetFrequency]);

  useEffect(() => {
    if (!onNoteMatch || !listening) return;

    const now = Date.now();
    const prev = lastMatchRef.current;
    const stableInTune = inTune && (prev.inTune ? now - prev.at > MATCH_HOLD_MS : true);

    if (inTune !== prev.inTune || (inTune && stableInTune)) {
      lastMatchRef.current = { inTune, at: now };
      if (inTune) {
        onNoteMatch({
          inTune: true,
          cents,
          frequency: detectedFrequency,
          target: activeTarget,
        });
      }
    }
  }, [inTune, cents, detectedFrequency, onNoteMatch, listening, activeTarget]);

  useEffect(() => {
    return () => {
      stopMic();
      stopReferenceTone();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [stopMic, stopReferenceTone]);

  useEffect(() => {
    pitchSmootherRef.current?.reset();
  }, [targetFrequency, stringIndex, presetId]);

  useEffect(() => {
    if (!headless) return undefined;
    startMic();
    return () => stopMic();
  }, [headless, startMic, stopMic]);

  return {
    headless,
    listening,
    toggleListening,
    micError,
    presetId,
    setPresetId,
    preset,
    presets: TUNING_PRESETS,
    stringIndex,
    setStringIndex,
    activeTarget,
    targetFrequency,
    detectedFrequency,
    detectedNote: detected,
    cents,
    inTune,
    playReferenceTone,
    stopReferenceTone,
    referencePlaying,
    metronomeBpm,
  };
}
