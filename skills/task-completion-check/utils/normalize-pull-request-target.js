const PULL_REQUEST_SLUG_PATTERN = /^([^/#\s]+)\/([^/#\s]+)#([1-9]\d*)$/;
const PULL_REQUEST_URL_PATTERN =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/([1-9]\d*)(?:[/?#].*)?$/i;

/**
 * Normalizes explicit pull request evidence relative to a Task's Project.
 *
 * @param {string | number} value Pull request number, URL, or OWNER/REPO#NUMBER.
 * @param {string} defaultSlug Project slug used for number-only values.
 * @returns {{number: string, slug: string, url: string}} Pull request target.
 * @throws {Error} When the supplied evidence target is invalid.
 */
export default function normalizePullRequestTarget(value, defaultSlug) {
  const input = String(value ?? '').trim();
  if (/^[1-9]\d*$/.test(input)) {
    return {
      number: input,
      slug: defaultSlug,
      url: `https://github.com/${defaultSlug}/pull/${input}`,
    };
  }

  const match = input.match(PULL_REQUEST_URL_PATTERN) ?? input.match(PULL_REQUEST_SLUG_PATTERN);
  if (!match) {
    throw new Error('Pull request evidence must be a number, GitHub PR URL, or OWNER/REPO#NUMBER.');
  }

  const [, owner, repo, number] = match;
  const slug = `${owner}/${repo}`;
  return {
    number,
    slug,
    url: `https://github.com/${slug}/pull/${number}`,
  };
}
