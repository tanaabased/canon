import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

describe('templates/Leia examples package boundary', () => {
  it('should keep the shared examples package boundary on CommonJS', async () => {
    const packageContent = await readFile(
      path.join(REPO_ROOT, 'templates', 'leia-examples-package.json'),
      'utf8',
    );

    assert.equal(JSON.parse(packageContent).type, 'commonjs');
  });

  it('should document the boundary beside the shared workflow examples TMPDIR', async () => {
    const workflowContent = await readFile(
      path.join(REPO_ROOT, 'templates', 'leia-pr-examples-tests.yml'),
      'utf8',
    );

    assert.match(workflowContent, /examples\/package\.json/);
    assert.match(workflowContent, /CommonJS boundary/);
    assert.match(workflowContent, /TMPDIR=.*examples\/\.tmp/);
    assert.doesNotMatch(workflowContent, /Validate examples package boundary/);
  });

  it('should identify Leia generated harnesses as conditionally CommonJS-scoped', async () => {
    const [referenceContent, agentsContent, readmeContent] = await Promise.all([
      readFile(path.join(REPO_ROOT, 'references', 'leia-markdown-scenarios.md'), 'utf8'),
      readFile(path.join(REPO_ROOT, 'templates', 'leia-examples-agents.md'), 'utf8'),
      readFile(path.join(REPO_ROOT, 'templates', 'leia-markdown-example-readme.md'), 'utf8'),
    ]);

    for (const content of [referenceContent, agentsContent, readmeContent]) {
      assert.match(content, /Leia's generated .*CommonJS/s);
      assert.match(content, /examples\/package\.json/);
      assert.match(content, /ESM/);
    }
  });
});
