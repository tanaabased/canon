import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import path from 'node:path';

import { collectPluginInfo } from '../lib/plugin-info.js';
import { checkCloudSkill } from '../node_modules/@tanaab/codex-tools/lib/cloud-check.ts';
import { cloudProject } from '../node_modules/@tanaab/codex-tools/lib/cloud-config.ts';

const [directory, ...extra] = process.argv.slice(2);
if (!directory || directory.startsWith('-') || extra.length) {
  throw new Error('Usage: bun run check:package <extracted-package-directory>');
}

const root = await realpath(directory);
const project = await cloudProject('cloud.config.js', 'cloud verify');
for (const skill of project.skills) await checkCloudSkill(project, skill, root);
const pluginInfo = execFileSync(
  process.execPath,
  ['--no-install', path.join(root, 'skills/plugin-info/scripts/plugin-info.js')],
  { cwd: root, encoding: 'utf8' },
);
assert.deepEqual(
  JSON.parse(pluginInfo),
  await collectPluginInfo(root),
  'The plugin info command must report the packed manifests and shipped skills.',
);
process.stdout.write(`Verified ${project.skills.length} skills in the extracted package.\n`);
