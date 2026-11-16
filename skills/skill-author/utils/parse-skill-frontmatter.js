import { YAML } from 'bun';

function parseYamlBlock(rawBlock) {
  const value = YAML.parse(rawBlock);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Skill frontmatter must be a YAML mapping.');
  }
  return value;
}

export function splitLeadingSkillFrontmatter(content) {
  const match = String(content ?? '').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Template is missing leading template frontmatter.');
  }

  return {
    body: match[2],
    frontmatter: parseYamlBlock(match[1]),
  };
}

/**
 * Parses YAML frontmatter used by canon skills.
 *
 * @param {string} content SKILL.md content.
 * @returns {object | null} Parsed frontmatter or null when absent or malformed.
 */
export default function parseSkillFrontmatter(content) {
  const match = String(content ?? '').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parseYamlBlock(match[1]);
  } catch {
    return null;
  }
}
