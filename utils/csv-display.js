import splitCsv from './split-csv.js';

export default function csvDisplay(value, { empty = '(none)' } = {}) {
  const values = splitCsv(value);
  return values.length > 0 ? values.join(', ') : empty;
}
