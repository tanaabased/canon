import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { checkPluginInfo, writePluginInfo } from '../lib/plugin-info.js';

describe('lib/plugin-info', () => {
  it('refreshes release metadata and detects stale inventory in the package', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'canon-plugin-info-'));
    const infoFile = path.join(root, 'skills/plugin-info/references/plugin-info.json');
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
      await mkdir(path.dirname(infoFile), { recursive: true });
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
      await writePluginInfo(root);
      await checkPluginInfo(root);

      await writeFile(pkgPath, JSON.stringify({ ...pkg, version: '0.15.5' }));
      await writeFile(pluginPath, JSON.stringify({ ...plugin, version: '0.15.5' }));
      await assert.rejects(checkPluginInfo(root), /does not match/);
      await writePluginInfo(root);
      await checkPluginInfo(root);

      await writeFile(skill, '---\nname: tanaab-zulu\ndescription: New description.\n---\n');
      await assert.rejects(checkPluginInfo(root), /does not match/);
      await writePluginInfo(root);
      await checkPluginInfo(root);
      const info = JSON.parse(await readFile(infoFile, 'utf8'));
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
