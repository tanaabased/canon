import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import resolveSkillContainer from '../utils/resolve-skill-container.js';

describe('skills/skill-author/utils/resolve-skill-container', () => {
  it('should honor overrides and detect containing OpenClaw plugins', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'canon-skill-container-'));
    const skillDir = path.join(rootDir, 'skills', 'github-cli');

    try {
      await mkdir(skillDir, { recursive: true });
      await writeFile(path.join(rootDir, 'openclaw.plugin.json'), '{}\n');

      assert.equal(await resolveSkillContainer(skillDir), 'openclaw-plugin');
      assert.equal(await resolveSkillContainer(skillDir, 'standalone'), 'standalone');
      await assert.rejects(
        resolveSkillContainer(skillDir, 'unknown'),
        /standalone, codex-plugin, openclaw-plugin/,
      );
    } finally {
      await rm(rootDir, { force: true, recursive: true });
    }
  });
});
