import evaluatePublication from '../../../utils/evaluate-publication.js';

function publicationText(plan) {
  return [plan.issue.title, plan.issue.body, ...plan.comments.map(({ body }) => body)].join('\n');
}

/** Enforce secret scanning, safety attestation, exact target, and exact-plan approval. */
export function evaluateTaskPublication(plan, digest, publication = {}) {
  return evaluatePublication({
    digest,
    publication,
    target: plan.target,
    texts: [publicationText(plan)],
  });
}
