const PUBLICATION_PATTERNS = Object.freeze([
  { name: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: 'OpenAI API key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'AWS access key', pattern: /\bAKIA[A-Z0-9]{16}\b/ },
  { name: 'bearer credential', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i },
]);

/**
 * Enforce public-text scanning, safety attestation, exact target approval, and
 * exact-plan approval for one remote mutation.
 *
 * @param {object} input Publication evaluation input.
 * @param {string} input.digest Exact plan digest.
 * @param {string[]} input.texts Public text that the plan may publish.
 * @param {string} input.target Canonical mutation target.
 * @param {object} [input.publication] Caller-provided approval fields.
 * @returns {object} Structured approval result and findings.
 */
export default function evaluatePublication({ digest, publication = {}, target, texts }) {
  const publicText = texts.map((value) => String(value ?? '')).join('\n');
  const findings = PUBLICATION_PATTERNS.filter(({ pattern }) => pattern.test(publicText)).map(
    ({ name }) => name,
  );
  const reasons = [];

  if (findings.length > 0) {
    reasons.push(`Publication text contains possible sensitive material: ${findings.join(', ')}.`);
  }
  if (publication.safetyReviewed !== true) {
    reasons.push('Publication safety review has not been attested.');
  }
  if (publication.approvedTarget !== target) {
    reasons.push(`Publication target must be approved exactly as ${target}.`);
  }
  if (publication.approvedDigest !== digest) {
    reasons.push('Publication approval does not match the exact mutation-plan digest.');
  }

  return {
    approved: reasons.length === 0,
    digest,
    target,
    safetyReviewed: publication.safetyReviewed === true,
    findings,
    reasons,
  };
}
