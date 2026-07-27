const TASK_SLUG_PATTERN = /^([^/#\s]+)\/([^/#\s]+)#([1-9]\d*)$/;
const TASK_URL_PATTERN =
  /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/issues\/([1-9]\d*)(?:[/?#].*)?$/i;

/**
 * Normalizes an explicit GitHub Issue target into Canon's Task identity.
 *
 * @param {string} value Issue URL or OWNER/REPO#NUMBER value.
 * @returns {{number: string, owner: string, repo: string, slug: string, url: string}} Task target.
 * @throws {Error} When the target is not an explicit GitHub Issue identity.
 */
export default function normalizeTaskTarget(value) {
  const input = String(value ?? '').trim();
  const match = input.match(TASK_URL_PATTERN) ?? input.match(TASK_SLUG_PATTERN);
  if (!match) {
    throw new Error('Task must be a GitHub Issue URL or OWNER/REPO#NUMBER.');
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
