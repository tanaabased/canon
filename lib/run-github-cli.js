import { spawnSync } from 'node:child_process';

const INHERITED_PROCESS_OPTIONS = ['cwd', 'env'];

/**
 * Run the host-provided bare gh command while preserving harness routing.
 *
 * @param {string[]} args GitHub CLI arguments.
 * @param {object} [options] Spawn options other than cwd or env.
 * @param {{spawnSync?: typeof spawnSync}} [dependencies] Injectable process boundary for tests.
 * @returns {ReturnType<typeof spawnSync>} Unmodified process result.
 */
export default function runGitHubCli(args, options = {}, dependencies = {}) {
  for (const key of INHERITED_PROCESS_OPTIONS) {
    if (Object.hasOwn(options, key)) {
      throw new Error(`GitHub CLI must inherit the active process ${key}.`);
    }
  }

  const spawn = dependencies.spawnSync ?? spawnSync;
  return spawn('gh', args, { encoding: 'utf8', ...options });
}
