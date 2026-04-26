import valueEnabled from './value-enabled.js';

export default function booleanFromEnv(env, key, fallback = false) {
  if (!env || !Object.hasOwn(env, key)) {
    return Boolean(fallback);
  }

  return valueEnabled(env[key], fallback);
}
