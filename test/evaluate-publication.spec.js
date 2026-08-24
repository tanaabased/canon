import assert from 'node:assert/strict';

import evaluatePublication from '../utils/evaluate-publication.js';

describe('utils/evaluate-publication', () => {
  it('should approve only an attested exact target and digest', () => {
    const report = evaluatePublication({
      digest: 'sha256:exact',
      publication: {
        approvedDigest: 'sha256:exact',
        approvedTarget: 'acme/widgets#4',
        safetyReviewed: true,
      },
      target: 'acme/widgets#4',
      texts: ['Ship the bounded milestone.'],
    });

    assert.equal(report.approved, true);
    assert.deepEqual(report.findings, []);
    assert.deepEqual(report.reasons, []);
  });

  it('should block sensitive text and stale approval fields', () => {
    const report = evaluatePublication({
      digest: 'sha256:fresh',
      publication: {
        approvedDigest: 'sha256:stale',
        approvedTarget: 'acme/other#4',
        safetyReviewed: true,
      },
      target: 'acme/widgets#4',
      texts: ['Bearer abcdefghijklmnopqrstuvwxyz123456'],
    });

    assert.equal(report.approved, false);
    assert.deepEqual(report.findings, ['bearer credential']);
    assert.ok(report.reasons.some((reason) => reason.includes('approved exactly')));
    assert.ok(report.reasons.some((reason) => reason.includes('digest')));
  });
});
