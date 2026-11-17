import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDistribution, rewriteDistributionLinks } from '../lib/build-distribution.js';
import config from '../build.config.js';
import {
  completeTaskSections,
  organizationCapabilities,
} from '../../../test/task-management-fixtures.js';
import extractRelativeMarkdownLinks from '../../skill-author/utils/extract-relative-markdown-links.js';
import { renderFallbackMetadata } from '../utils/render-fallback-metadata.js';
import { validateSkillDir } from '../../skill-author/lib/skill-validator.js';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = path.resolve(skillRoot, '../..');

describe('skills/task-author/lib/build-distribution', function () {
  this.timeout(15000);
  let root, outputRoot, runtimeRoot, projectRoot, env, result;

  before(async () => {
    root = await realpath(await mkdtemp(path.join(tmpdir(), 'task-author-distribution-')));
    outputRoot = path.join(root, 'artifact/task-author');
    runtimeRoot = path.join(root, 'execution-copy');
    projectRoot = path.join(root, 'active-project');
    result = await buildDistribution({
      skillRoot,
      repositoryRoot,
      outputRoot,
      config,
      version: '0.0.0-pilot',
    });
    await mkdir(projectRoot);
    const bin = path.join(root, 'bin');
    await mkdir(bin);
    await copyFile(path.join(skillRoot, 'test/distribution-gh.js'), path.join(bin, 'gh'));
    // Read and write text, as a resource-only host would, without copying source modules.
    for (const command of result.commands) {
      const text = await readFile(path.join(outputRoot, command.path), 'utf8');
      assert.equal(Buffer.byteLength(text), command.bytes);
      assert.equal(createHash('sha256').update(text).digest('hex'), command.sha256);
      const copy = path.join(runtimeRoot, command.path);
      await mkdir(path.dirname(copy), { recursive: true });
      await writeFile(copy, text);
    }
    env = {
      PATH: `${bin}${path.delimiter}${path.dirname(process.execPath)}`,
      TASK_AUTHOR_GH_FIXTURE: path.join(root, 'github.json'),
      TASK_AUTHOR_GH_LOG: path.join(root, 'github.log'),
      TASK_AUTHOR_ROUTING_MARKER: 'inherited-test-context',
    };
  });

  after(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  async function fixture(extra = {}) {
    await writeFile(
      env.TASK_AUTHOR_GH_FIXTURE,
      JSON.stringify({
        capabilities: organizationCapabilities(),
        issue: {
          number: 91,
          title: 'old title',
          html_url: 'https://github.com/acme/widgets/issues/91',
          body: `## Context\n\nMigration fixture.\n\n${renderFallbackMetadata({ complexity: 'medium' })}`,
          type: { name: 'Task' },
          labels: [],
        },
        ...extra,
      }),
    );
    await writeFile(env.TASK_AUTHOR_GH_LOG, '');
  }

  function run(command, input, args = ['--input', '-']) {
    const execution = spawnSync(
      process.execPath,
      [path.join(runtimeRoot, 'dist', command), ...args],
      {
        cwd: projectRoot,
        env,
        input: JSON.stringify(input),
        encoding: 'utf8',
      },
    );
    return { ...execution, report: execution.stdout ? JSON.parse(execution.stdout) : null };
  }

  const input = {
    target: 'acme/widgets',
    kind: 'Task',
    title: 'package the task command',
    sections: completeTaskSections,
  };

  it('should contain every local document link and retain a valid discoverable skill', async () => {
    const validation = await validateSkillDir(outputRoot, {
      namespace: 'tanaab',
      container: 'codex-plugin',
    });
    assert.deepEqual(validation.errors, []);
    const files = await readdir(outputRoot, { recursive: true });
    for (const file of files.filter((name) => name.endsWith('.md'))) {
      const document = await readFile(path.join(outputRoot, file), 'utf8');
      for (const link of extractRelativeMarkdownLinks(document)) {
        const target = path.resolve(outputRoot, path.dirname(file), link.split('#')[0]);
        assert.ok(target.startsWith(`${outputRoot}${path.sep}`), `${file}: ${link}`);
        await readFile(target);
      }
    }
    const skill = await readFile(path.join(outputRoot, 'SKILL.md'), 'utf8');
    for (const command of result.commands)
      assert.ok(skill.includes(`<skill-path>/${command.path}`));
    assert.equal(
      files.some((name) => name.startsWith('lib/') || name.startsWith('test/')),
      false,
    );
    const inventory = JSON.parse(
      await readFile(path.join(outputRoot, 'runtime-files.json'), 'utf8'),
    );
    assert.deepEqual(inventory.commands, result.commands);
  });

  it('should resolve links by source location and preserve anchors without rewriting prose', () => {
    const source = path.join(root, 'source/SKILL.md');
    const output = path.join(root, 'out/SKILL.md');
    const destinations = new Map([
      [path.join(root, 'policy.md'), path.join(root, 'out/references/policy.md')],
    ]);
    const text =
      'Mention ../policy.md. [policy](../policy.md#rules) [web](https://example.org/policy.md)';
    assert.equal(
      rewriteDistributionLinks(text, source, output, destinations, new Map()),
      'Mention ../policy.md. [policy](./references/policy.md#rules) [web](https://example.org/policy.md)',
    );
    assert.throws(
      () =>
        rewriteDistributionLinks('[missing](missing.md)', source, output, destinations, new Map()),
      /Undeclared resource/,
    );
  });

  it('should reject generated destinations that escape or overwrite source', async () => {
    await assert.rejects(
      buildDistribution({
        skillRoot,
        repositoryRoot,
        outputRoot: path.join(root, 'invalid'),
        config: { ...config, resources: { 'SKILL.md': '../escape.md' } },
        version: 'test',
      }),
      /must stay inside/,
    );
    await assert.rejects(
      buildDistribution({
        skillRoot,
        repositoryRoot,
        outputRoot: skillRoot,
        version: 'test',
        config: {
          ...config,
          entrypoints: {
            'scripts/draft-task.js': 'scripts/create-task.js',
            'scripts/create-task.js': 'dist/create-task.js',
          },
        },
      }),
      /overwrite source/,
    );
  });

  it('should refresh in place, preserve authored files, and detect stale output without writing', async () => {
    const repository = path.join(root, 'in-place');
    const skill = path.join(repository, 'skills/task-author');
    await mkdir(path.join(skill, 'scripts'), { recursive: true });
    const instructions = '# Skill\n\n[policy](./references/policy.md) [command](./dist/run.js)\n';
    await writeFile(path.join(skill, 'SKILL.md'), instructions);
    await writeFile(path.join(skill, 'scripts/run.js'), 'console.log("fixture");\n');
    await writeFile(path.join(skill, 'unrelated.txt'), 'keep');
    await writeFile(path.join(repository, 'policy.md'), '# Policy\n');
    const options = {
      skillRoot: skill,
      repositoryRoot: repository,
      outputRoot: skill,
      version: '1.0.0',
      config: {
        resources: { 'SKILL.md': 'SKILL.md', '../../policy.md': 'references/policy.md' },
        entrypoints: { 'scripts/run.js': 'dist/run.js' },
        sourceLinks: [],
      },
    };
    await buildDistribution(options);
    const bundle = path.join(skill, 'dist/run.js');
    await writeFile(bundle, 'stale bundle');
    await writeFile(path.join(repository, 'policy.md'), '# Changed policy\n');
    await assert.rejects(buildDistribution({ ...options, check: true }), /Stale Task Author/);
    assert.equal(await readFile(bundle, 'utf8'), 'stale bundle');
    assert.equal(await readFile(path.join(skill, 'references/policy.md'), 'utf8'), '# Policy\n');
    await buildDistribution({ ...options, version: '2.0.0' });
    await buildDistribution({ ...options, version: '2.0.0', check: true });
    assert.equal(await readFile(path.join(skill, 'SKILL.md'), 'utf8'), instructions);
    assert.equal(await readFile(path.join(skill, 'unrelated.txt'), 'utf8'), 'keep');
    assert.equal(
      await readFile(path.join(skill, 'references/policy.md'), 'utf8'),
      '# Changed policy\n',
    );
    const inventory = JSON.parse(await readFile(path.join(skill, 'runtime-files.json'), 'utf8'));
    assert.equal(inventory.version, '2.0.0');
    const moduleUrl = new URL('../lib/build-distribution.js', import.meta.url).href;
    const otherDirectory = spawnSync(
      process.execPath,
      [
        '--eval',
        `import { buildDistribution } from ${JSON.stringify(moduleUrl)}; await buildDistribution(${JSON.stringify({ ...options, version: '2.0.0', check: true })});`,
      ],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(otherDirectory.status, 0, otherDirectory.stderr);
  });

  it('should not rewrite a destination again when it matches another source link', () => {
    const source = path.join(root, 'source/SKILL.md');
    const output = path.join(root, 'out/SKILL.md');
    const destinations = new Map([
      [path.join(root, 'source/a.md'), path.join(root, 'out/b.md')],
      [path.join(root, 'source/b.md'), path.join(root, 'out/c.md')],
    ]);
    assert.equal(
      rewriteDistributionLinks('[a](./a.md) [b](./b.md)', source, output, destinations, new Map()),
      '[a](./b.md) [b](./c.md)',
    );
  });

  it('should draft from a text-only execution copy while inheriting the active project and routing', async () => {
    await fixture();
    const execution = run('draft-task.js', { ...input, target: undefined });
    assert.equal(execution.status, 0, execution.stderr);
    assert.equal(execution.report.status, 'ready');
    assert.equal(execution.report.mutatesGitHub, false);
    assert.equal(execution.report.target.slug, 'acme/widgets');
    assert.ok(execution.report.body.includes(completeTaskSections.context));
    const calls = (await readFile(env.TASK_AUTHOR_GH_LOG, 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse);
    assert.ok(calls.length > 0);
    assert.ok(
      calls.every(({ cwd, marker }) => cwd === projectRoot && marker === 'inherited-test-context'),
    );
  });

  it('should preserve exact-plan publication gating in the bundled create command', async () => {
    await fixture();
    const preview = run('create-task.js', input);
    assert.equal(preview.status, 0, preview.stderr);
    assert.equal(preview.report.status, 'approval_required');
    const stale = run('create-task.js', {
      ...input,
      title: 'a changed plan',
      publication: {
        safetyReviewed: true,
        approvedTarget: preview.report.publication.target,
        approvedDigest: preview.report.publication.digest,
      },
    });
    assert.equal(stale.report.status, 'approval_required');
    assert.equal(stale.report.mutatesGitHub, false);
    assert.notEqual(stale.report.publication.digest, preview.report.publication.digest);
    const calls = (await readFile(env.TASK_AUTHOR_GH_LOG, 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse);
    assert.ok(calls.every(({ args }) => !args.includes('POST') && !args.includes('PATCH')));
  });

  it('should preview both existing-issue commands without writing', async () => {
    await fixture();
    const revision = run('update-task.js', {
      ...input,
      target: 'acme/widgets#91',
      mode: 'revise',
      revisionSummary: 'Clarify the task.',
    });
    assert.equal(revision.status, 0, revision.stderr);
    assert.equal(revision.report.status, 'approval_required');
    const migration = run('migrate-fallback.js', { target: 'acme/widgets#91' });
    assert.equal(migration.status, 0, migration.stderr || JSON.stringify(migration.report));
    assert.equal(migration.report.status, 'approval_required');
    assert.deepEqual(migration.report.plannedMutation.removableKeys, ['complexity']);
  });

  it('should surface a host routing denial without bypassing the host gh', async () => {
    await fixture({ denial: true });
    const execution = run('draft-task.js', input);
    assert.equal(execution.status, 1);
    assert.match(execution.stderr, /fixture routing denied/);
  });
});
