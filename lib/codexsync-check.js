import { collectEntries } from './codexsync-cache.js';
import { pathExists } from './codexsync-context.js';
import { diffEntries, hasDiff, previewPaths, summarizeDiff } from './codexsync-diff.js';
import { fail, success, writeLine } from './bun-cli-support.js';

export function printDiffDetails(diff, stream = process.stderr) {
  for (const [label, paths] of [
    ['changed', diff.changed],
    ['missing', diff.missing],
    ['extra', diff.extra],
  ]) {
    const preview = previewPaths(paths);
    if (preview.length === 0) {
      continue;
    }

    writeLine(stream, `${label}:`);
    for (const entry of preview) {
      writeLine(stream, `  ${entry}`);
    }
  }
}

export function printPaths({ cachePath, repoRoot }, stream = process.stdout) {
  writeLine(stream, `repo: ${repoRoot}`);
  writeLine(stream, `cache: ${cachePath}`);
}

/**
 * Compares the source repo to the managed plugin cache and returns a boolean
 * success value instead of exiting, so the CLI wrapper owns process behavior.
 *
 * @param {object} context
 * @param {string} context.cachePath Managed plugin cache path to compare.
 * @param {string} context.repoRoot Source repository root.
 * @returns {Promise<boolean>} True when the cache matches the source.
 */
export async function runCheck({ cachePath, repoRoot }) {
  const sourceEntries = await collectEntries(repoRoot);
  const cacheExists = await pathExists(cachePath);
  const cacheEntries = cacheExists ? await collectEntries(cachePath) : new Map();
  const diff = cacheExists
    ? diffEntries(sourceEntries, cacheEntries)
    : { changed: [], extra: [], missing: [...sourceEntries.keys()] };

  printPaths({ repoRoot, cachePath });

  if (!hasDiff(diff)) {
    return success('cache copy matches source');
  }

  fail(`cache drift detected (${summarizeDiff(diff)})`);
  printDiffDetails(diff);
  return false;
}
