import { cloudProject } from '../node_modules/@tanaab/codex-tools/lib/cloud-config.ts';
import { packageCloudSkills } from '../node_modules/@tanaab/codex-tools/lib/package-cloud-skills.ts';

if (process.env.CI !== 'true' || process.argv.length !== 2) {
  throw new Error('Run bun run build:plugin with no arguments in a disposable CI checkout.');
}

const project = await cloudProject('cloud.config.js');
const skills = await packageCloudSkills(project, process.env);
process.stdout.write(`Packaged ${skills.length} skills.\n`);
