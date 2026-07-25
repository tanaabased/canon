const FAILURE_VALUES = new Set([
  'failure',
  'error',
  'fail',
  'cancelled',
  'timed_out',
  'action_required',
]);

function normalizeField(value) {
  return value === null || value === undefined ? '' : String(value).trim().toLowerCase();
}

/**
 * Classifies failing checks across modern and legacy gh field shapes.
 *
 * @param {object} check Raw check record.
 * @returns {boolean} Whether the check failed.
 */
export default function isFailingCheck(check) {
  return [check.conclusion, check.state || check.status, check.bucket].some((value) =>
    FAILURE_VALUES.has(normalizeField(value)),
  );
}
