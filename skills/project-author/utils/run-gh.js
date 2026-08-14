import runGitHubCli from '../../../lib/run-github-cli.js';

/**
 * Runs the internal `gh` process boundary without shell interpolation.
 *
 * @param {string[]} args GitHub CLI arguments.
 * @param {{input?: string}} [options] Optional standard input.
 * @param {{spawnSync?: Function}} [dependencies] Injectable process boundary for tests.
 * @returns {{error: Error | null, status: number, stderr: string, stdout: string}} Command result.
 */
export default function runGh(args, options = {}, dependencies = {}) {
  const result = runGitHubCli(
    args,
    {
      input: options.input,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
    dependencies,
  );

  return {
    error: result.error ?? null,
    status: result.status ?? 1,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}
