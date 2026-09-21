import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readWorkflow = (name) =>
  readFile(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');

const CATALOG_REF = 'v1';

describe('GitHub Actions catalog contract', () => {
  it('should keep release publication split across independent catalog jobs', async () => {
    const workflow = await readWorkflow('release.yml');
    const [archiveJob, repositoryJob] = workflow.split('\n  publish-repo:');

    assert.match(workflow, /^ {2}publish-codex-plugin:\n/m);
    assert.match(workflow, /^ {2}publish-repo:\n/m);
    assert.ok(workflow.includes(`tanaabased/actions/prepare-release@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/publish-codex-plugin@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/publish-repo@${CATALOG_REF}`));
    assert.match(
      workflow,
      /archive-name: tanaab-\$\{\{ github\.event\.release\.tag_name \}\}\.tar\.gz/,
    );
    assert.match(workflow, /dependency-policy: include-production/);
    assert.match(workflow, /github-token: \$\{\{ github\.token \}\}/);
    assert.match(workflow, /sync-token: \$\{\{ secrets\.TANAAB_COAXIUM_INJECTOR \}\}/);
    assert.match(archiveJob, /permissions:\n {6}contents: write/);
    assert.doesNotMatch(archiveJob, /TANAAB_COAXIUM_INJECTOR/);
    assert.match(repositoryJob, /permissions:\n {6}contents: read/);
    assert.doesNotMatch(repositoryJob, /github-token:/);
    assert.doesNotMatch(workflow, /prepare-release-action/);
  });

  it('should dry-run both publishers and inspect the real Codex archive', async () => {
    const workflow = await readWorkflow('release-tests.yml');

    assert.ok(workflow.includes(`tanaabased/actions/publish-codex-plugin@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/publish-repo@${CATALOG_REF}`));
    assert.equal(workflow.match(/dry-run: true/g)?.length, 2);
    assert.doesNotMatch(workflow, /test-mode:/);
    assert.match(workflow, /ARCHIVE_PATH: \$\{\{ steps\.publish\.outputs\.archive-path \}\}/);
    assert.match(workflow, /test -f \.codex-plugin\/plugin\.json/);
    assert.match(workflow, /test -d node_modules\/mocha/);
    assert.match(workflow, /plugin_version=.*\.codex-plugin\/plugin\.json/);
    assert.doesNotMatch(workflow, /github-token:|sync-token:/);
  });

  it('should preserve PR check identities and caller-owned commands', async () => {
    const [lint, unit, release] = await Promise.all([
      readWorkflow('pr-linter.yml'),
      readWorkflow('pr-unit-tests.yml'),
      readWorkflow('release-tests.yml'),
    ]);

    assert.match(lint, /^name: Lint$/m);
    assert.match(lint, /^ {2}lint:$/m);
    assert.match(lint, /run: bun run lint/);
    assert.match(lint, /run: bun run codex:validate/);
    assert.ok(lint.includes(`tanaabased/actions/setup-bun@${CATALOG_REF}`));
    assert.ok(lint.includes(`tanaabased/actions/validate-codex-plugin@${CATALOG_REF}`));
    assert.doesNotMatch(lint, /test-mode:/);

    assert.match(unit, /^name: Unit Tests$/m);
    assert.match(unit, /^ {2}unit-tests:$/m);
    assert.match(unit, /run: bun run test/);
    assert.match(unit, /ubuntu-24\.04/);
    assert.match(unit, /macos-26/);
    assert.ok(unit.includes(`tanaabased/actions/setup-bun@${CATALOG_REF}`));

    assert.match(release, /^name: Release Tests$/m);
    assert.match(release, /^ {2}release:$/m);
  });
});
