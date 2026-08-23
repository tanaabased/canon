import assert from 'node:assert/strict';

import { addMissingGitHubIssueFields } from '../lib/schema-field-synchronizer.js';
import { runFieldAdditionCli } from '../scripts/add-fields.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';
import { fakeFieldAdditionClient } from './fake-issue-field-client.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('skills/github-issue-schema-author/scripts/add-fields', () => {
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
    assert.throws(
      () => parseSchemaMutationArgs(['plan', 'tanaabased/canon', '--approved-digest', 'x']),
      /valid only with apply/,
    );
  });

  it('should render a no-write four-field plan', () => {
    const stdout = capture();
    const stderr = capture();
    const status = runFieldAdditionCli(['plan', 'tanaabased/big-test-bucket'], {
      client: fakeFieldAdditionClient(),
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(status, 0);
    assert.match(stdout.value(), /status: approval_required/);
    assert.match(stdout.value(), /Work size, Complexity, Impact, Task score/);
    assert.match(stdout.value(), /updates: none/);
    assert.match(stdout.value(), /deletions: none/);
    assert.equal(stderr.value(), '');
  });

  it('should render the API error when a creation fails', () => {
    const client = fakeFieldAdditionClient({ failAt: 1 });
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });
    const stdout = capture();
    const stderr = capture();
    const status = runFieldAdditionCli(
      [
        'apply',
        'tanaabased/big-test-bucket',
        '--approved-organization',
        report.authorization.organization,
        '--approved-digest',
        report.authorization.digest,
      ],
      { client, stdout: stdout.stream, stderr: stderr.stream },
    );

    assert.equal(status, 1);
    assert.match(stdout.value(), /failed: create Work size/);
    assert.match(stdout.value(), /error: POST \/orgs\/tanaabased\/issue-fields: HTTP 403/);
    assert.equal(stderr.value(), '');
  });

  it('should expose help without constructing a client', () => {
    const stdout = capture();
    const stderr = capture();
    const status = runFieldAdditionCli(['--help'], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });

    assert.equal(status, 0);
    assert.match(stdout.value(), /never updates.*deletes/s);
    assert.equal(stderr.value(), '');
  });
});
