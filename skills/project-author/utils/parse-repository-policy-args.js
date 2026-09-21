/**
 * Parses the internal repository-policy command contract.
 *
 * @param {string[]} argv Arguments without the executable path.
 * @returns {{command: string | null, help: boolean, initialize: boolean, json: boolean,
 *   metadataPath: string | null, renameDefault: boolean, slug: string | null}} Parsed command options.
 * @throws {Error} When command, positionals, or option combinations are unsupported.
 */
export default function parseRepositoryPolicyArgs(argv) {
  const positionals = [];
  const options = {
    help: false,
    initialize: false,
    json: false,
    metadataPath: null,
    renameDefault: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--metadata') {
      const path = argv[++index];
      if (!path || path.startsWith('-') || options.metadataPath) {
        throw new Error('--metadata requires one JSON file path and cannot be repeated.');
      }
      options.metadataPath = path;
      continue;
    }
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
  if (!['apply', 'create', 'inspect', 'inspect-metadata', 'apply-metadata'].includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }
  if (command !== 'apply' && (options.initialize || options.renameDefault)) {
    throw new Error('--initialize and --rename-default are valid only with apply.');
  }
  if (options.metadataPath && !['create', 'inspect-metadata', 'apply-metadata'].includes(command)) {
    throw new Error('--metadata is valid only with create, inspect-metadata, or apply-metadata.');
  }
  if (['create', 'apply-metadata'].includes(command) && !options.metadataPath) {
    throw new Error(`${command} requires --metadata with the reviewed JSON plan.`);
  }

  return {
    ...options,
    command,
    slug,
  };
}
