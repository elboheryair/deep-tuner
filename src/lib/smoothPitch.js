/**
 * Adaptive exponential smoother in cents (log-frequency space).
 * Fast when far from target, slower when close; dampens single-frame spikes.
 */
export function createPitchSmoother() {
  let smoothedCents = null;
  let lockedTargetHz = null;

  function reset() {
    smoothedCents = null;
    lockedTargetHz = null;
  }

  function centsToFrequency(cents, targetHz) {
    return targetHz * 2 ** (cents / 1200);
  }

  /**
   * @param {number|null|undefined} rawFrequency
   * @param {number} targetFrequency
   * @returns {number|null} smoothed frequency for UI
   */
  function step(rawFrequency, targetFrequency) {
    if (!targetFrequency || targetFrequency <= 0) {
      reset();
      return null;
    }

    if (lockedTargetHz !== targetFrequency) {
      lockedTargetHz = targetFrequency;
      smoothedCents = null;
    }

    if (!rawFrequency || rawFrequency <= 0) {
      return smoothedCents != null ? centsToFrequency(smoothedCents, targetFrequency) : null;
    }

    const rawCents = 1200 * Math.log2(rawFrequency / targetFrequency);

    if (smoothedCents == null) {
      smoothedCents = rawCents;
      return rawFrequency;
    }

    const delta = rawCents - smoothedCents;
    const absRaw = Math.abs(rawCents);

    let alpha;
    if (Math.abs(delta) > 14) {
      alpha = 0.07;
    } else if (Math.abs(delta) < 2.5) {
      alpha = 0.32;
    } else if (absRaw > 25) {
      alpha = 0.38;
    } else if (absRaw > 10) {
      alpha = 0.24;
    } else {
      alpha = 0.18;
    }

    smoothedCents += alpha * delta;
    return centsToFrequency(smoothedCents, targetFrequency);
  }

  return { step, reset };
}
