import assert from 'node:assert/strict';

import { RepositoryPolicyClient } from '../lib/repository-policy-client.js';
import {
  CREATION_PLAN,
  TARGET,
  canonicalRepository,
  createRemote,
  mutatingCommands,
} from './fake-github.js';

const ALLOWLIST = { apps: [], teams: [], users: ['pirog', 'tanaabot'] };
const PROTECTION_ENDPOINT = `/repos/${TARGET}/branches/main/protection`;

function clientFor(remote) {
  return new RepositoryPolicyClient({ runner: remote.runner, sleep: () => {} });
}

describe('project-author main push restrictions', () => {
  it('should apply and verify the allowlist during organization repository creation', () => {
    const remote = createRemote({ exists: false });
    const report = clientFor(remote).create(TARGET, CREATION_PLAN);
    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.current.branches.main.protection.restrictions, ALLOWLIST);
  });

  for (const restrictions of [
    null,
    {
      users: [{ login: 'pirog' }, { login: 'tanaabot' }, { login: 'smutlord' }],
      teams: [{ slug: 'agents' }],
      apps: [{ slug: 'merge-bot' }],
    },
  ]) {
    it('should report exact actor drift and normalize only the allowlist', () => {
      const remote = createRemote();
      const expectedProtection = structuredClone(remote.protection);
      remote.protection.restrictions = restrictions;
      const client = clientFor(remote);
      const before = client.inspect(TARGET);
      assert.deepEqual(
        before.changes.map(({ path, desired }) => ({ path, desired })),
        [
          { path: 'branches.main.protection.restrictions.apps', desired: [] },
          { path: 'branches.main.protection.restrictions.teams', desired: [] },
          { path: 'branches.main.protection.restrictions.users', desired: ['pirog', 'tanaabot'] },
        ],
      );
      assert.deepEqual(mutatingCommands(remote), []);
      assert.equal(client.apply(TARGET).status, 'aligned');
      assert.deepEqual(remote.protection, expectedProtection);
      assert.deepEqual(
        mutatingCommands(remote).map(({ args }) => args[1]),
        [PROTECTION_ENDPOINT],
      );
      assert.deepEqual(client.apply(TARGET).applied, []);
    });
  }

  it('should reject readback that still allows extra actors after a successful write', () => {
    const remote = createRemote();
    remote.protection.restrictions.users.push({ login: 'emoriwan' });
    const retained = structuredClone(remote.protection.restrictions);
    const client = new RepositoryPolicyClient({
      runner: (args, options) => {
        const result = remote.runner(args, options);
        if (args[1] === PROTECTION_ENDPOINT && args.includes('PUT'))
          remote.protection.restrictions = retained;
        return result;
      },
    });
    assert.throws(
      () => client.apply(TARGET),
      (error) => error.step === 'verify-policy' && error.report.status === 'drifted',
    );
  });

  for (const ownerType of ['User', undefined]) {
    for (const exists of [true, false]) {
      it(`should block ${exists ? 'apply' : 'creation'} for owner type ${ownerType} before writes`, () => {
        const remote = createRemote({
          exists,
          ownerType,
          branches: [],
          mainExists: false,
          protection: null,
          repository: canonicalRepository({ owner: { type: ownerType }, has_wiki: true }),
        });
        const client = clientFor(remote);
        assert.equal(client.inspect(TARGET).status, 'unsupported');
        assert.throws(
          () =>
            exists
              ? client.apply(TARGET, { initialize: true })
              : client.create(TARGET, CREATION_PLAN),
          (error) => error.step === 'check-owner-support',
        );
        assert.deepEqual(mutatingCommands(remote), []);
      });
    }
  }
});
