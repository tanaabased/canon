import { FALLBACK_KEY_ORDER, FALLBACK_SCHEMA_VERSION } from '../lib/task-author-contract.js';

function yamlScalar(value) {
  if (typeof value === 'number') return String(value);
  return String(value).toLowerCase().replaceAll(' ', '-');
}

/** Render only metadata values that lack an available native representation. */
export function renderFallbackMetadata(fallback = {}) {
  const lines = FALLBACK_KEY_ORDER.filter(
    (key) => fallback[key] !== undefined && fallback[key] !== null && fallback[key] !== '',
  ).map((key) => `  ${key}: ${yamlScalar(fallback[key])}`);

  if (lines.length === 0) return '';
  return [
    '### Task metadata',
    '',
    '```yaml',
    `schema: ${FALLBACK_SCHEMA_VERSION}`,
    'mode: fallback',
    'fallback:',
    ...lines,
    '```',
    '',
  ].join('\n');
}
