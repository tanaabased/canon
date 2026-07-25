import assert from 'node:assert/strict';

import normalizeBranchProtection from '../utils/normalize-branch-protection.js';
import { canonicalPolicy, protectionResponse } from './fake-github.js';

describe('skills/github-repository-author/utils/normalize-branch-protection', () => {
  it('should remove response wrappers and normalize actor names', () => {
    const normalized = normalizeBranchProtection(protectionResponse());

    assert.deepEqual(
      normalized.required_pull_request_reviews.bypass_pull_request_allowances.users,
      ['pirog', 'tanaabot'],
    );
    assert.deepEqual(normalized.required_status_checks.checks, []);
    assert.equal(normalized.required_linear_history, true);
  });

  it('should normalize the desired payload and GitHub response identically', () => {
    assert.deepEqual(
      normalizeBranchProtection(canonicalPolicy.branches.main.protection),
      normalizeBranchProtection(protectionResponse()),
    );
  });

  it('should preserve a missing protection surface as null', () => {
    assert.equal(normalizeBranchProtection(null), null);
  });
});
