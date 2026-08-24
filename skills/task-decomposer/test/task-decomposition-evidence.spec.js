import assert from 'node:assert/strict';

import { renderFallbackMetadata } from '../../task-author/utils/render-fallback-metadata.js';
import { inspectTaskDecompositionEvidence } from '../lib/task-decomposition-inspector.js';
import { fakeGitHubTaskDecomposerClient } from './fake-github-task-decomposer-client.js';
import { parentFields, parentIssue, sharedConstraint } from './task-decomposition-fixtures.js';

describe('Task Decomposer inspection evidence', () => {
  it('should normalize parent metadata, linked work, relationships, and constraints read-only', () => {
    const child = parentIssue({
      id: 10_002,
      number: 2,
      title: 'Existing child',
      html_url: 'https://github.com/acme/widgets/issues/2',
    });
    const pullRequest = {
      id: 20_001,
      number: 8,
      title: 'Deliver evidence',
      body: 'Delivery body',
      state: 'closed',
      html_url: 'https://github.com/acme/widgets/pull/8',
      pull_request: { url: 'https://api.github.com/repos/acme/widgets/pulls/8' },
    };
    const client = fakeGitHubTaskDecomposerClient({
      issues: [parentIssue(), child, pullRequest],
      fields: { 1: parentFields(21) },
      comments: { 1: [{ body: 'Preserve this source evidence.', user: { login: 'pirog' } }] },
      parents: { 2: 1 },
      blockedBy: { 1: [2] },
      timeline: [{ event: 'cross-referenced', source: { issue: pullRequest } }],
    });

    const report = inspectTaskDecompositionEvidence('acme/widgets#1', client);

    assert.equal(report.status, 'ready');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.metadata.workSize, {
      value: 21,
      source: 'native',
      conflict: null,
    });
    assert.equal(report.acceptanceCriteria.length, 2);
    assert.equal(report.constraints.length, 1);
    assert.deepEqual(
      report.subIssues.map(({ number }) => number),
      [2],
    );
    assert.deepEqual(
      report.dependencies.blockedBy.map(({ number }) => number),
      [2],
    );
    assert.equal(report.linkedWork[0].issue.number, 8);
    assert.deepEqual(
      report.repositoryTasks.map(({ number }) => number),
      [1, 2],
    );
    assert.equal(Object.hasOwn(report.repositoryTasks[0], 'body'), false);
    assert.equal(Object.hasOwn(report.repositoryTasks[0], 'labels'), false);
    assert.equal(
      client.calls.some(({ operation } = {}) =>
        ['createIssue', 'updateIssue', 'addComment', 'addSubIssue', 'addBlockedBy'].includes(
          operation,
        ),
      ),
      false,
    );
  });

  it('should keep partial relationship failures visible rather than treating them as absence', () => {
    const client = fakeGitHubTaskDecomposerClient({ issues: [parentIssue()] });
    const original = client.listBlockedBy;
    client.listBlockedBy = () => ({ ok: false, error: 'GET dependencies: HTTP 403' });

    const report = inspectTaskDecompositionEvidence('acme/widgets#1', client);

    assert.equal(report.status, 'partial');
    assert.ok(report.errors.some((error) => error.includes('HTTP 403')));
    client.listBlockedBy = original;
  });

  it('should keep fallback metadata out of constraints and treat a native value as authoritative', () => {
    const parent = parentIssue();
    parent.body = `${parent.body.trimEnd()}\n\n${renderFallbackMetadata({ type: 'feature', 'work-size': 13 })}`;
    const client = fakeGitHubTaskDecomposerClient({
      issues: [parent],
      fields: { 1: parentFields(21) },
    });

    const report = inspectTaskDecompositionEvidence('acme/widgets#1', client);

    assert.deepEqual(report.constraints, [sharedConstraint]);
    assert.deepEqual(report.metadata.workSize, {
      value: 21,
      source: 'native',
      conflict: { native: 21, fallback: 13 },
    });
  });
});
