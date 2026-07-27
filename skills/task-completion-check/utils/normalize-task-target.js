const TASK_SLUG_PATTERN = /^([^/#\s]+)\/([^/#\s]+)#([1-9]\d*)$/;
const TASK_URL_PATTERN =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/issues\/([1-9]\d*)(?:[/?#].*)?$/i;

/**
 * Normalizes an explicit GitHub issue target into Canon's task identity.
 *
 * @param {string} value Issue URL or OWNER/REPO#NUMBER value.
 * @returns {{number: string, owner: string, repo: string, slug: string, url: string}} Normalized task target.
 * @throws {Error} When the target is not an explicit GitHub issue identity.
 */
export default function normalizeTaskTarget(value) {
  const input = String(value ?? '').trim();
  const match = input.match(TASK_URL_PATTERN) ?? input.match(TASK_SLUG_PATTERN);
  if (!match) {
    throw new Error('A task must be a GitHub issue URL or OWNER/REPO#NUMBER.');
  }

  const [, owner, repo, number] = match;
  const slug = `${owner}/${repo}`;
  return {
    number,
    owner,
    repo,
    slug,
    url: `https://github.com/${slug}/issues/${number}`,
  };
}
