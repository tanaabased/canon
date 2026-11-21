import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
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
const [sourceInfo, packedInfo, openClaw] = await Promise.all([
  collectPluginInfo(project.root),
  collectPluginInfo(root),
  readFile(path.join(root, 'openclaw.plugin.json'), 'utf8').then(JSON.parse),
]);
assert.deepEqual(
  packedInfo,
  sourceInfo,
  'Package metadata and skills must match the prepared checkout.',
);
assert.equal(openClaw.id, packedInfo.plugin.id, 'OpenClaw and Codex plugin IDs must match.');
assert.equal(openClaw.version, packedInfo.package.version, 'OpenClaw and npm versions must match.');
assert.deepEqual(openClaw.skills, ['./skills'], 'OpenClaw must expose the shared skills.');
const pluginInfo = execFileSync(
  process.execPath,
  ['--no-install', path.join(root, 'skills/plugin-info/scripts/plugin-info.js')],
  { cwd: root, encoding: 'utf8' },
);
assert.deepEqual(
  JSON.parse(pluginInfo),
  packedInfo,
  'The plugin info command must report the packed manifests and shipped skills.',
);
process.stdout.write(`Verified ${project.skills.length} skills in the extracted package.\n`);
