const REPOSITORY_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\/[A-Za-z0-9_.-]+$/;

function parseRepository(repository) {
  const slug = String(repository ?? '').trim();
  if (!REPOSITORY_PATTERN.test(slug)) {
    throw new Error('Project milestone target must contain an exact OWNER/REPO repository.');
  }
  const [owner, repo] = slug.split('/');
  return { owner, repo, slug };
}

function positiveInteger(value, label) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return number;
}

/**
 * Normalize an explicit repository or milestone selector.
 *
 * @param {string|object} input OWNER/REPO, OWNER/REPO#NUMBER, milestone URL, or selector object.
 * @returns {{owner:string,repo:string,slug:string,number:number|null,title:string|null}} Normalized target.
 * @throws {Error} When the repository or selector is invalid or ambiguous.
 */
export default function normalizeMilestoneTarget(input) {
  if (typeof input === 'string') {
    const value = input.trim();
    const url = value.match(
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/milestone\/(\d+)\/?(?:[?#].*)?$/i,
    );
    if (url) {
      return {
        ...parseRepository(`${url[1]}/${url[2]}`),
        number: positiveInteger(url[3], 'Milestone number'),
        title: null,
      };
    }

    const numbered = value.match(/^(.+\/.+)#(\d+)$/);
    if (numbered) {
      return {
        ...parseRepository(numbered[1]),
        number: positiveInteger(numbered[2], 'Milestone number'),
        title: null,
      };
    }

    return { ...parseRepository(value), number: null, title: null };
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Project milestone target must be an explicit string or selector object.');
  }

  const repository = input.repository ?? input.slug;
  const title = input.title === undefined ? null : String(input.title).trim();
  if (title === '') throw new Error('Milestone selector title must not be empty.');

  return {
    ...parseRepository(repository),
    number: positiveInteger(input.number, 'Milestone number'),
    title,
  };
}
