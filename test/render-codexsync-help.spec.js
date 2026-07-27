import assert from 'node:assert/strict';

import renderCodexsyncHelp from '../utils/render-codexsync-help.js';

describe('utils/render-codexsync-help', () => {
  it('should render commands and resolved path defaults', () => {
    const result = renderCodexsyncHelp(
      {
        cachePath: '/cache',
        cliName: 'codexsync',
        commands: ['check', 'validate', 'sync'],
        repoRoot: '/repo',
      },
      { isTTY: false },
    );

    assert.match(result, /^Usage: codexsync <check\|validate\|sync> \[options\]/);
    assert.match(result, /Commands:\n {2}check/);
    assert.match(result, /\[default: \/repo\]/);
    assert.match(result, /\[default: \/cache\]/);
  });
});
