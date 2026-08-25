import assert from 'node:assert/strict';

import { inspectMilestonePlanningEvidence } from '../lib/milestone-planning-evidence.js';
import renderMilestonePlanningEvidence from '../utils/render-milestone-planning-evidence.js';

function createClient(overrides = {}) {
  return {
    ensureAvailable: () => ({ authenticated: true, ok: true }),
    fetchIssue: (_target, number) => ({ number, state: 'open', title: `Task ${number}` }),
    fetchIssueComments: () => [],
    fetchIssueFieldValues: () => [],
    fetchMilestone: () => ({ number: 3, state: 'open', title: 'Planner' }),
    fetchMilestoneItems: () => [],
    fetchPullRequest: (_target, number) => ({ number, state: 'open', title: `PR ${number}` }),
    fetchRepository: () => ({ nameWithOwner: 'tanaabased/canon' }),
    ...overrides,
  };
}

describe('skills/project-milestone-planner/lib/milestone-planning-evidence', () => {
  it('should return ready evidence without mutation', () => {
    const report = inspectMilestonePlanningEvidence('tanaabased/canon#3', createClient());

    assert.equal(report.status, 'ready');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.errors, []);
    assert.match(renderMilestonePlanningEvidence(report), /mutates GitHub: false/);
  });

  it('should preserve partial evidence and identify the failed surface', () => {
    const report = inspectMilestonePlanningEvidence(
      'tanaabased/canon#3',
      createClient({
        fetchMilestone: () => {
          throw new Error('forbidden');
        },
      }),
    );

    assert.equal(report.status, 'partial');
    assert.equal(report.repository.nameWithOwner, 'tanaabased/canon');
    assert.deepEqual(report.errors, ['milestone: forbidden']);
  });

  it('should inspect only the explicit manifest plus current membership', () => {
    const issueReads = [];
    const report = inspectMilestonePlanningEvidence(
      'tanaabased/canon#3',
      createClient({
        fetchIssue: (_target, number) => {
          issueReads.push(number);
          return { body: 'Bounded task', number, state: 'open', title: `Task ${number}` };
        },
        fetchMilestoneItems: () => [
          { body: 'Member', number: 4, state: 'open', title: 'Member task' },
        ],
      }),
      { taskNumbers: [9] },
    );

    assert.equal(report.status, 'ready');
    assert.deepEqual(issueReads, [9]);
    assert.deepEqual(
      report.existingTasks.map(({ number }) => number),
      ['4', '9'],
    );
    assert.deepEqual(
      report.memberTasks.map(({ number }) => number),
      ['4'],
    );
  });

  it('should stop before reads when gh is unavailable', () => {
    let readAttempted = false;
    const report = inspectMilestonePlanningEvidence(
      'tanaabased/canon#3',
      createClient({
        ensureAvailable: () => ({ message: 'gh missing', ok: false }),
        fetchRepository: () => {
          readAttempted = true;
        },
      }),
    );

    assert.equal(report.status, 'unresolved');
    assert.equal(readAttempted, false);
    assert.deepEqual(report.errors, ['gh missing']);
  });

  it('should continue public reads while surfacing an authentication warning', () => {
    const report = inspectMilestonePlanningEvidence(
      'tanaabased/canon#3',
      createClient({
        ensureAvailable: () => ({
          authenticated: false,
          message: 'public reads only',
          ok: true,
        }),
      }),
    );

    assert.equal(report.status, 'ready');
    assert.deepEqual(report.warnings, ['public reads only']);
  });
});
