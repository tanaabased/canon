import { WORK_SIZES } from '../../task-author/lib/task-author-contract.js';

/** Project the shared Work size rubric into decomposition-review guidance. */
export default function evaluateDecompositionThreshold(workSize) {
  if (workSize === null || workSize === undefined) {
    return {
      workSize: null,
      suggestedDecision: null,
      explicitReviewRequired: false,
      rationale: 'Work size is unavailable; use task evidence rather than inventing an estimate.',
    };
  }

  const normalized = Number(workSize);
  if (!WORK_SIZES.includes(normalized)) {
    throw new Error(`Unsupported Work size for decomposition review: ${workSize}`);
  }
  if (normalized === 21) {
    return {
      workSize: normalized,
      suggestedDecision: 'decompose',
      explicitReviewRequired: true,
      rationale: 'Work size 21 is oversized and should normally become a shallow parent.',
    };
  }
  if (normalized === 13) {
    return {
      workSize: normalized,
      suggestedDecision: null,
      explicitReviewRequired: true,
      rationale: 'Work size 13 requires an explicit keep-or-decompose review.',
    };
  }
  return {
    workSize: normalized,
    suggestedDecision: 'keep_intact',
    explicitReviewRequired: false,
    rationale: `Work size ${normalized} does not trigger the shared decomposition threshold.`,
  };
}
