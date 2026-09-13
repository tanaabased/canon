import {
  chmod,
  cp,
  mkdir,
  readFile,
  readdir,
  readlink,
  realpath,
  rm,
  stat,
  symlink,
} from 'node:fs/promises';
import path from 'node:path';

import diffEntries from '../utils/diff-entries.js';
import pathExists from '../utils/path-exists.js';
import { MANAGED_PATH_IGNORE_NAMES } from './codexsync-context.js';

/**
 * Builds a deterministic snapshot of a managed plugin tree. Ignored names are
 * skipped at every depth, and file entries retain mode plus raw content so cache
 * checks can catch executable-bit drift as well as text changes.
 *
 * @param {string} rootDir Root directory to snapshot.
 * @param {string} [currentRelativePath=''] Internal recursion path.
 * @param {Map<string, object>} [entryMap=new Map()] Snapshot accumulator keyed by relative path.
 * @returns {Promise<Map<string, object>>} Directory, file, and symlink entries for comparison or sync.
 */
export async function collectEntries(rootDir, currentRelativePath = '', entryMap = new Map()) {
  const currentDir = currentRelativePath ? path.join(rootDir, currentRelativePath) : rootDir;
  const dirents = await readdir(currentDir, { withFileTypes: true });

  for (const dirent of dirents.sort((left, right) => left.name.localeCompare(right.name))) {
    if (MANAGED_PATH_IGNORE_NAMES.has(dirent.name)) {
      continue;
    }

    const relativePath = currentRelativePath
      ? path.join(currentRelativePath, dirent.name)
      : dirent.name;
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

async function resolveSyncRoot(root) {
  try {
    return await realpath(root);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // Resolve existing ancestors too, so a new cache beneath a symlink cannot
    // disguise overlap with the source tree.
    const parent = path.dirname(root);
    if (parent === root) throw error;
    return path.join(await resolveSyncRoot(parent), path.basename(root));
  }
}

function containsPath(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

/**
 * Makes the target tree match the source snapshot, including deletions,
 * symlinks, file content, and file mode. Returns a fresh post-sync diff so the
 * caller can verify convergence rather than trusting copy operations blindly.
 *
 * @param {object} context Sync roots, which must resolve to disjoint trees.
 * @param {string} context.sourceRoot Source tree to copy from.
 * @param {string} context.targetRoot Target tree to mutate.
 * @returns {Promise<{changed: string[], extra: string[], missing: string[]}>} Post-sync drift report.
 */
export async function syncEntries({ sourceRoot: rawSourceRoot, targetRoot: rawTargetRoot }) {
  const sourceRoot = await resolveSyncRoot(path.resolve(rawSourceRoot));
  const targetRoot = await resolveSyncRoot(path.resolve(rawTargetRoot));
  if (containsPath(sourceRoot, targetRoot) || containsPath(targetRoot, sourceRoot)) {
    throw new Error('Cache sync requires disjoint source and target directories.');
  }

  const sourceEntries = await collectEntries(sourceRoot);
  const targetEntries = (await pathExists(targetRoot))
    ? await collectEntries(targetRoot)
    : new Map();
  const diff = diffEntries(sourceEntries, targetEntries);
  const updates = new Set([...diff.changed, ...diff.missing]);
  const extraPaths = [...diff.extra].sort((left, right) => {
    const leftDepth = left.split(path.sep).length;
    const rightDepth = right.split(path.sep).length;
    return rightDepth - leftDepth || right.length - left.length;
  });

  for (const relativePath of extraPaths) {
    await rm(path.join(targetRoot, relativePath), { force: true, recursive: true });
  }

  const sortedEntries = [...sourceEntries.entries()].sort(
    ([leftPath, leftEntry], [rightPath, rightEntry]) => {
      const leftDepth = leftPath.split(path.sep).length;
      const rightDepth = rightPath.split(path.sep).length;
      if (leftDepth !== rightDepth) return leftDepth - rightDepth;
      if (leftEntry.type === 'dir' && rightEntry.type !== 'dir') return -1;
      if (leftEntry.type !== 'dir' && rightEntry.type === 'dir') return 1;
      return leftPath.localeCompare(rightPath);
    },
  );

  await mkdir(targetRoot, { recursive: true });

  for (const [relativePath, sourceEntry] of sortedEntries) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(targetRoot, relativePath);
    const targetEntry = targetEntries.get(relativePath);

    if (targetEntry && sourceEntry.type !== targetEntry.type) {
      await rm(targetPath, { force: true, recursive: true });
    }

    if (sourceEntry.type === 'dir') {
      await mkdir(targetPath, { recursive: true });
      continue;
    }

    if (!updates.has(relativePath)) continue;

    if (sourceEntry.type === 'symlink') {
      await ensureParentDirectory(targetPath);
      await rm(targetPath, { force: true, recursive: true });
      await symlink(sourceEntry.target, targetPath);
      continue;
    }

    await ensureParentDirectory(targetPath);
    // Replace the directory entry rather than writing through a cached link.
    await rm(targetPath, { force: true });
    await cp(sourcePath, targetPath, { force: true });
    await chmod(targetPath, sourceEntry.mode);
  }

  const refreshedTargetEntries = await collectEntries(targetRoot);
  return diffEntries(sourceEntries, refreshedTargetEntries);
}
