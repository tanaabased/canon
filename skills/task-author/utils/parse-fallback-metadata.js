import {
  FALLBACK_KEY_ORDER,
  FALLBACK_SCHEMA_VERSION,
  LEGACY_FALLBACK_SCHEMA_VERSION,
} from '../lib/task-author-contract.js';

const CAPSULE = /(?:\n\n)?### Task metadata\n\n```yaml\n([\s\S]*?)```\s*$/;
const RETIRED_LEGACY_KEYS = Object.freeze(['task-score']);

function scalar(value) {
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

/** Parse the exact versioned fallback capsule without accepting arbitrary YAML. */
export function parseFallbackMetadata(body = '') {
  const source = String(body);
  const match = source.match(CAPSULE);
  if (!match) {
    return { found: false, body: source, schema: null, fallback: {}, retired: {}, errors: [] };
  }

  const lines = match[1].split('\n');
  const errors = [];
  const fallback = {};
  const retired = {};
  let inFallback = false;
  let schema = null;
  let mode = null;

  for (const line of lines) {
    if (line.startsWith('schema: ')) schema = line.slice(8).trim();
    else if (line.startsWith('mode: ')) mode = line.slice(6).trim();
    else if (line === 'fallback:') inFallback = true;
    else if (inFallback && /^ {2}[a-z-]+: /.test(line)) {
      const separator = line.indexOf(':', 2);
      const key = line.slice(2, separator);
      const value = line.slice(separator + 1).trim();
      if (FALLBACK_KEY_ORDER.includes(key)) fallback[key] = scalar(value);
      else if (schema === LEGACY_FALLBACK_SCHEMA_VERSION && RETIRED_LEGACY_KEYS.includes(key)) {
        retired[key] = scalar(value);
      } else errors.push(`Unsupported fallback key: ${key}.`);
    } else if (line.trim()) {
      errors.push(`Unsupported fallback capsule line: ${line.trim()}`);
    }
  }

  if (![FALLBACK_SCHEMA_VERSION, LEGACY_FALLBACK_SCHEMA_VERSION].includes(schema)) {
    errors.push(
      `Fallback schema must be ${FALLBACK_SCHEMA_VERSION} or ${LEGACY_FALLBACK_SCHEMA_VERSION}.`,
    );
  }
  if (mode !== 'fallback') errors.push('Fallback capsule mode must be fallback.');
  if (!inFallback) errors.push('Fallback capsule is missing fallback:.');

  return {
    found: true,
    body: source.slice(0, match.index).trimEnd(),
    schema,
    fallback,
    retired,
    errors,
  };
}
