import assert from 'node:assert/strict';

import renderRepositoryPolicyReport from '../utils/render-repository-policy-report.js';
import { TARGET } from './fake-github.js';

describe('skills/github-repository-author/utils/render-repository-policy-report', () => {
  it('should render current-to-desired changes', () => {
    const report = {
      branch_action: null,
      changes: [{ current: false, desired: true, path: 'repository.has_projects' }],
      status: 'drifted',
      target: TARGET,
    };

    assert.equal(
      renderRepositoryPolicyReport(report),
      `target: ${TARGET}\nstatus: drifted\nchanges:\n- repository.has_projects: false -> true\n`,
    );
  });

  it('should render aligned reports without changes', () => {
    assert.equal(
      renderRepositoryPolicyReport({ changes: [], status: 'aligned', target: TARGET }),
      `target: ${TARGET}\nstatus: aligned\nchanges:\n- none\n`,
    );
  });
});
