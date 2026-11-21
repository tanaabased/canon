import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { collectPluginInfo } from '../lib/plugin-info.js';

describe('lib/plugin-info', () => {
  it('reads the current manifest version and sorts the shipped skill inventory by name', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'canon-plugin-info-'));
    const skill = path.join(root, 'skills/alpha/SKILL.md');
    const pkg = { name: '@tanaab/canon', version: '0.15.4' };
    const plugin = {
      name: 'tanaab',
      version: pkg.version,
      interface: { displayName: 'Canon' },
      author: { name: 'Tanaab' },
      repository: 'https://example.com/canon',
    };

    try {
      await mkdir(path.join(root, 'skills/plugin-info'), { recursive: true });
      await mkdir(path.dirname(skill), { recursive: true });
      await mkdir(path.join(root, '.codex-plugin'));
      const pkgPath = path.join(root, 'package.json');
      const pluginPath = path.join(root, '.codex-plugin/plugin.json');
      await writeFile(pkgPath, JSON.stringify(pkg));
      await writeFile(pluginPath, JSON.stringify(plugin));
      await writeFile(skill, '---\nname: tanaab-zulu\ndescription: First description.\n---\n');
      await writeFile(
        path.join(root, 'skills/plugin-info/SKILL.md'),
        '---\nname: tanaab-plugin-info\ndescription: Report plugin info.\n---\n',
      );
      const initial = await collectPluginInfo(root);
      assert.equal(initial.package.version, '0.15.4');
      assert.equal(initial.skills[1].description, 'First description.');

      await writeFile(pkgPath, JSON.stringify({ ...pkg, version: '0.15.5' }));
      await assert.rejects(collectPluginInfo(root), /versions must match/);
      await writeFile(pluginPath, JSON.stringify({ ...plugin, version: '0.15.5' }));

      await writeFile(skill, '---\nname: tanaab-zulu\ndescription: New description.\n---\n');
      const info = await collectPluginInfo(root);
      assert.deepEqual(info.package, { name: '@tanaab/canon', version: '0.15.5' });
      assert.deepEqual(info.plugin, {
        id: 'tanaab',
        name: 'Canon',
        author: 'Tanaab',
        repository: 'https://example.com/canon',
      });
      assert.deepEqual(info.skills, [
        { name: 'tanaab-plugin-info', description: 'Report plugin info.' },
        { name: 'tanaab-zulu', description: 'New description.' },
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
