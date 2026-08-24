/**
 * Parses the read-only milestone planning evidence command arguments.
 *
 * @param {string[]} argv Raw argument tokens.
 * @returns {{help?: boolean, json: boolean, milestone: string | null}} Parsed options.
 */
export default function parseMilestonePlannerArgs(argv) {
  const parsed = { json: false, milestone: null };

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '--json') {
      parsed.json = true;
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
