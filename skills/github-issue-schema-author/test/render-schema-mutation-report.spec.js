import assert from 'node:assert/strict';

import renderSchemaMutationReport from '../utils/render-schema-mutation-report.js';

describe('skills/github-issue-schema-author/utils/render-schema-mutation-report', () => {
  it('should render an exact approval report with blockers and authorization findings', () => {
    const rendered = renderSchemaMutationReport(
      {
        target: { slug: 'tanaabased/canon' },
        organization: 'tanaabased',
        status: 'approval_required',
        mutatesGitHub: false,
        blockers: ['Field inspection is incomplete.'],
        writes: [],
        authorization: { reasons: ['Approve the exact digest.'] },
        verification: null,
      },
      {
        title: 'Field plan',
        summaryLines: ['creates: Work size'],
        detailLines: ['updates: none'],
        includeAuthorization: true,
      },
    );

    assert.equal(
      rendered,
      `Field plan
target: tanaabased/canon
organization: tanaabased
status: approval_required
mutates GitHub: no
creates: Work size
updates: none
blocker: Field inspection is incomplete.
authorization: Approve the exact digest.
`,
    );
  });

  it('should render writes, errors, and verification only when requested or present', () => {
    const rendered = renderSchemaMutationReport(
      {
        target: { slug: 'tanaabased/canon' },
        organization: null,
        status: 'partial',
        mutatesGitHub: true,
        blockers: [],
        writes: [
          { status: 'updated', operation: 'update Complexity' },
          { status: 'failed', operation: 'update Impact', error: 'HTTP 403' },
        ],
        authorization: { reasons: [] },
        verification: { status: 'failed' },
      },
      { title: 'Field update', includeWrites: true },
    );

    assert.equal(
      rendered,
      `Field update
target: tanaabased/canon
status: partial
mutates GitHub: yes
updated: update Complexity
failed: update Impact
error: HTTP 403
verification: failed
`,
    );
  });
});
