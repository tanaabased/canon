import assert from 'node:assert/strict';

import { runFieldColorCli } from '../scripts/recolor-fields.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';
import { fakeFieldColorClient } from './fake-issue-field-client.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('skills/github-issue-schema-author/scripts/recolor-fields', () => {
  it('should parse plan and require exact apply authorization flags', () => {
    assert.deepEqual(parseSchemaMutationArgs(['plan', 'tanaabased/canon']), {
      command: 'plan',
      target: 'tanaabased/canon',
      json: false,
      help: false,
      authorization: { approvedOrganization: null, approvedDigest: null },
    });
    assert.throws(
      () => parseSchemaMutationArgs(['apply', 'tanaabased/canon']),
      /requires --approved-organization and --approved-digest/,
    );
  });

  it('should render the exact color-only update plan', () => {
    const stdout = capture();
    const stderr = capture();
    const status = runFieldColorCli(['plan', 'tanaabased/big-test-bucket'], {
      client: fakeFieldColorClient(),
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(status, 0);
    assert.match(stdout.value(), /status: approval_required/);
    assert.match(stdout.value(), /creates: none/);
    assert.match(stdout.value(), /updates: Work size, Complexity, Impact/);
    assert.match(stdout.value(), /1 gray->green/);
    assert.match(stdout.value(), /deletions: none/);
    assert.equal(stderr.value(), '');
  });

  it('should expose help without constructing a client', () => {
    const stdout = capture();
    const stderr = capture();
    const status = runFieldColorCli(['--help'], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(status, 0);
    assert.match(stdout.value(), /Every option ID, name, description, and priority is retained/);
    assert.equal(stderr.value(), '');
  });
});
