import assert from 'node:assert/strict';

import parseTaskDecomposerArgs from '../utils/parse-task-decomposer-args.js';

describe('Task Decomposer inspector arguments', () => {
  it('should require one explicit target and preserve JSON mode', () => {
    assert.deepEqual(parseTaskDecomposerArgs(['acme/widgets#7', '--json']), {
      json: true,
      target: 'acme/widgets#7',
    });
    assert.throws(() => parseTaskDecomposerArgs([]), /explicit OWNER\/REPO#NUMBER/);
    assert.throws(
      () => parseTaskDecomposerArgs(['acme/widgets#7', 'acme/widgets#8']),
      /Only one task target/,
    );
    assert.throws(() => parseTaskDecomposerArgs(['--write']), /Unknown option/);
  });
});
