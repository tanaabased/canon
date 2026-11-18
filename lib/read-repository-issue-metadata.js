import {
  flattenGitHubPages,
  GITHUB_API_VERSION_HEADER,
  githubCliResultDetail,
  githubCliResultStatus,
} from './run-github-cli.js';

const REPOSITORY_FIELDS_QUERY = `
  query RepositoryIssueFields($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      viewerCanSeeIssueFields
      viewerPermission
      issueFields(first: 100, after: $cursor) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          ... on Node { id }
          ... on IssueFieldCommon { name dataType description visibility }
          ... on IssueFieldDate { fullDatabaseId }
          ... on IssueFieldNumber { fullDatabaseId }
          ... on IssueFieldText { fullDatabaseId }
          ... on IssueFieldSingleSelect {
            fullDatabaseId
            options { id fullDatabaseId name color description }
          }
          ... on IssueFieldMultiSelect {
            fullDatabaseId
            options { id fullDatabaseId name color description }
          }
        }
      }
    }
  }
`;

function readJson(runner, args, description) {
  const result = runner(args);
  try {
    const payload = JSON.parse(result.stdout);
    if (args[1] === 'graphql' && Array.isArray(payload?.errors) && payload.errors.length > 0) {
      return { payload };
    }
    if (githubCliResultStatus(result) === 0) return { payload };
  } catch {
    if (githubCliResultStatus(result) === 0) {
      return { error: `${description} returned invalid JSON.` };
    }
  }
  return { error: githubCliResultDetail(result) || `${description} could not be read.` };
}

function unavailable(reason) {
  return { status: 'unavailable', values: [], reason };
}

/** Read repository field definitions, recording whether omissions are safe to interpret. */
export function readRepositoryIssueFields(runner, target) {
  const values = [];
  const cursors = new Set();
  let cursor = null;
  let complete = true;
  let totalCount;

  do {
    const args = [
      'api',
      'graphql',
      '-f',
      `query=${REPOSITORY_FIELDS_QUERY}`,
      '-f',
      `owner=${target.owner}`,
      '-f',
      `repo=${target.repo}`,
    ];
    if (cursor) args.push('-f', `cursor=${cursor}`);
    const { payload, error } = readJson(runner, args, 'Repository issue fields');
    if (error) return unavailable(error);
    const errors = Array.isArray(payload?.errors) ? payload.errors : [];
    const fieldErrors = errors.filter(
      ({ path }) =>
        path?.[0] !== 'repository' ||
        !['viewerPermission', 'viewerCanSeeIssueFields'].includes(path[1]),
    );
    if (fieldErrors.length > 0) {
      return unavailable(fieldErrors.map(({ message }) => message).join('; '));
    }

    const repository = payload?.data?.repository;
    const { nodes, pageInfo, totalCount: pageCount } = repository?.issueFields ?? {};
    totalCount ??= pageCount;
    if (
      !Number.isSafeInteger(pageCount) ||
      pageCount !== totalCount ||
      !Array.isArray(nodes) ||
      nodes.some((node) => !node?.id || !node.name || !node.dataType) ||
      typeof pageInfo?.hasNextPage !== 'boolean'
    ) {
      return unavailable('GitHub did not return a complete issue field page.');
    }

    // GitHub Apps can see some fields without a viewer permission. Admin access
    // establishes visibility of restricted fields as well as public ones.
    complete &&=
      errors.length === 0 &&
      repository.viewerCanSeeIssueFields === true &&
      repository.viewerPermission === 'ADMIN';
    values.push(...nodes);
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    if (pageInfo.hasNextPage && (!cursor || cursors.has(cursor))) {
      return unavailable('GitHub did not return a usable issue field page cursor.');
    }
    cursors.add(cursor);
  } while (cursor);

  if (values.length !== totalCount || new Set(values.map(({ id }) => id)).size !== totalCount) {
    return unavailable('GitHub did not return all issue fields visible to the viewer.');
  }
  return { status: 'ok', values, complete };
}

/** Read basic repository issue types independently of any pinning query. */
export function readRepositoryIssueTypes(runner, target) {
  const { payload, error } = readJson(
    runner,
    [
      'api',
      `/repos/${target.slug}/issue-types`,
      '-H',
      GITHUB_API_VERSION_HEADER,
      '--paginate',
      '--slurp',
    ],
    'Repository issue types',
  );
  if (error) return unavailable(error);
  const values = flattenGitHubPages(payload);
  if (
    !Array.isArray(values) ||
    values.some((type) => !type?.name || typeof type.is_enabled !== 'boolean')
  ) {
    return unavailable('GitHub did not return a complete repository issue type list.');
  }
  return { status: 'ok', values };
}
