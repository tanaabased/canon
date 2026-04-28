import { collectEntries, syncEntries } from './codexsync-cache.js';
import { pathExists } from './codexsync-context.js';
import { hasDiff, summarizeDiff } from './codexsync-diff.js';
import { fail, note, success } from './bun-cli-support.js';
import { printDiffDetails, printPaths } from './codexsync-check.js';

/**
 * Copies the source repo into the managed plugin cache and verifies the final
 * cache state against the original source snapshot before reporting success.
 *
 * @param {object} context
 * @param {string} context.cachePath Managed plugin cache path to mutate.
 * @param {string} context.repoRoot Source repository root.
 * @returns {Promise<boolean>} True when the post-sync cache matches the source.
 */
export async function runSync({ cachePath, repoRoot }) {
  const sourceEntries = await collectEntries(repoRoot);
  const targetEntries = (await pathExists(cachePath)) ? await collectEntries(cachePath) : new Map();
  const postSyncDiff = await syncEntries({
    sourceRoot: repoRoot,
    targetRoot: cachePath,
    sourceEntries,
    targetEntries,
  });

  printPaths({ repoRoot, cachePath });

  if (hasDiff(postSyncDiff)) {
    fail(`cache sync did not converge (${summarizeDiff(postSyncDiff)})`);
    printDiffDetails(postSyncDiff);
    return false;
  }

  success('cache copy synced');
  note('restart or reinstall Codex if refreshed plugin surfaces do not appear immediately');
  return true;
}
