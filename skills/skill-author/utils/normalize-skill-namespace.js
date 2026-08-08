import isKebabCaseId from './is-kebab-case-id.js';
import { DEFAULT_SKILL_NAMESPACE } from './skill-identity.js';

/**
 * Normalizes a public skill namespace while preserving the Tanaab default.
 *
 * @param {unknown} value Namespace override supplied by a project or caller.
 * @returns {string} Validated kebab-case namespace.
 * @throws {Error} When the override is not a kebab-case id.
 */
export default function normalizeSkillNamespace(value) {
  const namespace = String(value ?? DEFAULT_SKILL_NAMESPACE)
    .trim()
    .toLowerCase();
  if (!isKebabCaseId(namespace)) {
    throw new Error(
      `Skill namespace must use lowercase letters, digits, and hyphens: ${namespace}`,
    );
  }
  return namespace;
}
