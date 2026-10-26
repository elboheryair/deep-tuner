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
- **`src/components/`** — UI modules (`DeepTuner`, `PitchGauge`, etc.) importable without route coupling.

### Headless mode

```jsx
<DeepTuner
  headless
  targetNote={{ note: 'E', octave: 2, label: 'E2' }}
  onNoteMatch={({ inTune, cents, frequency }) => { /* … */ }}
/>
```
