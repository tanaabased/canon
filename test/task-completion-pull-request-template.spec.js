import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const TEMPLATE_URL = new URL('../templates/task-completion-pull-request.md', import.meta.url);

describe('templates/task-completion-pull-request', () => {
  it('should preserve the shared completion envelope and Bug regression proof', async () => {
    const content = await readFile(TEMPLATE_URL, 'utf8');

    assert.match(content, /^## Task\n\nCloses #ISSUE/);
    assert.match(content, /## Regression proof/);
    assert.match(content, /Affected baseline:/);
    assert.match(content, /Regression test or reproduction harness:/);
    assert.match(content, /Disposable execution environment:/);
    assert.match(content, /Failing run and expected failure:/);
    assert.match(content, /Passing run with the fix:/);
    assert.ok(content.indexOf('## Regression proof') < content.indexOf('## Acceptance evidence'));
  });
});
