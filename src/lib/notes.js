/** A4 reference frequency (Hz) */
export const A4_FREQUENCY = 440;

/** Note names for display */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TUNING_PRESETS = {
  standard: {
    id: 'standard',
    label: 'Standard E',
    strings: [
      { note: 'E', octave: 2, label: 'E2' },
      { note: 'A', octave: 2, label: 'A2' },
      { note: 'D', octave: 3, label: 'D3' },
      { note: 'G', octave: 3, label: 'G3' },
      { note: 'B', octave: 3, label: 'B3' },
      { note: 'E', octave: 4, label: 'E4' },
    ],
  },
  dropD: {
    id: 'dropD',
    label: 'Drop D',
    strings: [
      { note: 'D', octave: 2, label: 'D2' },
      { note: 'A', octave: 2, label: 'A2' },
      { note: 'D', octave: 3, label: 'D3' },
      { note: 'G', octave: 3, label: 'G3' },
      { note: 'B', octave: 3, label: 'B3' },
      { note: 'E', octave: 4, label: 'E4' },
    ],
  },
  halfStepDown: {
    id: 'halfStepDown',
    label: 'Half Step Down',
    strings: [
      { note: 'D#', octave: 2, label: 'Eb2' },
      { note: 'G#', octave: 2, label: 'Ab2' },
      { note: 'C#', octave: 3, label: 'Db3' },
      { note: 'F#', octave: 3, label: 'Gb3' },
      { note: 'A#', octave: 3, label: 'Bb3' },
      { note: 'D#', octave: 4, label: 'Eb4' },
    ],
  },
};

export function noteToMidi(note, octave) {
  const index = NOTE_NAMES.indexOf(note);
  if (index === -1) return null;
  return (octave + 1) * 12 + index;
}

export function midiToFrequency(midi) {
  return A4_FREQUENCY * 2 ** ((midi - 69) / 12);
}

export function stringTargetToFrequency({ note, octave }) {
  const midi = noteToMidi(note, octave);
  if (midi == null) return null;
  return midiToFrequency(midi);
}

export function frequencyToNote(frequency) {
  if (!frequency || frequency <= 0 || !Number.isFinite(frequency)) {
    return { note: '—', cents: 0, frequency: 0 };
  }
  const midiFloat = 69 + 12 * Math.log2(frequency / A4_FREQUENCY);
  const midiRounded = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midiRounded) * 100);
  const noteIndex = ((midiRounded % 12) + 12) % 12;
  const octave = Math.floor(midiRounded / 12) - 1;
  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    label: `${NOTE_NAMES[noteIndex]}${octave}`,
    cents,
    frequency,
    midi: midiRounded,
  };
}

/** Cents deviation of `frequency` from target string frequency (negative = flat). */
export function centsFromTarget(frequency, targetFrequency) {
  if (!frequency || !targetFrequency || frequency <= 0 || targetFrequency <= 0) {
    return 0;
  }
  return 1200 * Math.log2(frequency / targetFrequency);
}

/**
 * HSL color for pitch feedback: red at ±50+ cents, green near 0.
 * @param {number} cents - deviation from target
 */
export function pitchAccuracyColor(cents, maxCents = 50) {
  const abs = Math.min(Math.abs(cents), maxCents);
  const t = 1 - abs / maxCents;
  const hue = t * 120;
  return `hsl(${hue}, 85%, 52%)`;
}
