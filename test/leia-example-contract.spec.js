import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

const readRepoFile = (...segments) => readFile(path.join(REPO_ROOT, ...segments), 'utf8');

describe('templates/Leia examples contract', () => {
  it('should keep the stable Leia range and Bun consumer invocation aligned', async () => {
    const [referenceContent, agentsContent, workflowContent] = await Promise.all([
      readRepoFile('references', 'leia-markdown-scenarios.md'),
      readRepoFile('templates', 'leia-examples-agents.md'),
      readRepoFile('templates', 'leia-pr-examples-tests.yml'),
    ]);

    for (const content of [referenceContent, agentsContent]) {
      assert.match(content, /\^2\.0\.0/);
      assert.match(content, /"leia": "bun \.\/node_modules\/\.bin\/leia"/);
      assert.match(content, /bun run leia/);
      assert.match(content, /github\.com\/lando\/leia\/blob\/v2\.0\.0\/CLI\.md#bun/);
      assert.doesNotMatch(content, /1\.0\.0-beta\.9/);
    }

    assert.match(workflowContent, /TMPDIR=.*bun run leia .* --stdin/);
    assert.doesNotMatch(workflowContent, /\.\/node_modules\/\.bin\/leia/);
  });

  it('should describe Leia module selection without claiming ownership of child runtimes', async () => {
    const [referenceContent, agentsContent] = await Promise.all([
      readRepoFile('references', 'leia-markdown-scenarios.md'),
      readRepoFile('templates', 'leia-examples-agents.md'),
    ]);

    for (const content of [referenceContent, agentsContent]) {
      assert.match(content, /\.leia\.cjs/);
      assert.match(content, /\.leia\.mjs/);
      assert.match(content, /invocation directory/);
      assert.match(content, /nearest `package\.json`/);
      assert.match(content, /Node runtime/);
      assert.match(content, /repository-authored `\.js` scenario helpers/);
      assert.doesNotMatch(content, /generated `\.js`/);
    }
  });

  it('should retain CI-first operational execution policy', async () => {
    const [referenceContent, agentsContent, workflowContent] = await Promise.all([
      readRepoFile('references', 'leia-markdown-scenarios.md'),
      readRepoFile('templates', 'leia-examples-agents.md'),
      readRepoFile('templates', 'leia-pr-examples-tests.yml'),
    ]);

    assert.match(referenceContent, /fresh CI runners by default/);
    assert.match(referenceContent, /Do not run machine-mutating scenarios locally/);
    assert.match(agentsContent, /fresh CI by default/);
    assert.match(agentsContent, /do not run them locally/);
    assert.match(workflowContent, /pull_request:/);
    assert.match(workflowContent, /matrix:/);
  });

  it('should keep every scenario starter block described and runtime state under TMPDIR', async () => {
    const readmeContent = await readRepoFile('templates', 'leia-markdown-example-readme.md');
    const fencedBlocks = [...readmeContent.matchAll(/```(?:bash|sh)\n([\s\S]*?)```/g)];

    assert.ok(fencedBlocks.length > 0);

    for (const [, block] of fencedBlocks) {
      for (const script of block.trim().split(/\n\s*\n/)) {
        assert.match(script, /^# should /);
      }
    }

    assert.match(readmeContent, /test -n "\$TMPDIR"/);
    assert.match(readmeContent, /"\$TMPDIR\/home"/);
    assert.doesNotMatch(readmeContent, /\.tmp\/home/);
    assert.doesNotMatch(readmeContent, /^## Notes$/m);
  });
});
