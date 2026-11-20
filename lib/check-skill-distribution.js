import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import extractRelativeMarkdownLinks from '../utils/extract-relative-markdown-links.js';

export default async function checkSkillDistribution(skill, version, expected) {
  const inventory = JSON.parse(await readFile(path.join(skill, 'runtime-files.json'), 'utf8'));
  assert.equal(inventory.version, version, 'Command inventory version differs from the package');
  assert.equal(inventory.runtime, 'bun');
  assert.ok(expected.length > 0, 'Skill has no packaged entrypoints');
  assert.deepEqual(inventory.commands.map((command) => command.path).sort(), [...expected].sort());
  for (const command of inventory.commands) {
    assert.ok(
      !path.isAbsolute(command.path) && !command.path.split('/').includes('..'),
      `Invalid command path: ${command.path}`,
    );
    for (const file of [command, ...(command.resources ?? [])]) {
      assert.equal(
        path.posix.dirname(file.path),
        path.posix.dirname(command.path),
        `Unexpected runtime file path: ${file.path}`,
      );
      const bytes = await readFile(path.join(skill, file.path));
      assert.equal(bytes.length, file.bytes, `Incorrect byte length: ${file.path}`);
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        file.sha256,
        `Incorrect hash: ${file.path}`,
      );
    }
  }

  await checkSkillResources(skill);
}

export async function checkSkillResources(skill) {
  const files = await readdir(skill, { recursive: true, withFileTypes: true });
  for (const entry of files) {
    assert.ok(!entry.isSymbolicLink(), `Unexpected packaged symlink: ${entry.name}`);
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const contents = await readFile(path.join(entry.parentPath, entry.name), 'utf8');
    const prose = contents.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
    const isTemplate = path.relative(skill, entry.parentPath).split(path.sep)[0] === 'templates';
    for (const link of extractRelativeMarkdownLinks(prose)) {
      if (isTemplate && /^[A-Z][A-Z0-9_]*_URL$/.test(link)) continue;
      const target = path.resolve(entry.parentPath, link.split('#')[0]);
      assert.ok(
        target === skill || target.startsWith(`${skill}${path.sep}`),
        `Resource escapes the packaged skill: ${entry.name} → ${link}`,
      );
      const source = path.relative(path.dirname(skill), path.join(entry.parentPath, entry.name));
      assert.ok((await stat(target)).isFile(), `Link a concrete file: ${source} → ${link}`);
      const resource = path.relative(skill, target).split(path.sep);
      if (
        ['references', 'templates'].includes(resource[0]) &&
        /\.(?:ya?ml|ps1|vue)$|^\.prettierignore$/i.test(path.basename(target))
      ) {
        throw new Error(`Link an annotated references/*-example.md starter: ${source} → ${link}`);
      }
    }
  }
}
