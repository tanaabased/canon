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
  it('should separate membership, candidates, pull requests, and delivered work', () => {
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
      items: [
        {
          body: 'Implement inspection.',
          labels: [{ name: 'task' }, { name: 'planning' }],
          milestone: { html_url: target.url, number: 3, title: 'Milestone planning' },
          number: 10,
          state: 'open',
          title: 'Inspect milestone',
        },
        {
          body: 'Historical related work.',
          labels: [],
          milestone: null,
          number: 11,
          state: 'closed',
          title: 'Document task model',
        },
        {
          body: 'Delivery evidence.',
          labels: [],
          milestone: { number: 3, title: 'Milestone planning' },
          number: 12,
          pull_request: { merged_at: '2026-08-23T12:00:00Z' },
          state: 'closed',
          title: 'Deliver planner',
        },
      ],
    });

    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.memberTasks.length, 1);
    assert.equal(report.candidateTasks.length, 1);
    assert.equal(report.memberPullRequests.length, 1);
    assert.deepEqual(
      report.deliveredWork.map((item) => item.number),
      ['11', '12'],
    );
    assert.deepEqual(report.memberTasks[0].labels, ['planning', 'task']);
    assert.equal(report.repository.defaultBranch, 'main');
  });

  it('should preserve a read-only empty evidence shape', () => {
    const report = buildMilestonePlanningEvidence({ target });

    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.repository, null);
    assert.equal(report.milestone, null);
    assert.deepEqual(report.existingTasks, []);
    assert.deepEqual(report.pullRequests, []);
  });
});
