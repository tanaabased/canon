import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import pathExists from '../utils/path-exists.js';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const skillNames = async (root) =>
  (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

/** Check the extracted release payload without installing dependencies or changing live state. */
export default async function checkPackage(directory) {
  const root = path.resolve(directory);
  const pkg = await readJson(path.join(root, 'package.json'));
  const plugin = await readJson(path.join(root, '.codex-plugin/plugin.json'));
  const source = await readJson(path.join(sourceRoot, 'package.json'));
  assert.equal(pkg.name, source.name, 'Unexpected npm package identity');
  assert.equal(pkg.private, undefined, 'The release package must be publishable');
  assert.equal(pkg.version, source.version, 'Package version differs from prepared source');
  assert.equal(plugin.version, pkg.version, 'Plugin and npm versions differ');
  assert.equal(plugin.name, 'tanaab', 'Plugin identity changed');
  const openclaw = await readJson(path.join(root, 'openclaw.plugin.json'));
  assert.equal(openclaw.id, plugin.name, 'OpenClaw and Codex identities differ');
  assert.equal(openclaw.version, pkg.version, 'OpenClaw and npm versions differ');
  assert.deepEqual(openclaw.skills, ['./skills'], 'OpenClaw must expose the shared skills');
  assert.equal(openclaw.configSchema.additionalProperties, false);
  assert.deepEqual(pkg.openclaw.extensions, ['./index.js']);
  assert.deepEqual(pkg.openclaw.runtimeExtensions, pkg.openclaw.extensions);
  assert.deepEqual(pkg.openclaw.compat, source.openclaw.compat);
  assert.deepEqual(pkg.openclaw.build, source.openclaw.build);
  const { default: entry } = await import(pathToFileURL(path.join(root, 'index.js')).href);
  assert.equal(entry.id, openclaw.id, 'OpenClaw runtime and manifest identities differ');
  assert.equal(typeof entry.register, 'function', 'OpenClaw entry must register');
  for (const excluded of ['node_modules', '.git', '.env']) {
    assert.equal(
      await pathExists(path.join(root, excluded)),
      false,
      `Unexpected ${excluded} in package`,
    );
  }

  const names = await skillNames(root);
  assert.deepEqual(
    names,
    await skillNames(sourceRoot),
    'Packed skill inventory differs from source',
  );
  const { validateSkillDir } = await import(
    pathToFileURL(path.join(root, 'skills/skill-author/lib/skill-validator.js')).href
  );
  let commands = 0;
  for (const name of names) {
    const result = await validateSkillDir(path.join(root, 'skills', name), {
      namespace: 'tanaab',
      container: 'codex-plugin',
    });
    assert.deepEqual(result.errors, [], `${name}: broken packed skill or resource`);
    const scripts = path.join(root, 'skills', name, 'scripts');
    if (!(await pathExists(scripts))) continue;
    for (const file of await readdir(scripts)) {
      if (!file.endsWith('.js')) continue;
      run(root, path.join(scripts, file), ['--help']);
      commands += 1;
    }
  }

  const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'canon-package-smoke-'));
  try {
    run(root, 'skills/skill-author/scripts/init-skill.js', [
      '--type',
      'generic',
      '--slug',
      'package-smoke',
      '--display-name',
      'Package Smoke',
      '--description',
      'Tanaab-based package fixture. Use to verify installed skill scaffolding.',
      '--openclaw-emoji',
      '📦',
      '--openclaw-homepage',
      'https://github.com/tanaabased/canon',
      '--container',
      'standalone',
      '--namespace',
      'tanaab',
      '--output-dir',
      fixtureRoot,
    ]);
    run(root, 'skills/skill-author/scripts/validate-skill.js', [
      '--skill-dir',
      path.join(fixtureRoot, 'tanaab-package-smoke'),
    ]);
    const forms = JSON.parse(
      run(root, 'skills/github-issue-form-author/scripts/render-issue-forms.js', [
        'render',
        '--repository-mode',
        'organization',
        '--json',
      ]),
    );
    assert.equal(forms.files.length, 4, 'Packed issue-form renderer must produce all four forms');
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
  return { name: pkg.name, version: pkg.version, skills: names.length, commands };
}

function run(root, script, args) {
  const result = spawnSync(
    process.execPath,
    ['--no-install', path.resolve(root, script), ...args],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      `${path.relative(root, script)} failed: ${result.error?.message || result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}
