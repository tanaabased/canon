/** Parse the read-only inspector's intentionally small argument surface. */
export default function parseTaskDecomposerArgs(argv) {
  const parsed = { json: false, target: null };
  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') parsed.help = true;
    else if (arg === '--json') parsed.json = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (parsed.target) throw new Error('Only one task target may be inspected.');
    else parsed.target = arg;
  }
  if (!parsed.help && !parsed.target) {
    throw new Error('An explicit OWNER/REPO#NUMBER task target is required.');
  }
  return parsed;
}
