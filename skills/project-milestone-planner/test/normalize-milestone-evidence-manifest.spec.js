import assert from 'node:assert/strict';

import normalizeMilestoneEvidenceManifest from '../utils/normalize-milestone-evidence-manifest.js';

describe('skills/project-milestone-planner/utils/normalize-milestone-evidence-manifest', () => {
  it('should normalize one explicit bounded evidence manifest', () => {
    assert.deepEqual(
      normalizeMilestoneEvidenceManifest({
        pullRequestNumbers: [3, 3],
        taskNumbers: [9, 2, 9],
      }),
      {
        pullRequestNumbers: [3],
        taskNumbers: [2, 9],
      },
    );
  });

  it('should reject unbounded or unsupported selectors', () => {
    assert.throws(
      () => normalizeMilestoneEvidenceManifest({ taskNumbers: ['all'] }),
      /positive numbers/,
    );
    assert.throws(
      () => normalizeMilestoneEvidenceManifest({ query: 'is:open' }),
      /unsupported fields/,
    );
  });
});
