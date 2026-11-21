import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Glob } from 'bun';

import parseSkillFrontmatter from '../utils/parse-skill-frontmatter.js';

async function readJson(root, relative) {
  return JSON.parse(await readFile(path.join(root, relative), 'utf8'));
}

export async function collectPluginInfo(root = path.resolve(import.meta.dir, '..')) {
  const [pkg, plugin] = await Promise.all([
    readJson(root, 'package.json'),
    readJson(root, '.codex-plugin/plugin.json'),
  ]);
  if (pkg.version !== plugin.version) {
    throw new Error('Canon package and Codex plugin versions must match.');
  }

  const documents = Array.from(new Glob('skills/*/SKILL.md').scanSync({ cwd: root }));
  const skills = await Promise.all(
    documents.map(async (file) => {
      const skill = parseSkillFrontmatter(await readFile(path.join(root, file), 'utf8'));
      if (!skill?.name || !skill.description) {
        throw new Error(`${file}: expected a skill name and description in frontmatter.`);
      }
      return { name: skill.name, description: skill.description };
    }),
  );
  skills.sort((left, right) => left.name.localeCompare(right.name, 'en'));

  return {
    package: { name: pkg.name, version: pkg.version },
    plugin: {
      id: plugin.name,
      name: plugin.interface.displayName,
      author: plugin.author.name,
      repository: plugin.repository,
    },
    skills,
  };
}
