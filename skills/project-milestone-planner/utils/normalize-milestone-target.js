const MILESTONE_SLUG_PATTERN = /^([^/#\s]+)\/([^/#\s]+)#([1-9]\d*)$/;
const MILESTONE_URL_PATTERN =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/milestone\/([1-9]\d*)(?:[/?#].*)?$/i;

/**
 * Normalizes an explicit GitHub milestone target.
 *
 * @param {string} value Milestone URL or OWNER/REPO#NUMBER value.
 * @returns {{number: string, owner: string, repo: string, slug: string, url: string}} Normalized milestone target.
 * @throws {Error} When the value is not an explicit GitHub milestone identity.
 */
export default function normalizeMilestoneTarget(value) {
  const input = String(value ?? '').trim();
  const match = input.match(MILESTONE_URL_PATTERN) ?? input.match(MILESTONE_SLUG_PATTERN);
  if (!match) {
    throw new Error('A milestone must be a GitHub milestone URL or OWNER/REPO#NUMBER.');
  }

  const [, owner, repo, number] = match;
  const slug = `${owner}/${repo}`;
  return {
    number,
    owner,
    repo,
    slug,
    url: `https://github.com/${slug}/milestone/${number}`,
  };
}
