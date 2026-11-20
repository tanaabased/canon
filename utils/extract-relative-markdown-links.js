/**
 * Extracts repo-relative Markdown targets while skipping anchors and external links.
 *
 * @param {string} markdown Markdown content.
 * @returns {string[]} Relative link targets to validate.
 */
export default function extractRelativeMarkdownLinks(markdown) {
  const links = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;

  // Examples can contain shorter fences and links meant for the destination repository.
  let openFence = '';
  const prose = String(markdown ?? '')
    .split(/\r?\n/)
    .filter((line) => {
      const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (openFence) {
        if (marker && marker[1].startsWith(openFence) && !marker[2].trim()) openFence = '';
        return false;
      }
      if (!marker || (marker[1][0] === '`' && marker[2].includes('`'))) return true;
      openFence = marker[1];
      return false;
    })
    .join('\n');

  for (const match of prose.matchAll(pattern)) {
    const rawTarget = match[1].trim();
    const target = rawTarget.split(/\s+/)[0];

    if (
      !target ||
      target.startsWith('#') ||
      target.startsWith('mailto:') ||
      target.startsWith('data:') ||
      /^[a-z]+:\/\//i.test(target)
    ) {
      continue;
    }

    links.push(target);
  }

  return links;
}
