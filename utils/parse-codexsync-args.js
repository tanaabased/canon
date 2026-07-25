import path from 'node:path';

function resolveArgValue(arg, key) {
  if (arg === key) {
    return null;
  }

  if (arg.startsWith(`${key}=`)) {
    return arg.slice(`${key}=`.length);
  }

  return undefined;
}

/**
 * Parses codexsync flags while preserving additional positional values for a
 * command-level error.
 *
 * @param {string[]} argv Raw argument tokens after the executable name.
 * @param {object} options Parser defaults.
 * @param {string} options.defaultRepoRoot Repo root used when --repo-root is absent.
 * @returns {{command: string | null, extraPositionals: string[], options: object}} Parsed command and options.
 */
export default function parseCodexsyncArgs(argv, { defaultRepoRoot }) {
  const options = {
    help: false,
    version: false,
    repoRoot: defaultRepoRoot,
    cachePath: null,
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '-V' || arg === '--version') {
      options.version = true;
      continue;
    }

    const repoRootValue = resolveArgValue(arg, '--repo-root');
    if (repoRootValue !== undefined) {
      const value = repoRootValue ?? argv[++index];
      if (!value) {
        throw new Error('Missing value for --repo-root.');
      }
      options.repoRoot = path.resolve(value);
      continue;
    }

    const cachePathValue = resolveArgValue(arg, '--cache-path');
    if (cachePathValue !== undefined) {
      const value = cachePathValue ?? argv[++index];
      if (!value) {
        throw new Error('Missing value for --cache-path.');
      }
      options.cachePath = path.resolve(value);
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positionals.push(arg);
  }

  const [command = null, ...extraPositionals] = positionals;
  return { command, extraPositionals, options };
}
