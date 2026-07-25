import assert from 'node:assert/strict';

import { renderCliHelp, supportsColor } from '../lib/bun-cli-support.js';

describe('lib/bun-cli-support', () => {
  it('should resolve explicit color controls before TTY state', () => {
    assert.equal(supportsColor({ isTTY: true }, { NO_COLOR: '' }), false);
    assert.equal(supportsColor({ isTTY: false }, { FORCE_COLOR: '1' }), true);
  });

  it('should render only populated help sections', () => {
    const result = renderCliHelp(
      {
        usage: 'Usage: tool [options]',
        options: ['  --help  displays help'],
      },
      { isTTY: false },
    );

    assert.equal(result, 'Usage: tool [options]\n\nOptions:\n  --help  displays help');
  });
});
