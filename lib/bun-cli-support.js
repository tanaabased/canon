import path from 'node:path';

import booleanFromEnv from '../utils/boolean-from-env.js';
import csvDisplay from '../utils/csv-display.js';

const ANSI_ESCAPE_PREFIX = '\u001B[';

export function supportsColor(stream = process.stdout, env = process.env) {
  if (Object.hasOwn(env, 'NO_COLOR')) {
    return false;
  }

  return booleanFromEnv(env, 'FORCE_COLOR', Boolean(stream?.isTTY));
}

export function applyAnsi(code, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  return `${ANSI_ESCAPE_PREFIX}${code}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

export function applyRgb(hex, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  const normalized = hex.replace(/^#/, '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${ANSI_ESCAPE_PREFIX}38;2;${red};${green};${blue}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

export function bold(text, stream = process.stdout) {
  return applyAnsi('1', text, stream);
}

export function dim(text, stream = process.stdout) {
  return applyAnsi('2', text, stream);
}

export function green(text, stream = process.stdout) {
  return applyAnsi('32', text, stream);
}

export function red(text, stream = process.stdout) {
  return applyAnsi('31', text, stream);
}

export function tp(text, stream = process.stdout) {
  return applyRgb('#00c88a', text, stream);
}

export function ts(text, stream = process.stdout) {
  return applyRgb('#db2777', text, stream);
}

export function writeLine(stream, message = '') {
  stream.write(`${message}\n`);
}

export function writeStatus(stream, label, colorize, message = '') {
  writeLine(stream, `${bold(colorize(label, stream), stream)} ${message}`);
}

export function note(message, stream = process.stdout) {
  writeStatus(stream, 'note', ts, message);
}

export function success(message, stream = process.stdout) {
  writeStatus(stream, 'done', green, message);
  return true;
}

export function fail(message, stream = process.stderr) {
  writeStatus(stream, 'error', red, message);
  return false;
}

export function resolveArgValue(arg, key) {
  if (arg === key) {
    return null;
  }

  if (arg.startsWith(`${key}=`)) {
    return arg.slice(`${key}=`.length);
  }

  return undefined;
}

export function parseCodexsyncArgv(argv, { defaultRepoRoot }) {
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

export function renderHelp({ cachePath, commands, cliName, repoRoot }, stream = process.stdout) {
  return [
    `Usage: ${bold(`${cliName} <${commands.join('|')}>`, stream)} ${dim('[options]', stream)}`,
    '',
    `${tp('Commands', stream)}:`,
    `  check      compares source to the managed Codex plugin cache`,
    `  validate   validates canon skills, plugin metadata, docs links, and workflow script references`,
    `  sync       copies source into the managed Codex plugin cache`,
    '',
    `${tp('Options', stream)}:`,
    `  --repo-root <path>    repo root to compare from ${dim(`[default: ${repoRoot}]`, stream)}`,
    `  --cache-path <path>   cache copy to compare or sync ${dim(`[default: ${cachePath}]`, stream)}`,
    '  -h, --help            displays this message',
    '  -V, --version         shows the CLI version',
  ].join('\n');
}

export function displayPositionals(values) {
  return csvDisplay(values);
}
