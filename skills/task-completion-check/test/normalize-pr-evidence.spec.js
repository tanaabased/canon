import assert from 'node:assert/strict';

import normalizePrEvidence from '../utils/normalize-pr-evidence.js';

const base = {
  baseRefName: 'main',
  body: '## Outcome\n\nThe task is complete.',
  isDraft: false,
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN',
  number: 7,
  reviewDecision: 'APPROVED',
  state: 'OPEN',
  title: 'Implement task',
  url: 'https://github.com/acme/tools/pull/7',
};

describe('skills/task-completion-check/utils/normalize-pr-evidence', () => {
  it('should classify merged default-branch delivery as landed', () => {
    const result = normalizePrEvidence(
      { ...base, mergedAt: '2026-07-27T00:00:00Z', state: 'MERGED' },
      { checks: [], defaultBranch: 'main', slug: 'acme/tools' },
    );

    assert.equal(result.outcome, 'landed');
    assert.equal(result.targetIsDefault, true);
    assert.match(result.body, /The task is complete/);
  });

  it('should classify active review and check work as pending', () => {
    const result = normalizePrEvidence(
      { ...base, isDraft: true, reviewDecision: 'REVIEW_REQUIRED' },
      {
        checks: [{ bucket: 'pending', name: 'test' }],
        defaultBranch: 'main',
        slug: 'acme/tools',
      },
    );

    assert.equal(result.outcome, 'pending');
    assert.match(result.waiting.join(' '), /draft/);
    assert.equal(result.checkCounts.pending, 1);
  });

  it('should classify failed checks, conflicts, and non-default targets as blocked', () => {
    const result = normalizePrEvidence(
      {
        ...base,
        baseRefName: 'develop',
        mergeable: 'CONFLICTING',
        reviewDecision: 'CHANGES_REQUESTED',
      },
      {
        checks: [{ conclusion: 'failure', name: 'test' }],
        defaultBranch: 'main',
        slug: 'acme/tools',
      },
    );

    assert.equal(result.outcome, 'blocked');
    assert.equal(result.blockers.length, 4);
  });

  it('should distinguish abandoned pull requests from blocked active delivery', () => {
    const result = normalizePrEvidence(
      { ...base, state: 'CLOSED' },
      { checks: [], defaultBranch: 'main', slug: 'acme/tools' },
    );

    assert.equal(result.outcome, 'discarded');
  });
});
