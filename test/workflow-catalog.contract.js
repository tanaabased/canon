/* global Bun */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readWorkflow = async (name) =>
  Bun.YAML.parse(await readFile(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8'));

function action(job, name, dryRun = false) {
  const steps = job.steps.filter(
    (step) =>
      step.uses === `tanaabased/actions/${name}@v1` && Boolean(step.with?.['dry-run']) === dryRun,
  );
  assert.equal(steps.length, 1, `${name}: expected one ${dryRun ? 'dry-run' : 'live'} step`);
  return steps[0];
}

function credentials(value) {
  return [...JSON.stringify(value).matchAll(/secrets\.([A-Z_]+)/g)].map(([, name]) => name).sort();
}

function checkArtifact(job, publisher, dryRun) {
  const pack = action(job, 'npm-pack');
  assert.ok(pack.id);
  const tarball = `\${{ steps.${pack.id}.outputs.tarball-path }}`;
  assert.equal(action(job, publisher, dryRun).with.tarball, tarball);
  const extraction = job.steps.find((step) => step.env?.TARBALL === tarball);
  assert.ok(extraction?.id, 'the packed tarball must feed the extracted-package check');
  assert.match(extraction.run, /bun run check:package/);
  assert.equal(
    action(job, 'validate-codex-plugin').with['plugin-directory'],
    `\${{ steps.${extraction.id}.outputs.path }}`,
  );
}

describe('workflow static contracts', () => {
  for (const file of ['release.yml', 'release-tests.yml']) {
    it(`should isolate publication destinations and preserve artifact wiring in ${file}`, async () => {
      const workflow = await readWorkflow(file);
      const dryRun = file === 'release-tests.yml';
      assert.ok(
        dryRun
          ? Object.hasOwn(workflow.on, 'pull_request')
          : workflow.on.release.types.includes('published'),
      );
      assert.deepEqual(Object.keys(workflow.jobs).sort(), [
        'publish-clawhub',
        'publish-npm',
        'publish-repo',
      ]);
      assert.deepEqual(workflow.permissions, dryRun ? { contents: 'read' } : undefined);
      for (const [destination, display] of [
        ['npm', 'npm'],
        ['clawhub', 'ClawHub'],
        ['repo', 'repo'],
      ]) {
        const job = workflow.jobs[`publish-${destination}`];
        assert.equal(job.name, `Publish ${display}`);
        assert.equal(job.needs, undefined, 'destinations must recover independently');
        const checkout = job.steps.find((step) => step.uses?.startsWith('actions/checkout@'));
        assert.equal(checkout?.with?.ref, '${{ github.sha }}');
        assert.equal(checkout.with['fetch-depth'], 0);
        assert.deepEqual(
          job.permissions,
          dryRun
            ? undefined
            : destination === 'npm'
              ? { contents: 'read', 'id-token': 'write' }
              : { contents: 'read' },
        );
        const expectedSecrets = dryRun
          ? []
          : [
              destination === 'npm'
                ? 'TANAAB_NPM_DEPLOY'
                : destination === 'clawhub'
                  ? 'TANAAB_LOBSTER_BOAT'
                  : 'TANAAB_COAXIUM_INJECTOR',
            ];
        assert.deepEqual(credentials(job), expectedSecrets);
        const publisher = action(job, `publish-${destination}`, dryRun);
        assert.equal(publisher.with?.['registry-token'], undefined);
        assert.equal(publisher.with?.['github-token'], undefined);
        if (dryRun) assert.equal(publisher.with['dry-run'], true);
        else {
          const key =
            destination === 'npm'
              ? 'channel-token'
              : destination === 'clawhub'
                ? 'clawhub-token'
                : 'sync-token';
          assert.equal(publisher.with[key], `\${{ secrets.${expectedSecrets[0]} }}`);
        }
        if (destination !== 'repo') {
          action(job, 'prepare-release');
          checkArtifact(job, `publish-${destination}`, true);
          if (!dryRun) checkArtifact(job, `publish-${destination}`, false);
        }
      }
    });
  }

  it('should preserve independent PR check identities and caller-owned commands', async () => {
    const lint = await readWorkflow('pr-linter.yml');
    const unit = await readWorkflow('pr-unit-tests.yml');
    const release = await readWorkflow('release-tests.yml');
    assert.equal(lint.name, 'Lint');
    assert.equal(unit.name, 'Unit Tests');
    assert.equal(release.name, 'Release Tests');
    for (const [workflow, id, command] of [
      [lint, 'lint', 'bun run lint'],
      [unit, 'unit-tests', 'bun run test'],
    ]) {
      assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
      assert.deepEqual(workflow.permissions, { contents: 'read' });
      assert.deepEqual(credentials(workflow), []);
      assert.ok(workflow.jobs[id].steps.some((step) => step.run === command));
      action(workflow.jobs[id], 'setup-bun');
    }
    action(lint.jobs.lint, 'validate-codex-plugin');
    assert.deepEqual(unit.jobs['unit-tests'].strategy.matrix.os, ['ubuntu-24.04', 'macos-26']);
  });
});
