import extractTopLevelSkillHeadings from './extract-top-level-skill-headings.js';

/**
 * Compares skill headings with the canonical order while allowing declared
 * optional headings to be omitted.
 *
 * @param {string} content Skill Markdown content.
 * @param {string[]} orderedHeadings Canonical heading sequence.
 * @param {string[]} [optionalHeadings=[]] Canonical headings that may be absent.
 * @returns {boolean} Whether the actual headings exactly match the allowed sequence.
 */
export default function hasOrderedSkillSections(content, orderedHeadings, optionalHeadings = []) {
  const headings = extractTopLevelSkillHeadings(content);
  const optionalSet = new Set(optionalHeadings);

  let actualIndex = 0;
  let expectedIndex = 0;

  while (expectedIndex < orderedHeadings.length && actualIndex < headings.length) {
    const expectedHeading = orderedHeadings[expectedIndex];
    const actualHeading = headings[actualIndex];

    if (expectedHeading === actualHeading) {
      expectedIndex += 1;
      actualIndex += 1;
      continue;
    }

    if (optionalSet.has(expectedHeading)) {
      expectedIndex += 1;
      continue;
    }

    return false;
  }

  while (
    expectedIndex < orderedHeadings.length &&
    optionalSet.has(orderedHeadings[expectedIndex])
  ) {
    expectedIndex += 1;
  }

  return expectedIndex === orderedHeadings.length && actualIndex === headings.length;
}
