import assert from 'node:assert/strict';

import { RepositoryPolicyClient } from '../lib/repository-policy-client.js';
import { runCli } from '../scripts/repository-policy.js';
import {
  CREATION_PLAN,
  TARGET,
  canonicalRepository,
  createRemote,
  mutatingCommands,
  protectionResponse,
} from './fake-github.js';

const RESTRICTIONS = { apps: [], teams: [], users: ['pirog', 'tanaabot'] };
const RESTRICTIONS_PATH = 'branches.main.protection.restrictions';
const PROTECTION_ENDPOINT = `/repos/${TARGET}/branches/main/protection`;

function clientFor(remote) {
  return new RepositoryPolicyClient({ runner: remote.runner, sleep: () => {} });
}

describe('project-author main push restrictions', () => {
  it('should preview a missing allowlist independently of the existing review bypass list', () => {
    const protection = protectionResponse();
    protection.restrictions = null;
    const remote = createRemote({ protection });
    const report = clientFor(remote).inspect(TARGET);

    assert.equal(report.status, 'drifted');
    assert.deepEqual(
      report.changes,
      Object.entries(RESTRICTIONS).map(([key, desired]) => ({
        current: null,
        desired,
        path: `${RESTRICTIONS_PATH}.${key}`,
      })),
    );
    assert.match(report.warnings[0], /administrators, including apps/);
    assert.deepEqual(mutatingCommands(remote), []);
  });

  for (const restrictions of [
    null,
    { users: [], teams: [], apps: [] },
    { users: [{ login: 'pirog' }], teams: [], apps: [] },
    {
      users: [
        { login: 'pirog' },
        { login: 'tanaabot' },
        { login: 'emoriwan' },
        { login: 'smutlord' },
      ],
      teams: [{ slug: 'agents' }],
      apps: [{ slug: 'merge-bot' }],
    },
  ]) {
    it(`should replace ${JSON.stringify(restrictions)} with the exact allowlist`, () => {
      const protection = protectionResponse();
      protection.restrictions = restrictions;
      const remote = createRemote({ protection });
      const client = clientFor(remote);
      const before = client.inspect(TARGET);
      const otherProtection = structuredClone(protection);
      delete otherProtection.restrictions;
      const repository = structuredClone(remote.repository);
      const collaborators = structuredClone(remote.directCollaborators);

      assert.equal(before.status, 'drifted');
      assert.ok(before.changes.every(({ path }) => path.startsWith(`${RESTRICTIONS_PATH}.`)));
      assert.deepEqual(
        before.changes,
        Object.keys(RESTRICTIONS)
          .filter(
            (key) =>
              JSON.stringify(
                before.current.branches.main.protection.restrictions?.[key] ?? null,
              ) !== JSON.stringify(RESTRICTIONS[key]),
          )
          .map((key) => ({
            current: before.current.branches.main.protection.restrictions?.[key] ?? null,
            desired: RESTRICTIONS[key],
            path: `${RESTRICTIONS_PATH}.${key}`,
          })),
      );

      const after = client.apply(TARGET);
      const writes = mutatingCommands(remote);
      assert.equal(after.status, 'aligned');
      assert.deepEqual(after.current.branches.main.protection.restrictions, RESTRICTIONS);
      assert.equal(writes.length, 1);
      assert.equal(writes[0].args[1], PROTECTION_ENDPOINT);
      assert.deepEqual(writes[0].body.restrictions, RESTRICTIONS);
      const remainingProtection = structuredClone(remote.protection);
      delete remainingProtection.restrictions;
      assert.deepEqual(remainingProtection, otherProtection);
      assert.deepEqual(remote.repository, repository);
      assert.deepEqual(remote.directCollaborators, collaborators);
      assert.deepEqual(client.apply(TARGET).applied, []);
      assert.equal(mutatingCommands(remote).length, 1);
    });
  }

  it('should accept reordered API actors without rewriting protection', () => {
    const protection = protectionResponse();
    protection.restrictions.users.reverse();
    const remote = createRemote({ protection });
    assert.equal(clientFor(remote).apply(TARGET).status, 'aligned');
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should install and read back the allowlist during organization repository creation', () => {
    const remote = createRemote({ exists: false });
    const report = clientFor(remote).create(TARGET, CREATION_PLAN);
    assert.equal(report.owner_type, 'Organization');
    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.current.branches.main.protection.restrictions, RESTRICTIONS);
    assert.deepEqual(
      mutatingCommands(remote).find(({ args }) => args[1] === PROTECTION_ENDPOINT).body
        .restrictions,
      RESTRICTIONS,
    );
  });

  for (const retained of [
    null,
    {
      users: [{ login: 'pirog' }, { login: 'tanaabot' }, { login: 'smutlord' }],
      teams: [{ slug: 'agents' }],
      apps: [{ slug: 'merge-bot' }],
    },
  ]) {
    it('should reject successful writes whose readback retains missing or extra allowed actors', () => {
      const remote = createRemote();
      remote.protection.restrictions = retained;
      const client = new RepositoryPolicyClient({
        runner: (args, options) => {
          const result = remote.runner(args, options);
          if (args[1] === PROTECTION_ENDPOINT && args.includes('PUT')) {
            remote.protection.restrictions = retained;
          }
          return result;
        },
      });
      assert.throws(
        () => client.apply(TARGET),
        (error) => {
          assert.equal(error.step, 'verify-policy');
          assert.equal(error.report.status, 'drifted');
          assert.ok(error.report.changes.some(({ path }) => path.startsWith(RESTRICTIONS_PATH)));
          return true;
        },
      );
    });
  }

  for (const ownerType of ['User', undefined]) {
    for (const exists of [true, false]) {
      it(`should block ${exists ? 'apply' : 'creation'} for owner type ${ownerType} before any writes`, () => {
        const remote = createRemote({
          exists,
          ownerType,
          branches: [],
          mainExists: false,
          protection: null,
          directCollaborators: [],
          permission: null,
          repository: canonicalRepository({ owner: { type: ownerType }, has_wiki: true }),
        });
        const client = clientFor(remote);
        const report = client.inspect(TARGET);
        assert.equal(report.status, 'unsupported');
        assert.equal(report.owner_type, ownerType ?? null);
        assert.deepEqual(report.desired.branches.main.protection.restrictions, RESTRICTIONS);
        assert.match(report.warnings[0], /required reviews are not a merge allowlist/);
        assert.throws(
          () =>
            exists
              ? client.apply(TARGET, { initialize: true, renameDefault: true })
              : client.create(TARGET, CREATION_PLAN),
          (error) => {
            assert.equal(error.step, 'check-owner-support');
            assert.equal(error.report.status, 'unsupported');
            return true;
          },
        );
        assert.deepEqual(mutatingCommands(remote), []);
      });
    }
  }

  it('should not label an otherwise canonical personal repository aligned', () => {
    const remote = createRemote({ repository: canonicalRepository({ owner: { type: 'User' } }) });
    assert.equal(clientFor(remote).inspect(TARGET).status, 'unsupported');
  });

  it('should stop creation when the owner lookup fails', () => {
    const remote = createRemote({ exists: false });
    const client = new RepositoryPolicyClient({
      runner: (args, options) =>
        args[1] === '/users/acme'
          ? { status: 1, stderr: 'gh: Forbidden (HTTP 403)', stdout: '' }
          : remote.runner(args, options),
    });
    assert.throws(
      () => client.create(TARGET, CREATION_PLAN),
      (error) => {
        assert.equal(error.step, 'inspect-owner');
        return true;
      },
    );
    assert.deepEqual(mutatingCommands(remote), []);
  });

  it('should surface a protection rejection without retrying a weaker payload', () => {
    const protection = protectionResponse();
    protection.restrictions = null;
    const remote = createRemote({ protection, failProtection: true });
    assert.throws(
      () => clientFor(remote).apply(TARGET),
      (error) => {
        assert.equal(error.step, 'update-main-protection');
        assert.match(error.message, /Forbidden/);
        return true;
      },
    );
    const writes = mutatingCommands(remote);
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0].body.restrictions, RESTRICTIONS);
  });

  it('should leave explicitly requested metadata updates available for a personal repository', () => {
    const remote = createRemote({ repository: canonicalRepository({ owner: { type: 'User' } }) });
    const client = clientFor(remote);
    const current = client.inspectMetadata(TARGET).current;
    assert.equal(client.applyMetadata(TARGET, { ...CREATION_PLAN, current }).status, 'aligned');
    assert.deepEqual(
      mutatingCommands(remote).map(({ args }) => args[1]),
      [`/repos/${TARGET}`, `/repos/${TARGET}/topics`],
    );
  });

  it('should render unsupported policy inspection and return a failed apply in JSON', () => {
    const remote = createRemote({ repository: canonicalRepository({ owner: { type: 'User' } }) });
    const client = clientFor(remote);
    let output = '';
    const stream = {
      write: (chunk) => {
        output += chunk;
      },
    };
    assert.equal(runCli(['inspect', TARGET], { client, stdout: stream }), 0);
    assert.match(output, /status: unsupported/);
    assert.match(output, /warning: Canonical main push restrictions require an organization/);
    output = '';
    assert.equal(runCli(['apply', TARGET, '--json'], { client, stderr: stream }), 1);
    assert.equal(JSON.parse(output).report.status, 'unsupported');
    assert.deepEqual(mutatingCommands(remote), []);
  });
});
