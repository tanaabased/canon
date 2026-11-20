import { markdown as parser } from 'bun';

/**
 * Extracts repo-relative Markdown targets while skipping anchors and external links.
 *
 * @param {string} markdown Markdown content.
 * @returns {string[]} Relative link targets to validate.
 */
export default function extractRelativeMarkdownLinks(markdown) {
  const links = [];
  function collect(target) {
    if (target && !/^(?:#|\/\/|[a-z][a-z0-9+.-]*:)/i.test(target)) links.push(target);
    return '';
  }

  parser.render(String(markdown ?? ''), {
    link: (_, { href }) => collect(href),
    image: (_, { src }) => collect(src),
  });
  return links;
}
