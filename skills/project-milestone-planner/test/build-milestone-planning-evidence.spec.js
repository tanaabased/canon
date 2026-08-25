import assert from 'node:assert/strict';

import buildMilestonePlanningEvidence from '../utils/build-milestone-planning-evidence.js';

const target = {
  number: '3',
  owner: 'tanaabased',
  repo: 'canon',
  slug: 'tanaabased/canon',
  url: 'https://github.com/tanaabased/canon/milestone/3',
};

describe('skills/project-milestone-planner/utils/build-milestone-planning-evidence', () => {
  it('should separate membership, provider state, and merged delivery evidence', () => {
    const report = buildMilestonePlanningEvidence({
      target,
      repository: {
        defaultBranchRef: { name: 'main' },
        description: 'Canon',
        nameWithOwner: 'tanaabased/canon',
        url: 'https://github.com/tanaabased/canon',
      },
      milestone: {
        closed_issues: 1,
        description: 'Ship milestone planning',
        due_on: '2026-09-01T00:00:00Z',
        html_url: target.url,
        number: 3,
        open_issues: 1,
        state: 'open',
        title: 'Milestone planning',
      },
      memberTaskNumbers: [10],
      memberPullRequestNumbers: [12],
      tasks: [
        {
          body: 'Implement inspection.',
          labels: [{ name: 'task' }, { name: 'planning' }],
          milestone: { html_url: target.url, number: 3, title: 'Milestone planning' },
          number: 10,
          state: 'open',
          title: 'Inspect milestone',
        },
        {
          body: `Historical related work.

### Task metadata

\`\`\`yaml
schema: tanaab/task-metadata/v2
mode: fallback
fallback:
  work-size: 5
\`\`\``,
          labels: [],
          milestone: null,
          number: 11,
          state: 'closed',
          title: 'Document task model',
        },
      ],
      taskDetails: new Map([
        [
          '10',
          {
            comments: [{ body: 'Current delivery note.', user: { login: 'pirog' } }],
            fields: [
              {
                data_type: 'number',
                issue_field_name: 'Work size',
                number_value: 8,
              },
            ],
          },
        ],
      ]),
      pullRequests: [
        {
          body: 'Delivery evidence.',
          labels: [],
          milestone: { number: 3, title: 'Milestone planning' },
          number: 12,
          pull_request: { merged_at: '2026-08-23T12:00:00Z' },
          state: 'closed',
          title: 'Deliver planner',
        },
        {
          body: 'Abandoned change.',
          labels: [],
          milestone: null,
          number: 13,
          pull_request: { merged_at: null },
          state: 'closed',
          title: 'Do not deliver planner',
        },
      ],
    });

    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.memberTasks.length, 1);
    assert.equal(report.candidateTasks.length, 1);
    assert.equal(report.memberPullRequests.length, 1);
    assert.deepEqual(
      report.closedTasks.map((item) => item.number),
      ['11'],
    );
    assert.deepEqual(
      report.mergedPullRequests.map((item) => item.number),
      ['12'],
    );
    assert.equal(report.pullRequests.length, 2);
    assert.deepEqual(report.memberTasks[0].labels, ['planning', 'task']);
    assert.equal(report.repository.defaultBranch, 'main');
    assert.deepEqual(report.memberTasks[0].metadata.workSize, { source: 'native', value: 8 });
    assert.equal(report.memberTasks[0].comments[0].author, 'pirog');
    assert.deepEqual(report.candidateTasks[0].metadata.workSize, {
      source: 'fallback',
      value: 5,
    });
    assert.deepEqual(report.evidenceIds, ['issue:10', 'issue:11', 'milestone:3', 'pr:12', 'pr:13']);
  });

  it('should preserve a read-only empty evidence shape', () => {
    const report = buildMilestonePlanningEvidence({ target });

    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.repository, null);
    assert.equal(report.milestone, null);
    assert.deepEqual(report.existingTasks, []);
    assert.deepEqual(report.closedTasks, []);
    assert.deepEqual(report.pullRequests, []);
    assert.deepEqual(report.mergedPullRequests, []);
    assert.deepEqual(report.evidenceIds, []);
  });
});
