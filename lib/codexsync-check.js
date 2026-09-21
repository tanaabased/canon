import hasDiff from '../utils/has-diff.js';
import previewPaths from '../utils/preview-paths.js';
import summarizeDiff from '../utils/summarize-diff.js';
import { fail, success, writeLine } from './bun-cli-support.js';
import { inspectEntries } from './codexsync-cache.js';

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
  const { diff } = await inspectEntries({ sourceRoot: repoRoot, targetRoot: cachePath });

  printPaths({ repoRoot, cachePath });

  if (!hasDiff(diff)) {
    return success('cache copy matches source');
  }

  fail(`cache drift detected (${summarizeDiff(diff)})`);
  printDiffDetails(diff);
  return false;
}
