import assert from 'node:assert/strict';

import normalizeMilestoneTarget from '../utils/normalize-milestone-target.js';

describe('project-milestone-author/utils/normalize-milestone-target', () => {
  it('should normalize repository, numbered, URL, and exact-title selectors', () => {
    assert.deepEqual(normalizeMilestoneTarget('acme/widgets'), {
      number: null,
      owner: 'acme',
      repo: 'widgets',
      slug: 'acme/widgets',
      title: null,
    });
    assert.equal(normalizeMilestoneTarget('acme/widgets#4').number, 4);
    assert.equal(normalizeMilestoneTarget('https://github.com/acme/widgets/milestone/5').number, 5);
    assert.equal(
      normalizeMilestoneTarget({ repository: 'acme/widgets', title: 'Release 1' }).title,
      'Release 1',
    );
  });

  it('should reject missing repositories and invalid numbers', () => {
    assert.throws(() => normalizeMilestoneTarget('widgets'), /OWNER\/REPO/);
    assert.throws(
      () => normalizeMilestoneTarget({ number: 0, repository: 'acme/widgets' }),
      /positive integer/,
    );
  });
});
