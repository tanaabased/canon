import assert from 'node:assert/strict';

import { RepositoryPolicyClient } from '../lib/repository-policy-client.js';
import { CREATION_PLAN, METADATA, TARGET, createRemote, mutatingCommands } from './fake-github.js';

function setup(overrides = {}) {
  const remote = createRemote({ topics: ['existing-topic'], ...overrides });
  const client = new RepositoryPolicyClient({ runner: remote.runner, sleep: () => {} });
  const plan = {
    target: TARGET,
    current: { description: remote.repository.description, topics: [...remote.topics] },
    desired: { ...METADATA, topics: [...METADATA.topics, ...remote.topics].sort() },
  };
  return { client, plan, remote };
}

describe('skills/project-author/lib/repository-policy-client metadata', () => {
  it('should preview the complete topic set and private-topic warning without writes', () => {
    const { client, plan, remote } = setup();
    const report = client.inspectMetadata(TARGET, plan);
    assert.equal(report.status, 'drifted');
    assert.deepEqual(report.current, plan.current);
    assert.deepEqual(report.desired, plan.desired);
    assert.match(report.warnings[0], /topic names are public/);
    assert.deepEqual(
      report.changes.map(({ path }) => path),
      ['description', 'topics'],
    );
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should replace topics with the reviewed full set while leaving settings alone', () => {
    const { client, plan, remote } = setup();
    const repository = { ...remote.repository };
    const report = client.applyMetadata(TARGET, plan);
    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.current, plan.desired);
    assert.deepEqual(remote.repository, { ...repository, description: METADATA.description });
    assert.deepEqual(
      mutatingCommands(remote).map(({ body }) => body),
      [{ description: METADATA.description }, { names: plan.desired.topics }],
    );
    assert.ok(remote.topics.includes('existing-topic'));
    remote.commands.length = 0;
    client.applyMetadata(TARGET, { ...plan, current: report.current });
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should show a topic removal in the exact preview before applying that set', () => {
    const { client, plan, remote } = setup();
    plan.desired.topics = METADATA.topics;
    const preview = client.inspectMetadata(TARGET, plan);
    assert.deepEqual(
      preview.changes.find(({ path }) => path === 'topics'),
      {
        path: 'topics',
        current: ['existing-topic'],
        desired: METADATA.topics,
      },
    );
    client.applyMetadata(TARGET, plan);
    assert.deepEqual(remote.topics, METADATA.topics);
  });

  it('should reject stale snapshots and mismatched targets before mutation', () => {
    const { client, plan, remote } = setup();
    remote.topics.push('added-since-review');
    assert.throws(() => client.applyMetadata(TARGET, plan), /changed since the preview/);
    assert.throws(
      () => client.applyMetadata(TARGET, { ...plan, target: 'other/repo' }),
      /target does not match/,
    );
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should reject invalid plans before any GitHub operation', () => {
    const { client, plan, remote } = setup();
    for (const desired of [
      { ...METADATA, description: 'Generic description' },
      { ...METADATA, topics: ['Not Valid'] },
      { ...METADATA, topics: ['duplicate', 'duplicate'] },
      { ...METADATA, topics: ['x'.repeat(51)] },
      { ...METADATA, topics: Array.from({ length: 21 }, (_, i) => `topic-${i}`) },
      { ...METADATA, homepage: 'https://example.com' },
    ]) {
      assert.throws(() => client.applyMetadata(TARGET, { ...plan, desired }));
      assert.throws(() => client.create(TARGET, { ...CREATION_PLAN, desired }));
    }
    assert.deepEqual(remote.commands, []);
  });

  it('should detect a successful response that silently drops the topic update', () => {
    const { client, plan } = setup({ ignoreTopics: true });
    assert.throws(
      () => client.applyMetadata(TARGET, plan),
      (error) => {
        assert.equal(error.step, 'verify-metadata');
        assert.deepEqual(error.report.applied, ['update-description', 'replace-topics']);
        assert.deepEqual(error.report.current.topics, ['existing-topic']);
        return true;
      },
    );
  });

  it('should report completed steps when the second mutation fails', () => {
    const { client, plan, remote } = setup({ failTopics: true });
    assert.throws(
      () => client.applyMetadata(TARGET, plan),
      (error) => {
        assert.equal(error.step, 'replace-topics');
        assert.deepEqual(error.report.applied, ['update-description']);
        return true;
      },
    );
    assert.equal(remote.repository.description, METADATA.description);
    assert.deepEqual(remote.topics, ['existing-topic']);
  });

  it('should leave description and topics unmanaged during ordinary settings sync', () => {
    const { client, remote } = setup();
    remote.repository.has_wiki = !remote.repository.has_wiki;
    client.apply(TARGET);
    assert.equal(remote.repository.description, 'Unmanaged description');
    assert.deepEqual(remote.topics, ['existing-topic']);
    assert.ok(
      mutatingCommands(remote).every(({ body }) => !('description' in body) && !('names' in body)),
    );
  });

  it('should keep a failed creation recoverable without deleting the repository', () => {
    const { client, remote } = setup({ exists: false, failTopics: true });
    assert.throws(
      () => client.create(TARGET, CREATION_PLAN),
      /was created, but configuration is incomplete/,
    );
    assert.equal(remote.exists, true);
    assert.equal(remote.repository.description, METADATA.description);
    assert.ok(mutatingCommands(remote).every(({ args }) => !args.includes('DELETE')));
  });
});
