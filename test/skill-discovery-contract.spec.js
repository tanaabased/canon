import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function liveSkillNames() {
  const entries = await readdir(path.join(repoRoot, 'skills'), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe('skill discovery contract', () => {
  it('should catalog every live skill exactly once in the README', async () => {
    const readme = await readFile(path.join(repoRoot, 'README.md'), 'utf8');
    const cataloged = [...readme.matchAll(/\(\.\/skills\/([a-z0-9-]+)\/\)/g)]
      .map((match) => match[1])
      .sort();

    assert.deepEqual(cataloged, await liveSkillNames());
  });

  it('should keep plugin starter prompts unique and limited to live skills', async () => {
    const plugin = JSON.parse(
      await readFile(path.join(repoRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
    );
    const references = plugin.interface.defaultPrompt
      .flatMap((prompt) => [...prompt.matchAll(/\$(tanaab-[a-z0-9-]+)/g)])
      .map((match) => match[1]);
    const liveIds = new Set((await liveSkillNames()).map((name) => `tanaab-${name}`));

    assert.equal(references.length, plugin.interface.defaultPrompt.length);
    assert.equal(new Set(references).size, references.length);
    assert.ok(references.every((name) => liveIds.has(name)));
  });
});
