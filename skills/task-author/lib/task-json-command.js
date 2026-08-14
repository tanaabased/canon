import { readFileSync } from 'node:fs';

export const TASK_JSON_INPUT_GUIDANCE = `Agents should prefer --input - and send JSON through standard input.
If standard input is unavailable, use a repository-local ignored scratch path under the
active workspace only after verifying the intended path with git check-ignore. Do not use an
operating-system or user-level temporary directory for request JSON.`;

/** Run one JSON-in/JSON-out Task Author command. */
export function runTaskJsonCommand(
  argv,
  { errorPrefix, execute, failureStatuses = [], usage },
  { readFile = readFileSync, stderr = process.stderr, stdout = process.stdout } = {},
) {
  try {
    if (argv.includes('--help') || argv.includes('-h')) {
      stdout.write(`${usage()}\n`);
      return 0;
    }
    const inputIndex = argv.indexOf('--input');
    if (inputIndex === -1 || !argv[inputIndex + 1]) {
      throw new Error('--input <path|-> is required.');
    }
    const inputPath = argv[inputIndex + 1];
    const source = inputPath === '-' ? readFile(0, 'utf8') : readFile(inputPath, 'utf8');
    const result = execute(JSON.parse(source));
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return failureStatuses.includes(result.status) ? 1 : 0;
  } catch (error) {
    stderr.write(`${errorPrefix}: ${error.message}\n`);
    return 1;
  }
}
