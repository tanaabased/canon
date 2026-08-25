import assert from 'node:assert/strict';

import { GitHubIssueFormClient } from '../lib/github-issue-form-client.js';

const TARGET = 'tanaabased/big-test-bucket';
const TASK_PATH = '.github/ISSUE_TEMPLATE/task.yml';

function success(value) {
  return {
    status: 0,
    stdout: typeof value === 'string' ? value : JSON.stringify(value),
    stderr: '',
  };
}

function missing() {
  return { status: 1, stdout: '', stderr: 'HTTP 404: Not Found' };
}

function createRunner() {
  const calls = [];
  const runner = (args, options = {}) => {
    calls.push({ args, options });
    if (args[0] === '--version') return success('gh version 2.0.0');
    if (args[0] === 'auth') return success('');
    const endpoint = args[1];
    if (endpoint === `/repos/${TARGET}`) {
      return success({
        full_name: TARGET,
        default_branch: 'main',
        owner: { type: 'Organization' },
      });
    }
    if (endpoint === `/repos/${TARGET}/contents/.github/ISSUE_TEMPLATE?ref=main`) {
      return success([
        { path: TASK_PATH, sha: 'task-sha', type: 'file' },
        { path: '.github/ISSUE_TEMPLATE/security.md', sha: 'security-sha', type: 'file' },
      ]);
    }
    if (endpoint === `/repos/${TARGET}/contents/${TASK_PATH}?ref=main`) {
      return success({
        path: TASK_PATH,
        type: 'file',
        encoding: 'base64',
        sha: 'task-sha',
        content: Buffer.from('name: "Task"\n', 'utf8').toString('base64'),
      });
    }
    if (args.includes('--method') && args.includes('PUT')) {
      return success({
        content: { path: TASK_PATH, sha: 'updated-task-sha' },
        commit: { sha: 'commit-sha' },
      });
    }
    if (endpoint.includes('/contents/.github/ISSUE_TEMPLATE/')) return missing();
    throw new Error(`Unexpected gh call: ${args.join(' ')}`);
  };
  return { calls, runner };
}

describe('skills/github-issue-form-author/lib/github-issue-form-client', () => {
  it('should inspect the default branch, decode managed files, and preserve unknown entries', () => {
    const { calls, runner } = createRunner();
    const client = new GitHubIssueFormClient({ runner });

    assert.deepEqual(client.ensureAvailable(), []);
    const inspection = client.inspectRepository(TARGET);

    assert.equal(inspection.ownerType, 'Organization');
    assert.equal(inspection.defaultBranch, 'main');
    assert.equal(inspection.files[0].status, 'present');
    assert.equal(inspection.files[0].content, 'name: "Task"\n');
    assert.ok(inspection.files.slice(1).every(({ status }) => status === 'missing'));
    assert.deepEqual(inspection.unmanagedFiles, [
      { path: '.github/ISSUE_TEMPLATE/security.md', sha: 'security-sha', type: 'file' },
    ]);
    assert.equal(
      calls.some(({ args }) => args.includes('--method')),
      false,
    );
  });

  it('should send one SHA-bound Contents API write through stdin rather than process arguments', () => {
    const { calls, runner } = createRunner();
    const client = new GitHubIssueFormClient({ runner });
    const content = 'name: "Updated task"\n';
    const result = client.putFile(TARGET, 'main', {
      path: TASK_PATH,
      message: 'align canonical issue forms',
      before: { sha: 'task-sha' },
      after: { content },
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.commitSha, 'commit-sha');
    const call = calls.at(-1);
    assert.ok(call.args.includes('--input'));
    assert.equal(call.args.includes(content), false);
    assert.deepEqual(JSON.parse(call.options.input), {
      message: 'align canonical issue forms',
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: 'main',
      sha: 'task-sha',
    });
  });
});
