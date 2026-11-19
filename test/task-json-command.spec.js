import assert from 'node:assert/strict';

import { runTaskJsonCommand, TASK_JSON_INPUT_GUIDANCE } from '../lib/task-json-command.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('Task Author JSON command runner', () => {
  it('should prefer stdin and keep file fallback inside an ignored workspace path', () => {
    assert.match(TASK_JSON_INPUT_GUIDANCE, /prefer --input -/);
    assert.match(TASK_JSON_INPUT_GUIDANCE, /repository-local ignored scratch path/);
    assert.match(TASK_JSON_INPUT_GUIDANCE, /git check-ignore/);
    assert.match(TASK_JSON_INPUT_GUIDANCE, /Do not use an\s+operating-system or user-level/);
  });

  it('should preserve help without reading input', () => {
    const stdout = capture();
    const status = runTaskJsonCommand(
      ['--help'],
      { errorPrefix: 'failed', execute: () => assert.fail(), usage: () => 'Usage: task' },
      { readFile: () => assert.fail(), stdout: stdout.stream },
    );

    assert.equal(status, 0);
    assert.equal(stdout.value(), 'Usage: task\n');
  });

  it('should read stdin, render JSON, and map declared failure statuses', () => {
    const stdout = capture();
    const status = runTaskJsonCommand(
      ['--input', '-'],
      {
        errorPrefix: 'failed',
        execute: (input) => ({ status: input.status }),
        failureStatuses: ['blocked'],
        usage: () => 'Usage: task',
      },
      {
        readFile: (path) => {
          assert.equal(path, 0);
          return '{"status":"blocked"}';
        },
        stdout: stdout.stream,
      },
    );

    assert.equal(status, 1);
    assert.deepEqual(JSON.parse(stdout.value()), { status: 'blocked' });
  });

  it('should retain the command-specific error prefix', () => {
    const stderr = capture();
    const status = runTaskJsonCommand(
      [],
      { errorPrefix: 'Task Author create failed', execute: () => ({}), usage: () => '' },
      { stderr: stderr.stream },
    );

    assert.equal(status, 1);
    assert.equal(stderr.value(), 'Task Author create failed: --input <path|-> is required.\n');
  });
});
