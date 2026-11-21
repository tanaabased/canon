import { cloudProject } from '../node_modules/@tanaab/codex-tools/lib/cloud-config.ts';
import { packageCloudSkills } from '../node_modules/@tanaab/codex-tools/lib/package-cloud-skills.ts';

if (process.env.CI !== 'true' || process.argv.length !== 2) {
  throw new Error('Run bun run build:plugin with no arguments in a disposable CI checkout.');
}

const project = await cloudProject('cloud.config.js');
const tracked = [...project.tracked];
const shared = tracked.filter((file) => /^(references|templates)\//.test(file));
for (const skill of project.skills) {
  if (!skill.configured)
    throw new Error(`${skill.dir}/build.config.js: required for Canon skills.`);
  const copies = new Set(skill.copies);
  const missingCopy = shared.find((file) => !copies.has(file));
  if (missingCopy) {
    throw new Error(
      `${skill.dir}/build.config.js: shared resource is not selected: ${missingCopy}`,
    );
  }
  const entries = new Set(skill.entries.map((entry) => `${skill.dir}/${entry}`));
  const uncovered = tracked.find(
    (file) => file.startsWith(`${skill.dir}/scripts/`) && !entries.has(file),
  );
  if (uncovered) {
    throw new Error(`${skill.dir}/build.config.js: command must match entrypoints: ${uncovered}`);
  }
}
const skills = await packageCloudSkills(project, process.env);
process.stdout.write(`Packaged ${skills.length} skills.\n`);
