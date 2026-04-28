import splitCsv from './split-csv.js';

/**
 * Formats comma-delimited or repeatable values for human CLI output.
 *
 * @param {unknown | unknown[]} value Single CSV value or repeatable values.
 * @param {object} [options]
 * @param {string} [options.empty='(none)'] Display value when no entries remain.
 * @returns {string} Comma-space joined display text.
 */
export default function csvDisplay(value, { empty = '(none)' } = {}) {
  const values = splitCsv(value);
  return values.length > 0 ? values.join(', ') : empty;
}
