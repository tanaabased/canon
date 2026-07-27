import assert from 'node:assert/strict';

import extractPackageScriptNames from '../utils/extract-package-script-names.js';

describe('utils/extract-package-script-names', () => {
  it('should extract package-script names from supported package-manager commands', () => {
    assert.deepEqual(
      extractPackageScriptNames(`
        bun run lint
        npm run test:unit
        pnpm run build-app
        yarn run codex:validate
      `),
      ['lint', 'test:unit', 'build-app', 'codex:validate'],
    );
  });

  it('should ignore commands that do not invoke package scripts', () => {
    assert.deepEqual(extractPackageScriptNames('bun test\nnpm install\nyarn lint'), []);
  });
});
