import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readWorkflow = (name) =>
  readFile(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');

const CATALOG_REF = 'v1';

describe('GitHub Actions catalog contract', () => {
  it('should keep release publication split across independent catalog jobs', async () => {
    const workflow = await readWorkflow('release.yml');
    const [npmJob, otherJobs] = workflow.split('\n  publish-clawhub:');
    const [clawhubJob, repositoryJob] = otherJobs.split('\n  publish-repo:');

    assert.match(workflow, /^ {2}publish-npm:\n/m);
    assert.match(workflow, /^ {2}publish-repo:\n/m);
    assert.match(workflow, /^ {2}publish-clawhub:\n/m);
    assert.ok(workflow.includes(`tanaabased/actions/prepare-release@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/publish-npm@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/publish-repo@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/npm-pack@${CATALOG_REF}`));
    assert.equal(
      workflow.match(/tarball: \$\{\{ steps\.pack\.outputs\.tarball-path \}\}/g)?.length,
      4,
    );
    assert.match(workflow, /sync-token: \$\{\{ secrets\.TANAAB_COAXIUM_INJECTOR \}\}/);
    assert.match(npmJob, /id-token: write/);
    assert.doesNotMatch(npmJob, /TANAAB_COAXIUM_INJECTOR|TANAAB_LOBSTER_BOAT|registry-token:/);
    assert.match(clawhubJob, /clawhub-token: \$\{\{ secrets\.TANAAB_LOBSTER_BOAT \}\}/);
    assert.doesNotMatch(clawhubJob, /id-token: write|TANAAB_NPM_DEPLOY/);
    assert.equal(workflow.match(/version-injector openclaw\.plugin\.json/g)?.length, 3);
    assert.match(npmJob, /channel-token: \$\{\{ secrets\.TANAAB_NPM_DEPLOY \}\}/);
    assert.equal(workflow.match(/ref: \$\{\{ github\.sha \}\}/g)?.length, 3);
    assert.doesNotMatch(workflow, /needs:|publish-codex-plugin/);
    assert.match(repositoryJob, /permissions:\n {6}contents: read/);
    assert.doesNotMatch(repositoryJob, /github-token:/);
    assert.doesNotMatch(workflow, /prepare-release-action/);
  });

  it('should dry-run all publishers and check the extracted npm payload', async () => {
    const workflow = await readWorkflow('release-tests.yml');

    assert.ok(workflow.includes(`tanaabased/actions/publish-npm@${CATALOG_REF}`));
    assert.ok(workflow.includes(`tanaabased/actions/publish-repo@${CATALOG_REF}`));
    assert.equal(workflow.match(/dry-run: true/g)?.length, 3);
    assert.doesNotMatch(workflow, /test-mode:/);
    assert.match(workflow, /TARBALL: \$\{\{ steps\.pack\.outputs\.tarball-path \}\}/);
    assert.match(workflow, /bun run check:package "\$package_root"/);
    assert.match(workflow, /plugin-directory: \$\{\{ steps\.package\.outputs\.path \}\}/);
    assert.ok(workflow.includes(`tanaabased/actions/publish-clawhub@${CATALOG_REF}`));
    assert.match(workflow, /run: bun run check:openclaw/);
    assert.doesNotMatch(workflow, /github-token:|sync-token:|clawhub-token:/);
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
