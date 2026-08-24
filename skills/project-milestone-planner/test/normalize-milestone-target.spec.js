import assert from 'node:assert/strict';

import normalizeMilestoneTarget from '../utils/normalize-milestone-target.js';

describe('skills/project-milestone-planner/utils/normalize-milestone-target', () => {
  it('should normalize owner repository milestone shorthand', () => {
    assert.deepEqual(normalizeMilestoneTarget('tanaabased/canon#12'), {
      number: '12',
      owner: 'tanaabased',
      repo: 'canon',
      slug: 'tanaabased/canon',
      url: 'https://github.com/tanaabased/canon/milestone/12',
    });
  });

  it('should normalize GitHub milestone URLs', () => {
    assert.equal(
      normalizeMilestoneTarget('https://github.com/tanaabased/canon/milestone/12?closed=1').number,
      '12',
    );
  });

  it('should reject issue URLs and ambiguous repository targets', () => {
    assert.throws(
      () => normalizeMilestoneTarget('https://github.com/tanaabased/canon/issues/12'),
      /milestone URL/,
    );
    assert.throws(() => normalizeMilestoneTarget('tanaabased/canon'), /milestone URL/);
  });
});
