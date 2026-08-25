import booleanFromEnv from '../utils/boolean-from-env.js';

const ANSI_ESCAPE_PREFIX = '\u001B[';

/**
 * Resolves the CLI color policy from NO_COLOR, FORCE_COLOR, and TTY state.
 *
 * @param {NodeJS.WritableStream} [stream=process.stdout] Stream used for TTY detection.
 * @param {object} [env=process.env] Environment-like object with color controls.
 * @returns {boolean} Whether ANSI color should be emitted.
 */
export function supportsColor(stream = process.stdout, env = process.env) {
  if (Object.hasOwn(env, 'NO_COLOR')) {
    return false;
  }

  return booleanFromEnv(env, 'FORCE_COLOR', Boolean(stream?.isTTY));
}

function applyAnsi(code, text, stream = process.stdout) {
  const value = String(text);
  if (!supportsColor(stream)) {
    return value;
  }

  return `${ANSI_ESCAPE_PREFIX}${code}m${value}${ANSI_ESCAPE_PREFIX}0m`;
}

function applyRgb(hex, text, stream = process.stdout) {
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

function green(text, stream = process.stdout) {
  return applyAnsi('32', text, stream);
}

function red(text, stream = process.stdout) {
  return applyAnsi('31', text, stream);
}

function tp(text, stream = process.stdout) {
  return applyRgb('#00c88a', text, stream);
}

export function ts(text, stream = process.stdout) {
  return applyRgb('#db2777', text, stream);
}

export function writeLine(stream, message = '') {
  stream.write(`${message}\n`);
}

function writeStatus(stream, label, colorize, message = '') {
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

/**
 * Renders the shared help-section shape without owning command-specific text or
 * process behavior.
 *
 * @param {object} context Help sections to render.
 * @param {string} context.usage Usage line.
 * @param {string} [context.summary] Optional summary paragraph.
 * @param {string[]} [context.commands=[]] Command lines.
 * @param {string[]} [context.options=[]] Option lines.
 * @param {string[]} [context.environmentVariables=[]] Environment variable lines.
 * @param {NodeJS.WritableStream} [stream=process.stdout] Stream used for color decisions.
 * @returns {string} Help text ready to write.
 */
export function renderCliHelp(
  { usage, summary, commands = [], options = [], environmentVariables = [] },
  stream = process.stdout,
) {
  const lines = [usage];

  if (summary) {
    lines.push('', summary);
  }

  if (commands.length > 0) {
    lines.push('', `${tp('Commands', stream)}:`, ...commands);
  }

  if (options.length > 0) {
    lines.push('', `${tp('Options', stream)}:`, ...options);
  }

  if (environmentVariables.length > 0) {
    lines.push('', `${tp('Environment Variables', stream)}:`, ...environmentVariables);
  }

  return lines.join('\n');
}
