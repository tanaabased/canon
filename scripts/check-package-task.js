import { realpath } from 'node:fs/promises';

import { checkPluginInfo } from '../lib/plugin-info.js';
import { checkCloudSkill } from '../node_modules/@tanaab/codex-tools/lib/cloud-check.ts';
import { cloudProject } from '../node_modules/@tanaab/codex-tools/lib/cloud-config.ts';

const [directory, ...extra] = process.argv.slice(2);
if (!directory || directory.startsWith('-') || extra.length) {
  throw new Error('Usage: bun run check:package <extracted-package-directory>');
}

const root = await realpath(directory);
const project = await cloudProject('cloud.config.js', 'cloud verify');
for (const skill of project.skills) await checkCloudSkill(project, skill, root);
await checkPluginInfo(root);
process.stdout.write(`Verified ${project.skills.length} skills in the extracted package.\n`);
