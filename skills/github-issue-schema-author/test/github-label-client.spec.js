import assert from 'node:assert/strict';
import { GitHubLabelClient } from '../lib/github-label-client.js';
import { createQueuedRunner, result } from './fake-github.js';

describe('skills/github-issue-schema-author/lib/github-label-client inventory', () => {
  it('should read every organization repository page without mutation', () => {
    const pages = [[{ full_name: 'acme/one' }], [{ full_name: 'acme/two' }]];
    const fake = createQueuedRunner([result({ stdout: JSON.stringify(pages) })]);
    const repos = new GitHubLabelClient({ runner: fake.runner }).listOrganizationRepositories(
      'acme',
    );
    assert.deepEqual(repos, pages.flat());
    assert.ok(fake.calls[0].args.includes('/orgs/acme/repos?type=all&per_page=100'));
    assert.ok(fake.calls[0].args.includes('--paginate'));
    assert.ok(fake.calls[0].args.includes('--slurp'));
    assert.ok(!fake.calls[0].args.includes('--method'));
  });

  it('should reject incomplete or malformed inventory instead of returning partial targets', () => {
    for (const response of [
      result({ status: 1, stdout: '[[]]', stderr: 'Later page failed' }),
      result({ stdout: '{"message":"Forbidden"}' }),
      result({ stdout: '[{"full_name":"acme/one"}]' }),
    ]) {
      const fake = createQueuedRunner([response]);
      assert.throws(() =>
        new GitHubLabelClient({ runner: fake.runner }).listOrganizationRepositories('acme'),
      );
    }
  });
});

describe('skills/github-issue-schema-author/lib/github-label-client', () => {
  it('should create and definition-update labels through stdin', () => {
    const calls = [];
    const client = new GitHubLabelClient({
      runner: (args, options = {}) => {
        calls.push({ args, input: options.input });
        return { status: 0, stdout: JSON.stringify({ id: 1 }), stderr: '' };
      },
    });
    const target = { slug: 'acme/widgets' };

    assert.equal(
      client.createLabel(target, {
        name: 'blocked',
        color: '7f1d1d',
        description: 'Blocked.',
      }).ok,
      true,
    );
    assert.equal(
      client.updateLabel(target, 'help wanted', {
        color: '00c88a',
        description: 'Help.',
      }).ok,
      true,
    );

    assert.deepEqual(calls[0].args.slice(0, 4), [
      'api',
      '/repos/acme/widgets/labels',
      '--method',
      'POST',
    ]);
    assert.deepEqual(calls[1].args.slice(0, 4), [
      'api',
      '/repos/acme/widgets/labels/help%20wanted',
      '--method',
      'PATCH',
    ]);
    assert.deepEqual(JSON.parse(calls[1].input), {
      color: '00c88a',
      description: 'Help.',
    });
  });
});
