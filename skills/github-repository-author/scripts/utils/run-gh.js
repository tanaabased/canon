import { spawnSync } from 'node:child_process';

/**
 * Runs `gh` synchronously without shell interpolation.
 *
 * @param {string[]} args GitHub CLI arguments.
 * @param {{input?: string}} [options] Optional standard input.
 * @param {{spawnSync?: typeof spawnSync}} [dependencies] Injectable process boundary for tests.
 * @returns {{error: Error | null, status: number, stderr: string, stdout: string}} Command result.
 */
export default function runGh(args, options = {}, dependencies = {}) {
  const spawn = dependencies.spawnSync ?? spawnSync;
  const result = spawn('gh', args, {
    encoding: 'utf8',
    input: options.input,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return {
    error: result.error ?? null,
    status: result.status ?? 1,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}
