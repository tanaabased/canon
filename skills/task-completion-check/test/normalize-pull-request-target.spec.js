import assert from 'node:assert/strict';

import normalizePullRequestTarget from '../utils/normalize-pull-request-target.js';

describe('skills/task-completion-check/utils/normalize-pull-request-target', () => {
  it('should normalize local numbers and explicit pull request targets', () => {
    assert.deepEqual(normalizePullRequestTarget('12', 'tanaabased/canon'), {
      number: '12',
      slug: 'tanaabased/canon',
      url: 'https://github.com/tanaabased/canon/pull/12',
    });
    assert.deepEqual(
      normalizePullRequestTarget('https://github.com/acme/tools/pull/7', 'tanaabased/canon'),
      {
        number: '7',
        slug: 'acme/tools',
        url: 'https://github.com/acme/tools/pull/7',
      },
    );
    assert.deepEqual(normalizePullRequestTarget('acme/tools#7', 'tanaabased/canon'), {
      number: '7',
      slug: 'acme/tools',
      url: 'https://github.com/acme/tools/pull/7',
    });
  });

  it('should reject unsupported evidence values', () => {
    assert.throws(() => normalizePullRequestTarget('pull-seven', 'acme/tools'), /must be/);
  });
});
