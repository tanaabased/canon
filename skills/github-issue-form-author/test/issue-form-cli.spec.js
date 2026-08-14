import assert from 'node:assert/strict';

import { runCli } from '../scripts/render-issue-forms.js';
import { parseIssueFormArgs } from '../utils/parse-issue-form-args.js';
import { fakeIssueFormClient } from './fake-issue-form-client.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('skills/github-issue-form-author/scripts/render-issue-forms', () => {
  it('should require an explicit repository mode', () => {
    assert.throws(() => parseIssueFormArgs(['render']), /requires --repository-mode/);
    assert.throws(
      () => parseIssueFormArgs(['render', '--repository-mode', 'unknown']),
      /organization\|personal/,
    );
  });

  it('should render JSON without writing files or GitHub state', () => {
    const stdout = capture();
    const stderr = capture();

    const status = runCli(['render', '--repository-mode', 'personal', '--json'], {
      stdout: stdout.stream,
      stderr: stderr.stream,
    });
    const report = JSON.parse(stdout.value());

    assert.equal(status, 0);
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.operations, []);
    assert.equal(report.files.length, 4);
    assert.equal(stderr.value(), '');
  });

  it('should expose the read-only boundary in help', () => {
    const stdout = capture();
    const status = runCli(['--help'], { stdout: stdout.stream });

    assert.equal(status, 0);
    assert.match(stdout.value(), /Render and plan are read-only/);
    assert.match(stdout.value(), /never deletes files/);
  });

  it('should require exact repository, branch, and digest approval for apply', () => {
    assert.throws(
      () => parseIssueFormArgs(['apply', 'tanaabased/canon']),
      /approved-repository.*approved-branch.*approved-digest/,
    );
    assert.throws(
      () => parseIssueFormArgs(['plan', 'tanaabased/canon', '--approved-digest', 'sha256:wrong']),
      /only with apply/,
    );
  });

  it('should plan and apply through the injected repository client', () => {
    const client = fakeIssueFormClient();
    const stdout = capture();
    let status = runCli(['plan', 'tanaabased/agent-system-test', '--json'], {
      client,
      stdout: stdout.stream,
    });
    const preview = JSON.parse(stdout.value());
    assert.equal(status, 0);
    assert.equal(preview.status, 'approval_required');

    const applied = capture();
    status = runCli(
      [
        'apply',
        'tanaabased/agent-system-test',
        '--approved-repository',
        preview.authorization.repository,
        '--approved-branch',
        preview.authorization.branch,
        '--approved-digest',
        preview.authorization.digest,
        '--json',
      ],
      { client, stdout: applied.stream },
    );
    const report = JSON.parse(applied.value());
    assert.equal(status, 0);
    assert.equal(report.status, 'aligned_after_write');
    assert.equal(report.verification.status, 'verified');
  });
});
