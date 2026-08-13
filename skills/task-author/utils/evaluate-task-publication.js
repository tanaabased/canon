const PUBLICATION_PATTERNS = Object.freeze([
  { name: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: 'OpenAI API key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'AWS access key', pattern: /\bAKIA[A-Z0-9]{16}\b/ },
  { name: 'bearer credential', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i },
]);

function publicationText(plan) {
  return [plan.issue.title, plan.issue.body, ...plan.comments.map(({ body }) => body)].join('\n');
}

/** Enforce secret scanning, safety attestation, exact target, and exact-plan approval. */
export function evaluateTaskPublication(plan, digest, publication = {}) {
  const text = publicationText(plan);
  const findings = PUBLICATION_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ name }) => name,
  );
  const reasons = [];

  if (findings.length > 0) {
    reasons.push(`Publication text contains possible sensitive material: ${findings.join(', ')}.`);
  }
  if (publication.safetyReviewed !== true) {
    reasons.push('Publication safety review has not been attested.');
  }
  if (publication.approvedTarget !== plan.target) {
    reasons.push(`Publication target must be approved exactly as ${plan.target}.`);
  }
  if (publication.approvedDigest !== digest) {
    reasons.push('Publication approval does not match the exact mutation-plan digest.');
  }

  return {
    approved: reasons.length === 0,
    digest,
    target: plan.target,
    safetyReviewed: publication.safetyReviewed === true,
    findings,
    reasons,
  };
}
