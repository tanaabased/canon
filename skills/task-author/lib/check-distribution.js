import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import config from '../build.config.js';
import extractRelativeMarkdownLinks from '../../../utils/extract-relative-markdown-links.js';

export default async function checkTaskAuthorDistribution(skill, version) {
  const inventory = JSON.parse(await readFile(path.join(skill, 'runtime-files.json'), 'utf8'));
  assert.equal(
    inventory.version,
    version,
    'Task Author inventory version differs from the package',
  );
  assert.equal(inventory.runtime, 'bun');
  const entries = await readdir(path.join(skill, config.entrypointDirectory));
  const expected = entries
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.posix.join(config.entrypointDirectory, file))
    .sort();
  assert.ok(expected.length > 0, 'Task Author has no packaged entrypoints');
  assert.deepEqual(inventory.commands.map((command) => command.path).sort(), expected);
  for (const command of inventory.commands) {
    const bytes = await readFile(path.join(skill, command.path));
    assert.equal(bytes.length, command.bytes, `Incorrect byte length: ${command.path}`);
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      command.sha256,
      `Incorrect hash: ${command.path}`,
    );
  }

  const files = await readdir(skill, { recursive: true, withFileTypes: true });
  for (const entry of files) {
    assert.ok(!entry.isSymbolicLink(), `Unexpected packaged symlink: ${entry.name}`);
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const contents = await readFile(path.join(entry.parentPath, entry.name), 'utf8');
    const prose = contents.replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
    for (const link of extractRelativeMarkdownLinks(prose)) {
      const target = path.resolve(entry.parentPath, link.split('#')[0]);
      assert.ok(
        target === skill || target.startsWith(`${skill}${path.sep}`),
        `Resource escapes the packaged skill: ${entry.name} → ${link}`,
      );
      await stat(target);
    }
  }
}
