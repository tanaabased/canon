import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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
  for (const name of names) {
    const result = await validateSkillDir(path.join(root, 'skills', name), {
      namespace: 'tanaab',
      container: 'codex-plugin',
    });
    assert.deepEqual(result.errors, [], `${name}: broken packed skill or resource`);
  }

  return { name: pkg.name, version: pkg.version, skills: names.length };
}
