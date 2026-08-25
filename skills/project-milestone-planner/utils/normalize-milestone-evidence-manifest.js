function positiveNumbers(values, label) {
  if (values === undefined) return [];
  if (!Array.isArray(values)) throw new Error(`${label} must be a list of positive numbers.`);
  const numbers = values.map(Number);
  if (numbers.some((number) => !Number.isInteger(number) || number <= 0)) {
    throw new Error(`${label} must contain only positive numbers.`);
  }
  return [...new Set(numbers)].sort((left, right) => left - right);
}

/**
 * Normalizes the explicit bounded evidence manifest for one milestone plan.
 *
 * @param {object | null | undefined} value Untrusted manifest input.
 * @returns {object} Stable task and pull-request selectors.
 * @throws {Error} When a selector is invalid or would widen the evidence boundary.
 */
export default function normalizeMilestoneEvidenceManifest(value) {
  const input = value ?? {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Evidence manifest must be an object.');
  }
  const unknown = Object.keys(input).filter(
    (key) => !['pullRequestNumbers', 'taskNumbers'].includes(key),
  );
  if (unknown.length > 0) {
    throw new Error(`Evidence manifest contains unsupported fields: ${unknown.sort().join(', ')}.`);
  }
  return {
    pullRequestNumbers: positiveNumbers(input.pullRequestNumbers, 'Pull-request numbers'),
    taskNumbers: positiveNumbers(input.taskNumbers, 'Task numbers'),
  };
}
