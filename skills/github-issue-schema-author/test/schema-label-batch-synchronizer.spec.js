import assert from 'node:assert/strict';

import schema from '../../../references/task-management-schema.json' with { type: 'json' };
import { synchronizeGitHubLabelBatch } from '../lib/schema-label-batch-synchronizer.js';
import { fakeLabelClient } from './fake-issue-field-client.js';

const selection = { organization: 'acme', repositories: ['person/tools'] };
const repo = (name, extra = {}) => ({
  full_name: name,
  archived: false,
  disabled: false,
  ...extra,
});
const stock = {
  id: 'bug',
  name: 'bug',
  description: 'Keep stock',
  color: '123456',
  issueCount: 3,
  pullRequestCount: 2,
};
const custom = { ...stock, id: 'custom', name: 'custom', description: 'Keep custom' };
const drifted = { ...stock, name: 'documentation', id: 'docs' };

function fakeBatch({ inventory = [repo('acme/widgets')], failAt = null } = {}) {
  const clients = {
    'acme/widgets': fakeLabelClient({ labels: [stock, custom, drifted] }),
    'person/tools': fakeLabelClient({ labels: [stock], failAt }),
    'zzz/later': fakeLabelClient(),
    'acme/new': fakeLabelClient(),
  };
  return {
    clients,
    inventory,
    ensureAvailable: () => [],
    listOrganizationRepositories() {
      return this.inventory;
    },
    inspect(target) {
      return clients[target.slug].inspect(target);
    },
    createLabel(target, body) {
      return clients[target.slug].createLabel(target, body);
    },
    updateLabel(target, name, body) {
      return clients[target.slug].updateLabel(target, name, body);
    },
  };
}

function writes(client) {
  return Object.values(client.clients)
    .flatMap((c) => c.calls)
    .filter((c) => typeof c === 'object');
}

describe('skills/github-issue-schema-author/lib/schema-label-batch-synchronizer', () => {
  it('should inspect drift without writes or mutation plans, even with an approval value', () => {
    const client = fakeBatch();
    const report = synchronizeGitHubLabelBatch(
      { ...selection, mode: 'inspect' },
      {
        client,
        authorization: { approvedDigest: 'irrelevant' },
      },
    );
    assert.equal(report.status, 'drifted');
    assert.equal(report.inspections.length, 2);
    assert.deepEqual(report.operations, []);
    assert.equal(report.plannedMutation, undefined);
    assert.deepEqual(writes(client), []);
  });

  it('should deduplicate targets and report excluded archived and disabled repositories', () => {
    const client = fakeBatch({
      inventory: [
        repo('acme/widgets'),
        repo('acme/old', { archived: true }),
        repo('acme/off', { disabled: true }),
      ],
    });
    const report = synchronizeGitHubLabelBatch(
      { organization: 'ACME', repositories: ['ACME/widgets', 'person/tools', 'PERSON/tools'] },
      { client },
    );
    assert.deepEqual(report.targets, ['acme/widgets', 'person/tools']);
    assert.deepEqual(report.excluded.map((r) => r.reason).sort(), ['archived', 'disabled']);
    assert.equal(report.summary.creates, 15);
    assert.equal(report.summary.updates, 1);
    assert.deepEqual(writes(client), []);
  });

  it('should apply exact plans, preserve stock/custom labels and associations, and converge', () => {
    const client = fakeBatch();
    const preview = synchronizeGitHubLabelBatch(selection, { client });
    const report = synchronizeGitHubLabelBatch(
      { ...selection, mode: 'apply' },
      { client, authorization: { approvedDigest: preview.authorization.digest } },
    );
    assert.equal(report.status, 'updated');
    assert.deepEqual(report.remaining, []);
    assert.ok(report.results.every((r) => r.verification.status === 'verified'));
    const labels = client.clients['acme/widgets'].state.labels;
    assert.deepEqual(
      labels.find((l) => l.name === 'bug'),
      stock,
    );
    assert.deepEqual(
      labels.find((l) => l.name === 'custom'),
      custom,
    );
    assert.equal(labels.find((l) => l.name === 'documentation').issueCount, 3);
    assert.equal(labels.find((l) => l.name === 'documentation').pullRequestCount, 2);
    const aligned = synchronizeGitHubLabelBatch(selection, { client });
    assert.equal(aligned.status, 'aligned');
    assert.equal(aligned.summary.creates + aligned.summary.updates, 0);
  });

  it('should reject changed inventory or policy before any repository writes', () => {
    const client = fakeBatch();
    const preview = synchronizeGitHubLabelBatch(selection, { client });
    const authorization = { approvedDigest: preview.authorization.digest };
    client.inventory.push(repo('acme/new'));
    assert.equal(
      synchronizeGitHubLabelBatch({ ...selection, mode: 'apply' }, { client, authorization })
        .status,
      'stale',
    );
    client.inventory.pop();
    const policy = structuredClone(schema);
    policy.labels[0].color = 'abcdef';
    assert.equal(
      synchronizeGitHubLabelBatch(
        { ...selection, mode: 'apply' },
        { client, authorization, policy },
      ).status,
      'stale',
    );
    assert.deepEqual(writes(client), []);
  });

  it('should block the entire batch on an unresolved preflight', () => {
    const client = fakeBatch();
    client.clients['person/tools'].inspect = () => {
      throw new Error('HTTP 403');
    };
    const report = synchronizeGitHubLabelBatch(
      { ...selection, mode: 'apply' },
      { client, authorization: { approvedDigest: 'old' } },
    );
    assert.equal(report.status, 'blocked');
    assert.match(report.blockers[0], /person\/tools.*HTTP 403/);
    assert.deepEqual(writes(client), []);
  });

  it('should stop on partial failure and retain completed and remaining repositories', () => {
    const client = fakeBatch({ failAt: 2 });
    const input = { ...selection, repositories: ['person/tools', 'zzz/later'] };
    const preview = synchronizeGitHubLabelBatch(input, { client });
    const report = synchronizeGitHubLabelBatch(
      { ...input, mode: 'apply' },
      { client, authorization: { approvedDigest: preview.authorization.digest } },
    );
    assert.equal(report.status, 'partial');
    assert.deepEqual(
      report.results.map((r) => r.status),
      ['updated', 'partial'],
    );
    assert.deepEqual(report.remaining, ['person/tools', 'zzz/later']);
    assert.equal(client.clients['zzz/later'].state.labels.length, 0);
    const fresh = synchronizeGitHubLabelBatch(input, { client });
    assert.notEqual(fresh.authorization.digest, preview.authorization.digest);
    assert.equal(fresh.plannedMutation.repositories[0].operations.length, 0);
  });

  it('should recheck a later repository at its write boundary and stop on drift', () => {
    const client = fakeBatch();
    const preview = synchronizeGitHubLabelBatch(selection, { client });
    const create = client.createLabel.bind(client);
    client.createLabel = (target, body) => {
      client.clients['person/tools'].state.labels[0].description = 'Concurrent edit';
      return create(target, body);
    };
    const report = synchronizeGitHubLabelBatch(
      { ...selection, mode: 'apply' },
      { client, authorization: { approvedDigest: preview.authorization.digest } },
    );
    assert.equal(report.status, 'partial');
    assert.equal(report.results[1].status, 'approval_required');
    assert.equal(client.clients['person/tools'].state.labels.length, 1);
  });

  it('should retain uncertain outcomes without retrying or advancing to another repository', () => {
    const client = fakeBatch();
    const preview = synchronizeGitHubLabelBatch(selection, { client });
    let attempts = 0;
    client.createLabel = () => {
      attempts++;
      throw new Error('Connection interrupted');
    };
    const report = synchronizeGitHubLabelBatch(
      { ...selection, mode: 'apply' },
      { client, authorization: { approvedDigest: preview.authorization.digest } },
    );
    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, null);
    assert.equal(report.results[0].status, 'unresolved');
    assert.equal(attempts, 1);
    assert.deepEqual(report.remaining, ['acme/widgets', 'person/tools']);
  });

  it('should reject malformed selection and incomplete or foreign organization inventory', () => {
    const client = fakeBatch();
    assert.throws(() => synchronizeGitHubLabelBatch({}, { client }), /explicit/);
    assert.throws(
      () => synchronizeGitHubLabelBatch({ organization: '../acme' }, { client }),
      /organization login/,
    );
    for (const inventory of [[repo('other/widgets')], [{ full_name: 'acme/widgets' }]]) {
      client.inventory = inventory;
      assert.throws(
        () => synchronizeGitHubLabelBatch(selection, { client }),
        /unexpected owner or incomplete/,
      );
    }
    assert.deepEqual(writes(client), []);
  });
});
