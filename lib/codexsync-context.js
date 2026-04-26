import { readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, '..');
export const CLI_NAME = 'codexsync';
export const COMMANDS = ['check', 'validate', 'sync'];
export const MANAGED_PATH_IGNORE_NAMES = new Set(['.DS_Store', '.git', 'node_modules']);
export const MAX_DIFF_PREVIEW = 5;

export async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(targetPath) {
  return JSON.parse(await readFile(targetPath, 'utf8'));
}

export async function resolveCodexsyncContext({ repoRoot = DEFAULT_REPO_ROOT, cachePathOverride = null } = {}) {
  const packageJson = await readJson(path.join(repoRoot, 'package.json'));
  const pluginJson = await readJson(path.join(repoRoot, '.codex-plugin', 'plugin.json'));

  return {
    cachePath:
      cachePathOverride ??
      path.join(os.homedir(), '.codex', 'plugins', 'cache', 'pirostore', pluginJson.name, packageJson.version),
    packageJson,
    pluginJson,
    repoRoot,
  };
}

export async function getScriptVersion(repoRoot = DEFAULT_REPO_ROOT) {
  const packageJson = await readJson(path.join(repoRoot, 'package.json'));
  return packageJson.version;
}
