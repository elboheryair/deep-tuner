/**
 * Metronome ↔ pitch sampling (mpm-hint-metronome strategy).
 *
 * BEAT_SAMPLE_DELAY_MS — wait after the visual beat before opening the capture window.
 * Use this if you pluck slightly after the click (e.g. 50–120 ms).
 *
 * CAPTURE_MS — how long pitch is analyzed once the window opens (see sampleCapture.js).
 */
export const BEAT_SAMPLE_DELAY_MS = 50;
