import assert from 'node:assert/strict';

import extractCheckIdentifiers from '../utils/extract-check-identifiers.js';

describe('skills/github-checks-triage/utils/extract-check-identifiers', () => {
  it('should extract run and job ids from GitHub Actions URLs', () => {
    assert.deepEqual(
      extractCheckIdentifiers('https://github.com/acme/repo/actions/runs/123/job/456'),
      { jobId: '456', runId: '123' },
    );
    assert.deepEqual(extractCheckIdentifiers('https://example.com/check'), {
      jobId: null,
      runId: null,
    });
  });
});
