/**
 * Replaces canonical lowercase template tokens while preserving unknown tokens.
 *
 * @param {string} template Template body.
 * @param {object} replacements Token values.
 * @returns {string} Rendered content.
 */
export default function renderSkillTemplate(template, replacements) {
  return String(template ?? '').replaceAll(
    /(?<!\$)\{\{[ \t]*([a-z_][a-z0-9_]*)[ \t]*\}\}/g,
    (match, key) => (Object.hasOwn(replacements, key) ? (replacements[key] ?? match) : match),
  );
}
