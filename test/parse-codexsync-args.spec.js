import assert from 'node:assert/strict';
import path from 'node:path';

import parseCodexsyncArgs from '../utils/parse-codexsync-args.js';

describe('utils/parse-codexsync-args', () => {
  it('should parse paths, flags, and positional arguments', () => {
    assert.deepEqual(
      parseCodexsyncArgs(
        ['check', 'extra', '--repo-root', './source', '--cache-path=./cache', '--version'],
        { defaultRepoRoot: '/default' },
      ),
      {
        command: 'check',
        extraPositionals: ['extra'],
        options: {
          cachePath: path.resolve('./cache'),
          help: false,
          repoRoot: path.resolve('./source'),
          version: true,
        },
      },
    );
  });

  it('should reject unknown options and missing values', () => {
    assert.throws(
      () => parseCodexsyncArgs(['--unknown'], { defaultRepoRoot: '/default' }),
      /Unknown option/,
    );
    assert.throws(
      () => parseCodexsyncArgs(['--repo-root'], { defaultRepoRoot: '/default' }),
      /Missing value/,
    );
  });
});
