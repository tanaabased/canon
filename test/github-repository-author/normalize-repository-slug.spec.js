import assert from 'node:assert/strict';

import normalizeRepositorySlug from '../../skills/github-repository-author/scripts/utils/normalize-repository-slug.js';

describe('skills/github-repository-author/scripts/utils/normalize-repository-slug', () => {
  it('should trim an explicit owner and repository slug', () => {
    assert.equal(normalizeRepositorySlug(' tanaabased/canon '), 'tanaabased/canon');
  });

  it('should reject incomplete slugs and GitHub URLs', () => {
    assert.throws(() => normalizeRepositorySlug('canon'), /OWNER\/REPO/);
    assert.throws(
      () => normalizeRepositorySlug('https://github.com/tanaabased/canon'),
      /OWNER\/REPO/,
    );
  });
});
