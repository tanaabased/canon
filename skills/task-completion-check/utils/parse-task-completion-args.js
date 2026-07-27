export const DEFAULT_MAX_LINES = 160;
export const DEFAULT_CONTEXT_LINES = 30;

function parsePositiveInteger(rawValue, optionName) {
  const value = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return value;
}

/**
 * Parses the internal Task completion inspection command arguments.
 *
 * @param {string[]} argv Raw argument tokens.
 * @returns {object} Parsed inspection options.
 */
export default function parseTaskCompletionArgs(argv) {
  const parsed = {
    context: DEFAULT_CONTEXT_LINES,
    json: false,
    maxLines: DEFAULT_MAX_LINES,
    prs: [],
    task: null,
  };

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
    if (!arg.startsWith('--')) {
      if (parsed.task) throw new Error(`Unexpected positional argument: ${arg}`);
      parsed.task = arg;
      continue;
    }

    const [rawKey, inlineValue] = arg.split(/=(.*)/s, 2);
    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${rawKey}`);
    }

    if (rawKey === '--pr') parsed.prs.push(value);
    else if (rawKey === '--max-lines') {
      parsed.maxLines = parsePositiveInteger(value, '--max-lines');
    } else if (rawKey === '--context') {
      parsed.context = parsePositiveInteger(value, '--context');
    } else throw new Error(`Unknown option: ${rawKey}`);

    if (inlineValue === undefined) index += 1;
  }

  if (!parsed.help && !parsed.task) {
    throw new Error('Task is required as a GitHub Issue URL or OWNER/REPO#NUMBER.');
  }
  return parsed;
}
