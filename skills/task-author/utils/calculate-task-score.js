import { SCORE_FACTORS, SCORE_FORMULA_VERSION, WORK_SIZES } from '../lib/task-author-contract.js';

const REQUIRED_FACTORS = Object.freeze([
  ['impact', 'impact'],
  ['workSize', null],
  ['urgency', 'urgency'],
  ['enablement', 'enablement'],
  ['confidence', 'confidence'],
]);

function normalizeLevel(value) {
  return typeof value === 'string' ? value.trim().toLowerCase().replaceAll(' ', '-') : value;
}

/** Calculate an explainable goal-independent Task score. */
export function calculateTaskScore(input = {}) {
  const factors = {};
  const missing = [];
  const errors = [];

  for (const [key, mapping] of REQUIRED_FACTORS) {
    const rawValue = input[key];
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      missing.push(key);
      continue;
    }

    if (key === 'workSize') {
      const value = Number(rawValue);
      if (!WORK_SIZES.includes(value)) {
        errors.push(`workSize must be one of: ${WORK_SIZES.join(', ')}.`);
      } else {
        factors[key] = { level: value, value };
      }
      continue;
    }

    const level = normalizeLevel(rawValue);
    const numericValue = SCORE_FACTORS[mapping][level];
    if (numericValue === undefined) {
      errors.push(`${key} has an unsupported level: ${rawValue}.`);
    } else {
      factors[key] = { level, value: numericValue };
    }
  }

  if (missing.length > 0 || errors.length > 0) {
    return { score: null, formulaVersion: SCORE_FORMULA_VERSION, factors, missing, errors };
  }

  const benefit =
    0.6 * factors.impact.value + 0.2 * factors.urgency.value + 0.2 * factors.enablement.value;
  const penalty = 1 + 0.15 * Math.log(factors.workSize.value);
  const score = Math.max(
    0,
    Math.min(100, Math.round((100 * benefit * factors.confidence.value) / penalty)),
  );

  return {
    score,
    formulaVersion: SCORE_FORMULA_VERSION,
    factors,
    calculation: { benefit, penalty },
    missing,
    errors,
  };
}
