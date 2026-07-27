import assert from 'node:assert/strict';

import { inspectTaskCompletion } from '../lib/task-completion-inspector.js';

function createClient(overrides = {}) {
  return {
    ensureAvailable: () => ({ ok: true }),
    fetchCheckLog: () => ({ error: '', status: 'ok', text: 'setup\nError: broken\ntail' }),
    fetchChecks: () => [],
    fetchDefaultBranch: () => 'main',
    fetchLinkedPullRequests: () => [],
    fetchPullRequest: (target) => ({
      baseRefName: 'main',
      isDraft: false,
      mergeable: 'MERGEABLE',
      mergeStateStatus: 'CLEAN',
      number: target.number,
      reviewDecision: 'APPROVED',
      state: 'MERGED',
      title: 'Implement Task',
      url: target.url,
    }),
    fetchRunMetadata: () => ({ conclusion: 'failure', workflowName: 'CI' }),
    fetchTask: () => ({
      body: '- [x] acceptance met',
      comments: [],
      state: 'OPEN',
      title: 'Task',
    }),
    ...overrides,
  };
}

const options = {
  context: 1,
  maxLines: 20,
  prs: [],
  task: 'tanaabased/canon#7',
};

describe('skills/task-completion-check/lib/task-completion-inspector', () => {
  it('should classify a closed issue as complete without requiring PR evidence', () => {
    const client = createClient({
      fetchLinkedPullRequests: () => {
        throw new Error('should not query links');
      },
      fetchTask: () => ({ body: '', comments: [], state: 'CLOSED', title: 'Done' }),
    });

    assert.equal(inspectTaskCompletion(options, client).status, 'complete');
  });

  it('should classify a non-code task with complete criteria as ready', () => {
    const report = inspectTaskCompletion(options, createClient());

    assert.equal(report.status, 'ready');
    assert.equal(report.pullRequests.length, 0);
  });

  it('should classify absent and incomplete acceptance criteria conservatively', () => {
    const missing = createClient({
      fetchTask: () => ({ body: 'Do the work.', comments: [], state: 'OPEN', title: 'Task' }),
    });
    const incomplete = createClient({
      fetchTask: () => ({ body: '- [ ] finish work', comments: [], state: 'OPEN', title: 'Task' }),
    });

    assert.equal(inspectTaskCompletion(options, missing).status, 'uncertain');
    assert.equal(inspectTaskCompletion(options, incomplete).status, 'blocked');
  });

  it('should inspect failing checks and preserve the failure snippet', () => {
    const client = createClient({
      fetchChecks: () => [
        {
          conclusion: 'failure',
          detailsUrl: 'https://github.com/tanaabased/canon/actions/runs/123/job/456',
          name: 'unit tests',
        },
      ],
      fetchLinkedPullRequests: () => [
        {
          number: '8',
          slug: 'tanaabased/canon',
          url: 'https://github.com/tanaabased/canon/pull/8',
        },
      ],
      fetchPullRequest: (target) => ({
        baseRefName: 'main',
        isDraft: false,
        mergeable: 'MERGEABLE',
        mergeStateStatus: 'BLOCKED',
        number: target.number,
        reviewDecision: 'APPROVED',
        state: 'OPEN',
        title: 'Implement Task',
        url: target.url,
      }),
    });

    const report = inspectTaskCompletion(options, client);
    assert.equal(report.status, 'blocked');
    assert.match(report.pullRequests[0].failureDetails[0].logSnippet, /Error: broken/);
  });

  it('should merge explicit PR evidence without duplicates', () => {
    let fetchCount = 0;
    const client = createClient({
      fetchLinkedPullRequests: () => [
        {
          number: '8',
          slug: 'tanaabased/canon',
          url: 'https://github.com/tanaabased/canon/pull/8',
        },
      ],
      fetchPullRequest: (target) => {
        fetchCount += 1;
        return {
          baseRefName: 'main',
          mergedAt: '2026-07-27T00:00:00Z',
          number: target.number,
          state: 'MERGED',
          title: 'Implement Task',
          url: target.url,
        };
      },
    });

    const report = inspectTaskCompletion({ ...options, prs: ['8'] }, client);
    assert.equal(fetchCount, 1);
    assert.equal(report.status, 'ready');
  });

  it('should return uncertain when task or related evidence cannot be queried', () => {
    const taskFailure = createClient({
      fetchTask: () => {
        throw new Error('task unavailable');
      },
    });
    assert.equal(inspectTaskCompletion(options, taskFailure).status, 'uncertain');

    const linkFailure = createClient({
      fetchLinkedPullRequests: () => {
        throw new Error('Links unavailable');
      },
    });
    assert.equal(inspectTaskCompletion(options, linkFailure).status, 'uncertain');
  });
});
