import { collectEntries, syncEntries } from './codexsync-cache.js';
import { pathExists } from './codexsync-context.js';
import { hasDiff, summarizeDiff } from './codexsync-diff.js';
import { fail, note, success } from './bun-cli-support.js';
import { printDiffDetails, printPaths } from './codexsync-check.js';

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
