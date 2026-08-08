import path from 'node:path';

import pathExists from '../../../utils/path-exists.js';
import { SKILL_CONTAINER_IDS, formatSkillContainerIds } from './skill-identity.js';

/**
 * Resolves folder-policy context from an explicit override or containing plugin manifest.
 *
 * @param {string} startPath Skill directory or parent directory to inspect.
 * @param {unknown} override Explicit standalone, Codex-plugin, or OpenClaw-plugin context.
 * @returns {Promise<string>} Resolved container id.
 * @throws {Error} When an explicit override is unsupported.
 */
export default async function resolveSkillContainer(startPath, override) {
  const requested = String(override ?? '')
    .trim()
    .toLowerCase();
  if (requested) {
    if (!SKILL_CONTAINER_IDS.includes(requested)) {
      throw new Error(`Skill container must be one of: ${formatSkillContainerIds()}`);
    }
    return requested;
  }

  let currentPath = path.resolve(startPath);
  let previousPath = null;
  while (currentPath && currentPath !== previousPath) {
    if (await pathExists(path.join(currentPath, '.codex-plugin', 'plugin.json'))) {
      return 'codex-plugin';
    }
    if (await pathExists(path.join(currentPath, 'openclaw.plugin.json'))) {
      return 'openclaw-plugin';
    }
    previousPath = currentPath;
    currentPath = path.dirname(currentPath);
  }

  return 'standalone';
}
