const KEBAB_CASE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Checks the canonical lowercase kebab-case identifier shape.
 *
 * @param {string} value Candidate identifier.
 * @returns {boolean} Whether the value is valid.
 */
export default function isKebabCaseId(value) {
  return KEBAB_CASE_ID_PATTERN.test(String(value ?? '').trim());
}
