# Deep Tuner

React + Tailwind guitar tuner MVP with modular components for standalone use or fretbot integration.

## Develop

Requires **Node.js 18+**.

```bash
npm install
npm run dev
```

## Architecture

- **`src/hooks/useTuner.js`** — Web Audio mic stream, pitch detection, reference tone, and headless callbacks.
- **`src/lib/pitch/`** — Pluggable pitch strategies (registry + shared MPM core). Default: `mpm-hint-biased` in `src/config/pitchDetection.js`.
- **`src/components/`** — UI modules (`DeepTuner`, `PitchGauge`, etc.) importable without route coupling.

### Pitch detection strategies

Built-in strategies register on import via `registerDefaultPitchStrategies()`:

| Id | Role |
|----|------|
| `mpm-hint-biased` | **Default** — Target-biased NSDF band; strongest peak in window. |
| `mpm-hint-fundamental` | Hint window + fundamental peak pick; **pitch runs only on pluck envelope peaks** (ignores decay/noise until re-armed). |
| `mpm-hint-metronome` | **Metronome on** — samples in a short window after each beat; target-biased NSDF + median per beat. Tune delay/length in `src/config/metronome.js` and `CAPTURE_MS` in `sampleCapture.js`. |

Switch in the UI (**Pitch algorithm** buttons) or via props / hook:

```jsx
<DeepTuner pitchStrategyId="mpm-hint-fundamental" />
```

```js
import { registerPitchStrategy } from './lib/pitch/index.js';
import { registerDefaultPitchStrategies } from './lib/pitch/registerDefaults.js';

registerDefaultPitchStrategies();
registerPitchStrategy({
  id: 'my-filter-c',
  label: 'Strategy C',
  detect(buffer, sampleRate, options) { /* … */ return null; },
});
```

Add new algorithms under `src/lib/pitch/strategies/` and register them in `registerDefaults.js` (or call `registerPitchStrategy` from your host app).

### Headless mode

```jsx
<DeepTuner
  headless
  targetNote={{ note: 'E', octave: 2, label: 'E2' }}
  onNoteMatch={({ inTune, cents, frequency }) => { /* … */ }}
/>
```
