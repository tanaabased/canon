import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  cloudConfig,
  runCloud,
  snapshotCheckout,
  sourceRoot,
  trackedFiles,
} from './package-source.js';
import pathExists from '../utils/path-exists.js';

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const requiredCopies = ['references/**', 'templates/**'];
const executionFragment = 'templates/packaged-command-execution.md';

async function verifySkills(checkout, root) {
  const files = new Set(trackedFiles(checkout));
  const names = [...files]
    .filter((file) => /^skills\/[^/]+\/SKILL\.md$/.test(file))
    .map((file) => file.split('/')[1])
    .sort();
  const packed = await readdir(path.join(root, 'skills'), { withFileTypes: true });
  assert.deepEqual(
    packed
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(),
    names,
    'Packed skill inventory differs from source',
  );

  for (const name of names) {
    const configPath = `skills/${name}/build.config.js`;
    assert(files.has(configPath), `Missing tracked skill config: ${configPath}`);
    const { default: config } = await import(pathToFileURL(path.join(checkout, configPath)).href);
    const copies = Array.isArray(config?.copy) ? config.copy : [];
    for (const pattern of requiredCopies) {
      assert(copies.includes(pattern), `${configPath}: missing copy declaration ${pattern}`);
    }
  }

  runCloud(checkout, 'verify', cloudConfig, '--package', root);

  const { validateSkillDir } = await import(
    pathToFileURL(path.join(root, 'skills/skill-author/lib/skill-validator.js')).href
  );
  for (const name of names) {
    const prefix = `skills/${name}/`;
    const skill = path.join(root, prefix);
    assert.equal(
      await pathExists(path.join(skill, executionFragment)),
      false,
      `${prefix}${executionFragment} is build-only`,
    );
    const scripts = [...files].filter((file) => file.startsWith(`${prefix}scripts/`));
    if (scripts.length) {
      // The shared verifier has already checked that this inventory matches the entrypoint globs.
      const inventory = path.join(skill, 'runtime-files.json');
      const { commands } = (await pathExists(inventory))
        ? await readJson(inventory)
        : { commands: [] };
      const covered = new Set(commands.map((command) => prefix + command.path));
      for (const script of scripts) {
        assert(covered.has(script), `${script}: missing from build.config.js entrypoints`);
      }
    }
    const { errors } = await validateSkillDir(skill, {
      namespace: 'tanaab',
      container: 'codex-plugin',
    });
    assert.deepEqual(errors, [], `${name}: broken packed skill metadata or structure`);
  }
  return names.length;
}

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

  assert.equal(
    await pathExists(path.join(root, executionFragment)),
    false,
    `${executionFragment} is build-only`,
  );
  const checkout = await mkdtemp(path.join(tmpdir(), 'canon-verify-'));
  try {
    await snapshotCheckout(sourceRoot, checkout);
    const skills = await verifySkills(checkout, root);
    return { name: pkg.name, version: pkg.version, skills };
  } finally {
    await rm(checkout, { recursive: true, force: true });
  }
}
