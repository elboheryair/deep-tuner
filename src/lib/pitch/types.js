/**
 * @typedef {object} SampleCaptureState
 * @property {number} captureUntil
 * @property {number} peakRmsAtTrigger
 * @property {number[]} captureFreqs
 * @property {boolean} pendingFlush
 */

/**
 * @typedef {object} PeakGateState
 * @property {'armed'|'capturing'|'cooldown'} phase
 * @property {number} prevRms
 * @property {number} prevPrevRms
 * @property {number} captureUntil
 * @property {number} peakRmsAtTrigger
 * @property {number[]} captureFreqs
 * @property {boolean} pendingFlush
 */

/**
 * @typedef {object} BeatGateState
 * @property {'idle'|'waiting'|'capturing'} phase
 * @property {number} lastBeatSerial
 * @property {number} captureStartAt
 * @property {number} captureUntil
 * @property {number} peakRmsAtTrigger
 * @property {number[]} captureFreqs
 * @property {boolean} pendingFlush
 */

/**
 * @typedef {object} MetronomeClock
 * @property {{ current: boolean }} enabledRef
 * @property {{ current: number }} beatSerialRef
 */

/**
 * @typedef {object} PitchDetectionOptions
 * @property {number} [hintFrequency] - Selected string target (Hz); strategies may narrow search.
 * @property {number} [hintWindowCents] - Half-width of hint band in cents (hint-biased strategies).
 * @property {PeakGateState} [peakGateState] - Per-session state for pluck-peak gating strategies.
 * @property {BeatGateState} [beatGateState] - Per-session state for metronome beat gating.
 * @property {MetronomeClock} [metronomeClock] - Shared metronome clock from `useMetronome`.
 */

/**
 * Pluggable pitch estimator. Keep `detect` allocation-light for rAF loops.
 *
 * @typedef {object} PitchDetectionStrategy
 * @property {string} id - Stable registry key (e.g. `mpm-hint-biased`).
 * @property {string} label - Human-readable name for UI.
 * @property {string} [description]
 * @property {(buffer: Float32Array, sampleRate: number, options?: PitchDetectionOptions) => number|null} detect
 */

export {};
