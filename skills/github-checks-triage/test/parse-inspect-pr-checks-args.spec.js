import assert from 'node:assert/strict';

import parseInspectPrChecksArgs from '../utils/parse-inspect-pr-checks-args.js';

describe('skills/github-checks-triage/utils/parse-inspect-pr-checks-args', () => {
  it('should parse inline values and numeric bounds', () => {
    assert.deepEqual(
      parseInspectPrChecksArgs(['--repo=/repo', '--pr', '12', '--max-lines', '20', '--json']),
      { context: 30, json: true, maxLines: 20, pr: '12', repo: '/repo' },
    );
  });

  it('should reject invalid counts and unknown options', () => {
    assert.throws(() => parseInspectPrChecksArgs(['--context', '0']), /positive integer/);
    assert.throws(() => parseInspectPrChecksArgs(['--other', 'x']), /Unknown option/);
  });
});
