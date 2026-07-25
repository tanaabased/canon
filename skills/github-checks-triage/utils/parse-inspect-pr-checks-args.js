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
 * Parses the internal GitHub checks inspection command arguments.
 *
 * @param {string[]} argv Raw argument tokens.
 * @returns {object} Parsed inspection options.
 */
export default function parseInspectPrChecksArgs(argv) {
  const parsed = {
    context: DEFAULT_CONTEXT_LINES,
    json: false,
    maxLines: DEFAULT_MAX_LINES,
    pr: null,
    repo: '.',
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
      throw new Error(`Positional arguments are not supported: ${arg}`);
    }

    const [rawKey, inlineValue] = arg.split(/=(.*)/s, 2);
    const key = rawKey.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const value = inlineValue ?? argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${rawKey}`);
    }

    if (key === 'repo' || key === 'pr') parsed[key] = value;
    else if (key === 'maxLines') parsed.maxLines = parsePositiveInteger(value, '--max-lines');
    else if (key === 'context') parsed.context = parsePositiveInteger(value, '--context');
    else throw new Error(`Unknown option: ${rawKey}`);

    if (inlineValue === undefined) index += 1;
  }

  return parsed;
}
