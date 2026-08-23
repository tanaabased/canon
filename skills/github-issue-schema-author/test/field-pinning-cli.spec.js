import assert from 'node:assert/strict';

import { runFieldPinningCli } from '../scripts/pin-fields.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';
import { fakeFieldPinningClient } from './fake-issue-field-client.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('skills/github-issue-schema-author/scripts/pin-fields', () => {
  it('should parse plan and require exact authorization flags', () => {
    assert.deepEqual(
      parseSchemaMutationArgs(['plan', 'tanaabased/canon'], { mutationCommand: 'authorize' }),
      {
        command: 'plan',
        target: 'tanaabased/canon',
        json: false,
        help: false,
        authorization: { approvedOrganization: null, approvedDigest: null },
      },
    );
    assert.throws(
      () =>
        parseSchemaMutationArgs(['authorize', 'tanaabased/canon'], {
          mutationCommand: 'authorize',
        }),
      /requires --approved-organization and --approved-digest/,
    );
  });

  it('should render the exact browser-backed pinning plan', () => {
    const stdout = capture();
    const stderr = capture();
    const status = runFieldPinningCli(['plan', 'tanaabased/big-test-bucket'], {
      client: fakeFieldPinningClient(),
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(status, 0);
    assert.match(stdout.value(), /status: approval_required/);
    assert.match(stdout.value(), /execution surface: github_settings_ui/);
    assert.match(stdout.value(), /updates: 6/);
    assert.match(stdout.value(), /Start date: Feature -> Task, Bug, Feature/);
    assert.match(stdout.value(), /deletions: none/);
    assert.equal(stderr.value(), '');
  });

  it('should expose help without constructing a client', () => {
    const stdout = capture();
    const stderr = capture();
    const status = runFieldPinningCli(['--help'], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(status, 0);
    assert.match(stdout.value(), /never calls GitHub's private web endpoint/);
    assert.equal(stderr.value(), '');
  });
});
