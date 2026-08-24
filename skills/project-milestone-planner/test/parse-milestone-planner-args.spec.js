import assert from 'node:assert/strict';

import parseMilestonePlannerArgs from '../utils/parse-milestone-planner-args.js';

describe('skills/project-milestone-planner/utils/parse-milestone-planner-args', () => {
  it('should parse one milestone and JSON output', () => {
    assert.deepEqual(parseMilestonePlannerArgs(['tanaabased/canon#4', '--json']), {
      json: true,
      milestone: 'tanaabased/canon#4',
    });
  });

  it('should accept help without a milestone', () => {
    assert.deepEqual(parseMilestonePlannerArgs(['--help']), {
      help: true,
      json: false,
      milestone: null,
    });
  });

  it('should reject missing, duplicate, and unknown arguments', () => {
    assert.throws(() => parseMilestonePlannerArgs([]), /milestone is required/);
    assert.throws(
      () => parseMilestonePlannerArgs(['owner/repo#1', 'owner/repo#2']),
      /Unexpected positional/,
    );
    assert.throws(() => parseMilestonePlannerArgs(['--write']), /Unknown option/);
  });
});
