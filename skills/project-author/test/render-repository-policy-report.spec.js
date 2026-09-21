import assert from 'node:assert/strict';

import renderRepositoryPolicyReport from '../utils/render-repository-policy-report.js';
import { TARGET } from './fake-github.js';

describe('skills/project-author/utils/render-repository-policy-report', () => {
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

  it('should expose retained topics and private-topic visibility in metadata previews', () => {
    const metadata = { description: 'Tanaab-based tooling', topics: ['retained-topic'] };
    const text = renderRepositoryPolicyReport({
      changes: [],
      current: metadata,
      desired: metadata,
      operation: 'inspect-metadata',
      status: 'aligned',
      target: TARGET,
      warnings: ['Topic names are public.'],
    });
    assert.match(text, /warning: Topic names are public/);
    assert.ok(text.includes(`current: ${JSON.stringify(metadata)}`));
    assert.ok(text.includes(`desired: ${JSON.stringify(metadata)}`));
  });
});
