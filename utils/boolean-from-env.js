import valueEnabled from './value-enabled.js';

/**
 * Reads one environment key without treating an inherited property as present.
 * Missing keys use the fallback; present empty values delegate fallback handling
 * to the shared value parser.
 *
 * @param {object | null | undefined} env Environment-like object to read from.
 * @param {string} key Own-property key to inspect.
 * @param {boolean} [fallback=false] Value used when the key is absent or present but blank.
 * @returns {boolean} Parsed enablement state.
 */
export default function booleanFromEnv(env, key, fallback = false) {
  if (!env || !Object.hasOwn(env, key)) {
    return Boolean(fallback);
  }

  return valueEnabled(env[key], fallback);
}
