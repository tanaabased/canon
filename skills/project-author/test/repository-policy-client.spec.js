import assert from 'node:assert/strict';

import { RepositoryPolicyClient, RepositoryPolicyError } from '../lib/repository-policy-client.js';
import {
  TARGET,
  canonicalPolicy,
  canonicalRepository,
  createRemote,
  mutatingCommands,
  protectionResponse,
} from './fake-github.js';

function clientFor(remote) {
  return new RepositoryPolicyClient({
    runner: remote.runner,
    sleep: () => {},
    waitAttempts: 2,
  });
}

describe('skills/project-author/lib/repository-policy-client', () => {
  it('should report canon-aligned managed state while preserving unmanaged settings', () => {
    const remote = createRemote();
    const report = clientFor(remote).inspect(TARGET);

    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.changes, []);
    assert.equal(remote.repository.visibility, 'private');
    assert.equal(remote.repository.description, 'Unmanaged description');
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should classify a missing repository without mutating GitHub', () => {
    const remote = createRemote({ exists: false });
    const report = clientFor(remote).inspect(TARGET);

    assert.equal(report.status, 'missing');
    assert.equal(report.desired.creation.visibility, 'public');
    assert.ok(
      report.changes.some((change) => change.path === 'collaborators.tanaabot.direct_role'),
    );
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should replace extra required checks with the exact canonical protection payload', () => {
    const protection = protectionResponse();
    protection.required_status_checks.checks = [{ app_id: null, context: 'ci' }];
    const remote = createRemote({ protection });
    const client = clientFor(remote);
    const before = client.inspect(TARGET);

    assert.deepEqual(
      before.changes.find(
        (change) => change.path === 'branches.main.protection.required_status_checks.checks',
      ),
      {
        current: [{ app_id: null, context: 'ci' }],
        desired: [],
        path: 'branches.main.protection.required_status_checks.checks',
      },
    );

    const after = client.apply(TARGET);
    const protectionPut = remote.commands.find(
      ({ args }) => args[1] === `/repos/${TARGET}/branches/main/protection` && args.includes('PUT'),
    );

    assert.equal(after.status, 'aligned');
    assert.deepEqual(protectionPut.body, canonicalPolicy.branches.main.protection);
  });

  it('should report missing review and status-check requirements as drift', () => {
    const protection = protectionResponse();
    protection.required_pull_request_reviews = null;
    protection.required_status_checks = null;
    const report = clientFor(createRemote({ protection })).inspect(TARGET);

    assert.equal(report.status, 'drifted');
    assert.ok(
      report.changes.some(
        (change) =>
          change.path ===
          'branches.main.protection.required_pull_request_reviews.required_approving_review_count',
      ),
    );
    assert.ok(
      report.changes.some(
        (change) => change.path === 'branches.main.protection.required_status_checks.checks',
      ),
    );
  });

  it('should create with public README initialization and converge through apply', () => {
    const remote = createRemote({ exists: false });
    const report = clientFor(remote).create(TARGET);
    const createCommand = remote.commands.find(({ args }) => args[0] === 'repo');

    assert.deepEqual(createCommand.args, ['repo', 'create', TARGET, '--public', '--add-readme']);
    assert.equal(report.status, 'aligned');
    assert.ok(report.applied.includes('create-repository'));
    assert.ok(report.applied.includes('update-repository-settings'));
    assert.ok(report.applied.includes('grant-tanaabot-write'));
    assert.ok(report.applied.includes('update-main-protection'));
  });

  it('should add a direct bot grant when write access is only inherited', () => {
    const remote = createRemote({ directCollaborators: [] });
    const client = clientFor(remote);
    const before = client.inspect(TARGET);

    assert.deepEqual(
      before.changes.find((change) => change.path === 'collaborators.tanaabot.direct_role'),
      {
        current: 'none',
        desired: 'write',
        path: 'collaborators.tanaabot.direct_role',
      },
    );

    const after = client.apply(TARGET);
    assert.equal(after.status, 'aligned');
    assert.ok(after.applied.includes('grant-tanaabot-write'));
  });

  it('should establish main when the repository owner defaults new repositories to master', () => {
    const remote = createRemote({ creationDefaultBranch: 'master', exists: false });
    const report = clientFor(remote).create(TARGET);
    const renameCommand = remote.commands.find(
      ({ args }) => args[1] === `/repos/${TARGET}/branches/master/rename`,
    );

    assert.equal(report.status, 'aligned');
    assert.deepEqual(renameCommand.body, { new_name: 'main' });
    assert.ok(report.applied.includes('rename-default:master->main'));
  });

  it('should require and honor initialization approval for an existing empty repository', () => {
    const remote = createRemote({
      branches: [],
      mainExists: false,
      protection: null,
    });
    const client = clientFor(remote);

    assert.throws(() => client.apply(TARGET), /--initialize/);

    const report = client.apply(TARGET, { initialize: true });
    const initializeCommand = remote.commands.find(
      ({ args }) => args[1] === `/repos/${TARGET}/contents/README.md`,
    );

    assert.equal(report.status, 'aligned');
    assert.equal(initializeCommand.body.message, 'initialize repository');
  });

  it('should rename a just-initialized empty repository when its owner defaults to master', () => {
    const remote = createRemote({
      branches: [],
      emptyInitializationBranch: 'master',
      mainExists: false,
      protection: null,
    });
    const report = clientFor(remote).apply(TARGET, { initialize: true });

    assert.equal(report.status, 'aligned');
    assert.ok(report.applied.includes('initialize-main'));
    assert.ok(report.applied.includes('rename-default:master->main'));
  });

  it('should require and honor separate approval to rename a non-main default branch', () => {
    const remote = createRemote({
      branches: [{ name: 'master' }],
      mainExists: false,
      repository: canonicalRepository({ default_branch: 'master' }),
    });
    const client = clientFor(remote);

    assert.throws(() => client.apply(TARGET), /--rename-default/);

    const report = client.apply(TARGET, { renameDefault: true });
    const renameCommand = remote.commands.find(
      ({ args }) => args[1] === `/repos/${TARGET}/branches/master/rename`,
    );

    assert.equal(report.status, 'aligned');
    assert.deepEqual(renameCommand.body, { new_name: 'main' });
  });

  it('should stop before protection when the bot invitation remains pending', () => {
    const remote = createRemote({
      acceptInvitations: false,
      directCollaborators: [],
      invitations: [{ invitee: { login: 'tanaabot' } }],
      permission: null,
      protection: null,
    });

    assert.throws(
      () => clientFor(remote).apply(TARGET),
      (error) =>
        error instanceof RepositoryPolicyError && /invitation may be pending/.test(error.message),
    );
    assert.equal(
      remote.commands.some(
        ({ args }) =>
          args[1] === `/repos/${TARGET}/branches/main/protection` && args.includes('PUT'),
      ),
      false,
    );
  });

  it('should surface authentication and partial protection failures', () => {
    const authRemote = createRemote({ failAuth: true });
    assert.throws(() => clientFor(authRemote).inspect(TARGET), /authentication failed/);

    const protection = protectionResponse();
    protection.required_linear_history = { enabled: false };
    const partialRemote = createRemote({ failProtection: true, protection });
    assert.throws(
      () => clientFor(partialRemote).apply(TARGET),
      (error) => error instanceof RepositoryPolicyError && error.step === 'update-main-protection',
    );
  });

  it('should leave an aligned apply idempotent', () => {
    const remote = createRemote();
    const report = clientFor(remote).apply(TARGET);

    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.applied, []);
    assert.deepEqual(mutatingCommands(remote), []);
  });
});
