const REPOSITORY_SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

/** Normalize an explicit GitHub repository target without inferring from local directory names. */
export function normalizeSchemaTarget(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('A GitHub repository target is required as OWNER/REPO.');
  }

  let candidate = input.trim();
  if (/^https?:\/\//i.test(candidate)) {
    let url;
    try {
      url = new URL(candidate);
    } catch (error) {
      throw new Error(`Invalid GitHub repository URL: ${candidate}`, { cause: error });
    }
    if (url.hostname.toLowerCase() !== 'github.com') {
      throw new Error(`Expected a github.com repository URL, received: ${url.hostname}`);
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 2) throw new Error('Expected a repository URL without an extra path.');
    candidate = `${parts[0]}/${parts[1].replace(/\.git$/i, '')}`;
  } else {
    candidate = candidate.replace(/\.git$/i, '');
  }

  const match = candidate.match(REPOSITORY_SLUG);
  if (!match) throw new Error(`Expected OWNER/REPO, received: ${input}`);
  const [, owner, repo] = match;
  return {
    owner,
    repo,
    slug: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  };
}
