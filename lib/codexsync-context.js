import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import readJson from '../utils/read-json.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '..');
export const CLI_NAME = 'codexsync';
export const COMMANDS = ['check', 'validate', 'sync'];
export const MANAGED_PATH_IGNORE_NAMES = new Set(['.DS_Store', '.git', 'node_modules']);

/**
 * Resolves source and managed-cache locations from repo metadata. The default
 * cache path mirrors Codex's plugin cache layout and is versioned from package.json.
 *
 * @param {object} [options]
 * @param {string} [options.repoRoot=DEFAULT_REPO_ROOT] Source repository root.
 * @param {string | null} [options.cachePathOverride=null] Explicit managed cache path.
 * @returns {Promise<{cachePath: string, packageJson: object, pluginJson: object, repoRoot: string}>} Resolved context.
 */
export async function resolveCodexsyncContext({
  repoRoot = DEFAULT_REPO_ROOT,
  cachePathOverride = null,
} = {}) {
  const packageJson = await readJson(path.join(repoRoot, 'package.json'));
  const pluginJson = await readJson(path.join(repoRoot, '.codex-plugin', 'plugin.json'));

  return {
    cachePath:
      cachePathOverride ??
      path.join(
        os.homedir(),
        '.codex',
        'plugins',
        'cache',
        'pirostore',
        pluginJson.name,
        packageJson.version,
      ),
    packageJson,
    pluginJson,
    repoRoot,
  };
}

/**
 * Reports the CLI version from the source package instead of hard-coding it in
 * the executable wrapper.
 *
 * @param {string} [repoRoot=DEFAULT_REPO_ROOT] Source repository root.
 * @returns {Promise<string>} Package version string.
 */
export async function getScriptVersion(repoRoot = DEFAULT_REPO_ROOT) {
  const packageJson = await readJson(path.join(repoRoot, 'package.json'));
  return packageJson.version;
}
