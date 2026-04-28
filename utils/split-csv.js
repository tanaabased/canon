/**
 * Normalizes one value or repeated option values into trimmed comma-delimited
 * entries, dropping blanks from either source.
 *
 * @param {unknown | unknown[]} value Single CSV value or repeatable values.
 * @returns {string[]} Trimmed entries with empty values removed.
 */
export default function splitCsv(value) {
  const rawValues = Array.isArray(value) ? value : [value];

  return rawValues
    .flatMap((rawValue) => String(rawValue ?? '').split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
}
