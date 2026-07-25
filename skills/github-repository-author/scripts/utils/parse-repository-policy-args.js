/**
 * Parses the skill-local repository-policy command contract.
 *
 * @param {string[]} argv Arguments without the executable path.
 * @returns {{command: string | null, help: boolean, initialize: boolean, json: boolean,
 *   renameDefault: boolean, slug: string | null}} Parsed command options.
 * @throws {Error} When command, positionals, or option combinations are unsupported.
 */
export default function parseRepositoryPolicyArgs(argv) {
  const positionals = [];
  const options = {
    help: false,
    initialize: false,
    json: false,
    renameDefault: false,
  };

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--initialize') {
      options.initialize = true;
      continue;
    }
    if (arg === '--rename-default') {
      options.renameDefault = true;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positionals.push(arg);
  }

  if (options.help) {
    return {
      ...options,
      command: positionals[0] ?? null,
      slug: positionals[1] ?? null,
    };
  }
  if (positionals.length !== 2) {
    throw new Error('Expected one command and one explicit OWNER/REPO slug.');
  }

  const [command, slug] = positionals;
  if (!['apply', 'create', 'inspect'].includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }
  if (command !== 'apply' && (options.initialize || options.renameDefault)) {
    throw new Error('--initialize and --rename-default are valid only with apply.');
  }

  return {
    ...options,
    command,
    slug,
  };
}
