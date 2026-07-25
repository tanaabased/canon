const DESCRIPTION_PREFIX = 'Tanaab-based ';

/**
 * Normalizes a description to the canonical owner prefix.
 *
 * @param {string} value Raw skill description.
 * @returns {string} Canonical description.
 */
export default function normalizeSkillDescription(value) {
  const trimmed = String(value ?? '').trim();
  const withoutPrefix = trimmed.replace(/^tanaab[- ]based\s+/i, '');
  return `${DESCRIPTION_PREFIX}${withoutPrefix}`;
}

export function makeShortSkillDescription(description) {
  const cleaned = normalizeSkillDescription(description).replace(/\.$/, '');
  if (cleaned.length <= 64) return cleaned;

  const remainder = cleaned.slice(DESCRIPTION_PREFIX.length);
  const maxRemainderLength = 64 - DESCRIPTION_PREFIX.length - 3;
  return `${DESCRIPTION_PREFIX}${remainder.slice(0, maxRemainderLength).trimEnd()}...`;
}

export function makeSkillDefaultPrompt(skillId, description) {
  const cleaned = String(description ?? '')
    .trim()
    .replace(/^tanaab[- ]based\s+/i, '')
    .replace(/\.$/, '');
  const normalized = cleaned ? `${cleaned[0].toLowerCase()}${cleaned.slice(1)}` : cleaned;
  return `Use $${skillId} when you need to ${normalized}.`;
}
