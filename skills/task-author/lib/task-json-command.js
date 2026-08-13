import { readFileSync } from 'node:fs';

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
