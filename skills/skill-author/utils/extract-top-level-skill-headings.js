function normalizeSectionHeading(heading) {
  return /^#\s/.test(heading) ? '# ' : heading;
}

/**
 * Extracts level-one and level-two headings while ignoring fenced examples.
 *
 * @param {string} content Skill Markdown or template content.
 * @returns {string[]} Normalized top-level heading sequence.
 */
export default function extractTopLevelSkillHeadings(content) {
  const headings = [];
  let inFence = false;

  for (const line of String(content ?? '').split('\n')) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^#{1,2}\s/.test(line)) {
      headings.push(normalizeSectionHeading(line.trim()));
    }
  }

  return headings;
}
