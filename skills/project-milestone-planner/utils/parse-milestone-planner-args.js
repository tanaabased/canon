/**
 * Parses the read-only milestone planning evidence command arguments.
 *
 * @param {string[]} argv Raw argument tokens.
 * @returns {{help?: boolean, input: string | null, json: boolean, milestone: string | null}} Parsed options.
 */
export default function parseMilestonePlannerArgs(argv) {
  const parsed = { input: null, json: false, milestone: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '--json') {
      parsed.json = true;
      continue;
    }
    if (arg === '--input') {
      if (!argv[index + 1]) throw new Error('--input requires a path or -.');
      parsed.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    if (parsed.milestone) throw new Error(`Unexpected positional argument: ${arg}`);
    parsed.milestone = arg;
  }

  if (!parsed.help && !parsed.milestone) {
    throw new Error('A milestone is required as a GitHub milestone URL or OWNER/REPO#NUMBER.');
  }
  return parsed;
}
