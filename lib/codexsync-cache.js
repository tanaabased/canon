import { chmod, cp, mkdir, readFile, readdir, readlink, rm, stat, symlink } from 'node:fs/promises';
import path from 'node:path';

import { MANAGED_PATH_IGNORE_NAMES } from './codexsync-context.js';
import { diffEntries } from './codexsync-diff.js';

export async function collectEntries(rootDir, currentRelativePath = '', entryMap = new Map()) {
  const currentDir = currentRelativePath ? path.join(rootDir, currentRelativePath) : rootDir;
  const dirents = await readdir(currentDir, { withFileTypes: true });

  for (const dirent of dirents.sort((left, right) => left.name.localeCompare(right.name))) {
    if (MANAGED_PATH_IGNORE_NAMES.has(dirent.name)) {
      continue;
    }

    const relativePath = currentRelativePath ? path.join(currentRelativePath, dirent.name) : dirent.name;
    const absolutePath = path.join(rootDir, relativePath);

    if (dirent.isDirectory()) {
      entryMap.set(relativePath, { type: 'dir' });
      await collectEntries(rootDir, relativePath, entryMap);
      continue;
    }

    if (dirent.isSymbolicLink()) {
      entryMap.set(relativePath, {
        type: 'symlink',
        target: await readlink(absolutePath),
      });
      continue;
    }

    if (dirent.isFile()) {
      const fileStat = await stat(absolutePath);
      entryMap.set(relativePath, {
        type: 'file',
        mode: fileStat.mode & 0o777,
        content: await readFile(absolutePath),
      });
    }
  }

  return entryMap;
}

async function ensureParentDirectory(targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
}

export async function syncEntries({ sourceRoot, targetRoot, sourceEntries, targetEntries }) {
  const diff = diffEntries(sourceEntries, targetEntries);
  const extraPaths = [...diff.extra].sort((left, right) => {
    const leftDepth = left.split(path.sep).length;
    const rightDepth = right.split(path.sep).length;
    return rightDepth - leftDepth || right.length - left.length;
  });

  for (const relativePath of extraPaths) {
    await rm(path.join(targetRoot, relativePath), { force: true, recursive: true });
  }

  const sortedEntries = [...sourceEntries.entries()].sort(([leftPath, leftEntry], [rightPath, rightEntry]) => {
    const leftDepth = leftPath.split(path.sep).length;
    const rightDepth = rightPath.split(path.sep).length;
    if (leftDepth !== rightDepth) return leftDepth - rightDepth;
    if (leftEntry.type === 'dir' && rightEntry.type !== 'dir') return -1;
    if (leftEntry.type !== 'dir' && rightEntry.type === 'dir') return 1;
    return leftPath.localeCompare(rightPath);
  });

  await mkdir(targetRoot, { recursive: true });

  for (const [relativePath, sourceEntry] of sortedEntries) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(targetRoot, relativePath);

    if (sourceEntry.type === 'dir') {
      await mkdir(targetPath, { recursive: true });
      continue;
    }

    if (sourceEntry.type === 'symlink') {
      await ensureParentDirectory(targetPath);
      await rm(targetPath, { force: true, recursive: true });
      await symlink(sourceEntry.target, targetPath);
      continue;
    }

    await ensureParentDirectory(targetPath);
    await cp(sourcePath, targetPath, { force: true });
    await chmod(targetPath, sourceEntry.mode);
  }

  const refreshedTargetEntries = await collectEntries(targetRoot);
  return diffEntries(sourceEntries, refreshedTargetEntries);
}
