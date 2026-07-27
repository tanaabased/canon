import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import pathExists from './path-exists.js';

/**
 * Recursively collects matching files beneath one path in stable order.
 *
 * @param {string} targetPath File or directory to inspect.
 * @param {(filePath: string) => boolean} predicate File-selection predicate.
 * @param {string[]} [files=[]] Existing accumulator for recursive calls.
 * @returns {Promise<string[]>} Matching file paths.
 */
export default async function collectFiles(targetPath, predicate, files = []) {
  if (!(await pathExists(targetPath))) {
    return files;
  }

  const targetStat = await stat(targetPath);
  if (targetStat.isFile()) {
    if (predicate(targetPath)) {
      files.push(targetPath);
    }
    return files;
  }

  if (!targetStat.isDirectory()) {
    return files;
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    await collectFiles(path.join(targetPath, entry.name), predicate, files);
  }

  return files;
}
