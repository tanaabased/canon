import assert from 'node:assert/strict';

import { runCli } from '../scripts/render-issue-forms.js';
import { parseIssueFormArgs } from '../utils/parse-issue-form-args.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('skills/github-issue-form-author/scripts/render-issue-forms', () => {
  it('should require an explicit repository mode', () => {
    assert.throws(() => parseIssueFormArgs(['render']), /requires --repository-mode/);
    assert.throws(
      () => parseIssueFormArgs(['render', '--repository-mode', 'unknown']),
      /organization, personal/,
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
    assert.match(stdout.value(), /writes no files and does not mutate GitHub/);
  });
});
