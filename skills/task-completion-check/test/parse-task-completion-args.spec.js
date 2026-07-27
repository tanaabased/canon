import assert from 'node:assert/strict';

import parseTaskCompletionArgs from '../utils/parse-task-completion-args.js';

describe('skills/task-completion-check/utils/parse-task-completion-args', () => {
  it('should parse the Task target, repeated PR evidence, and numeric bounds', () => {
    assert.deepEqual(
      parseTaskCompletionArgs([
        'tanaabased/canon#7',
        '--pr=8',
        '--pr',
        'acme/tools#9',
        '--max-lines',
        '20',
        '--json',
      ]),
      {
        context: 30,
        json: true,
        maxLines: 20,
        prs: ['8', 'acme/tools#9'],
        task: 'tanaabased/canon#7',
      },
    );
  });

  it('should reject missing targets, invalid counts, and unknown options', () => {
    assert.throws(() => parseTaskCompletionArgs([]), /Task is required/);
    assert.throws(
      () => parseTaskCompletionArgs(['tanaabased/canon#7', '--context', '0']),
      /positive integer/,
    );
    assert.throws(
      () => parseTaskCompletionArgs(['tanaabased/canon#7', '--other', 'x']),
      /Unknown option/,
    );
  });
});
