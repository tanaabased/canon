/**
 * Interprets CLI/env-style enablement values while treating unknown non-empty
 * values as enabled. Empty input is the only path that falls back.
 *
 * @param {unknown} value Value to interpret; known disabled values are 0, false, no, off, and disabled.
 * @param {boolean} [fallback=false] Value returned for null, undefined, or blank input.
 * @returns {boolean} Whether the value should be treated as enabled.
 */
export default function valueEnabled(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return Boolean(fallback);
  }

  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) {
    return false;
  }

  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) {
    return true;
  }

  return true;
}
