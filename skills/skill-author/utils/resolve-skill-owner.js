import { DEFAULT_SKILL_OWNER, SKILL_OWNER_IDS } from './skill-identity.js';

/**
 * Resolves explicit skill ownership independently of its public namespace.
 *
 * @param {unknown} value Requested owner; omission retains the default.
 * @returns {string} Supported owner id.
 */
export default function resolveSkillOwner(value = DEFAULT_SKILL_OWNER) {
  if (typeof value !== 'string' || !SKILL_OWNER_IDS.includes(value)) {
    throw new Error(`Skill owner must be one of: ${SKILL_OWNER_IDS.join(', ')}`);
  }
  return value;
}
