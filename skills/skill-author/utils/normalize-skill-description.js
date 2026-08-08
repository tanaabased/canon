const DESCRIPTION_PREFIX = 'Tanaab-based ';

function stripDescriptionPrefix(value, descriptionPrefix) {
  const trimmed = String(value ?? '').trim();
  if (!descriptionPrefix) return trimmed;
  if (descriptionPrefix === DESCRIPTION_PREFIX) {
    return trimmed.replace(/^tanaab[- ]based\s+/i, '');
  }

  const escapedPrefix = descriptionPrefix
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\ /g, '\\s+');
  return trimmed.replace(new RegExp(`^${escapedPrefix}\\s+`, 'i'), '');
}

/**
 * Normalizes a description to the selected identity profile prefix.
 *
 * @param {string} value Raw skill description.
 * @param {object} [options]
 * @param {string} [options.descriptionPrefix='Tanaab-based '] Owner-profile prefix; use an empty string for product-owned prose.
 * @returns {string} Canonical description.
 */
export default function normalizeSkillDescription(value, options = {}) {
  const descriptionPrefix = options.descriptionPrefix ?? DESCRIPTION_PREFIX;
  const withoutPrefix = stripDescriptionPrefix(value, descriptionPrefix);
  return `${descriptionPrefix}${withoutPrefix}`;
}

/**
 * Fits a canonical skill description into the OpenAI metadata length limit.
 *
 * @param {string} description Canonical or unprefixed skill description.
 * @param {object} [options]
 * @param {string} [options.descriptionPrefix='Tanaab-based '] Owner-profile prefix; use an empty string for product-owned prose.
 * @returns {string} Description capped at 64 characters.
 */
export function makeShortSkillDescription(description, options = {}) {
  const descriptionPrefix = options.descriptionPrefix ?? DESCRIPTION_PREFIX;
  const cleaned = normalizeSkillDescription(description, { descriptionPrefix }).replace(/\.$/, '');
  if (cleaned.length <= 64) return cleaned;

  const remainder = cleaned.slice(descriptionPrefix.length);
  const maxRemainderLength = 64 - descriptionPrefix.length - 3;
  return `${descriptionPrefix}${remainder.slice(0, maxRemainderLength).trimEnd()}...`;
}

/**
 * Creates a default prompt that names the generated skill explicitly.
 *
 * @param {string} skillId Public namespace-prefixed skill id.
 * @param {string} description Canonical or unprefixed skill description.
 * @param {object} [options]
 * @param {string} [options.descriptionPrefix='Tanaab-based '] Owner-profile prefix to remove from prompt prose.
 * @returns {string} Default agent prompt.
 */
export function makeSkillDefaultPrompt(skillId, description, options = {}) {
  const descriptionPrefix = options.descriptionPrefix ?? DESCRIPTION_PREFIX;
  const cleaned = stripDescriptionPrefix(description, descriptionPrefix).replace(/\.$/, '');
  const normalized = cleaned ? `${cleaned[0].toLowerCase()}${cleaned.slice(1)}` : cleaned;
  return `Use $${skillId} for ${normalized}.`;
}
