const REPOSITORY_SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:#([1-9]\d*))?$/;

/** Normalize an explicit GitHub repository identifier without guessing from a directory name. */
export function normalizeTaskTarget(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('A GitHub repository target is required as OWNER/REPO.');
  }

  let candidate = input.trim();
  if (/^https?:\/\//i.test(candidate)) {
    let url;
    try {
      url = new URL(candidate);
    } catch {
      throw new Error(`Invalid GitHub repository URL: ${candidate}`);
    }
    if (url.hostname.toLowerCase() !== 'github.com') {
      throw new Error(`Expected a github.com repository URL, received: ${url.hostname}`);
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 4 && parts[2] === 'issues' && /^[1-9]\d*$/.test(parts[3])) {
      candidate = `${parts[0]}/${parts[1].replace(/\.git$/i, '')}#${parts[3]}`;
    } else if (parts.length === 2) {
      candidate = `${parts[0]}/${parts[1].replace(/\.git$/i, '')}`;
    } else {
      throw new Error('Expected a GitHub repository or issue URL.');
    }
  } else {
    candidate = candidate.replace(/\.git(?=#|$)/i, '');
  }

  const match = candidate.match(REPOSITORY_SLUG);
  if (!match) {
    throw new Error(`Expected OWNER/REPO or OWNER/REPO#NUMBER, received: ${input}`);
  }

  const [, owner, repo, issueNumber] = match;
  return {
    owner,
    repo,
    slug: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
    issueNumber: issueNumber ? Number(issueNumber) : null,
    issueUrl: issueNumber ? `https://github.com/${owner}/${repo}/issues/${issueNumber}` : null,
  };
}
