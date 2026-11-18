import runGitHubCli, {
  githubCliResultDetail,
  githubCliResultStatus,
} from '../../../lib/run-github-cli.js';
import {
  readRepositoryIssueFields,
  readRepositoryIssueTypes,
} from '../../../lib/read-repository-issue-metadata.js';
import normalizeSchemaVisibility from '../utils/normalize-schema-visibility.js';

export const SCHEMA_INSPECTION_QUERY = `
  query SchemaInspection($owner: String!, $repo: String!, $labelCursor: String) {
    repository(owner: $owner, name: $repo) {
      nameWithOwner
      isPrivate
      viewerCanSeeIssueFields
      owner {
        __typename
        login
      }
      labels(first: 100, after: $labelCursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          color
          description
          isDefault
          issues {
            totalCount
          }
          pullRequests {
            totalCount
          }
        }
      }
    }
  }
`;

const SCHEMA_DETAILS_QUERY = `
  query SchemaDetails($owner: String!, $repo: String!, $organizationOwned: Boolean!) {
    organization(login: $owner) @include(if: $organizationOwned) {
      issueTypes(first: 100) {
        pageInfo { hasNextPage }
        nodes { ...TypePinning }
      }
      issueFields(first: 100) {
        pageInfo { hasNextPage }
        nodes { ...IssueFieldData }
      }
    }
    repository(owner: $owner, name: $repo) {
      issueTypes(first: 100) {
        pageInfo { hasNextPage }
        nodes { ...TypePinning }
      }
    }
  }

  fragment TypePinning on IssueType {
    id
    name
    isEnabled
    pinnedFields { ...IssueFieldData }
  }

  fragment IssueFieldData on IssueFields {
    __typename
    ... on Node {
      id
    }
    ... on IssueFieldCommon {
      name
      dataType
      description
      visibility
    }
    ... on IssueFieldSingleSelect {
      options {
        id
        name
        color
        description
      }
    }
  }
`;

function resultError(result, fallback) {
  return githubCliResultDetail(result) || fallback;
}

function normalizeDataType(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('-', '_');
}

function normalizeField(field) {
  return {
    id: field.id ?? null,
    name: field.name,
    dataType: normalizeDataType(field.dataType),
    description: field.description ?? '',
    visibility: normalizeSchemaVisibility(field.visibility),
    options: (field.options ?? []).map((option) => ({
      id: option.id ?? null,
      name: option.name,
      color: option.color ?? null,
      description: option.description ?? '',
    })),
  };
}

function normalizeIssueType(issueType) {
  return {
    id: issueType.id ?? null,
    name: issueType.name,
    enabled: issueType.isEnabled !== false,
  };
}

function normalizeLabel(label) {
  return {
    id: label.id ?? null,
    name: label.name,
    color: String(label.color ?? '').replace(/^#/, ''),
    description: label.description ?? '',
    default: Boolean(label.isDefault),
    issueCount: label.issues?.totalCount ?? 0,
    pullRequestCount: label.pullRequests?.totalCount ?? 0,
  };
}

function available(values) {
  return { status: 'ok', values };
}

function unavailable(reason) {
  return { status: 'unavailable', values: [], reason };
}

function parsePayload(result) {
  try {
    return JSON.parse(String(result.stdout ?? '{}'));
  } catch {
    return null;
  }
}

function hasErrorPath(payload, rootName, surfaceName) {
  return (payload?.errors ?? []).some(
    ({ path }) => !path || (path[0] === rootName && (path.length === 1 || path[1] === surfaceName)),
  );
}

function completeNodes(connection) {
  return (
    connection?.pageInfo?.hasNextPage === false &&
    Array.isArray(connection.nodes) &&
    connection.nodes.every((node) => node?.name)
  );
}

function inspectPinning(payload, rootName) {
  const types = payload?.data?.[rootName]?.issueTypes;
  if (
    hasErrorPath(payload, rootName, 'issueTypes') ||
    !completeNodes(types) ||
    types.nodes.some(
      ({ pinnedFields }) =>
        !Array.isArray(pinnedFields) || pinnedFields.some((field) => !field?.name),
    )
  ) {
    return unavailable('Per-type issue field pinning could not be inspected.');
  }
  return available(
    types.nodes.map((type) => ({
      ...normalizeIssueType(type),
      pinnedFields: type.pinnedFields.map(normalizeField),
    })),
  );
}

/** Read-only GitHub issue schema inspection with an injectable process boundary. */
export class GitHubSchemaClient {
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
  }

  #run(args) {
    return this.#runner(args);
  }

  ensureAvailable() {
    const version = this.#run(['--version']);
    if (version.error?.code === 'ENOENT') {
      throw new Error('GitHub CLI (gh) is required for schema inspection.');
    }
    if (githubCliResultStatus(version) !== 0) {
      throw new Error(resultError(version, 'GitHub CLI availability check failed.'));
    }

    const auth = this.#run(['auth', 'status']);
    return githubCliResultStatus(auth) === 0
      ? []
      : [
          'GitHub CLI authentication could not be verified; public reads may still succeed, but private or organization schema reads can fail.',
        ];
  }

  #query(target, labelCursor = null) {
    const args = [
      'api',
      'graphql',
      '-f',
      `query=${SCHEMA_INSPECTION_QUERY}`,
      '-F',
      `owner=${target.owner}`,
      '-F',
      `repo=${target.repo}`,
    ];
    if (labelCursor) args.push('-F', `labelCursor=${labelCursor}`);
    return this.#run(args);
  }

  inspect(target) {
    const firstResult = this.#query(target);
    const firstPayload = parsePayload(firstResult);
    const firstRepository = firstPayload?.data?.repository;
    if (!firstRepository) {
      throw new Error(
        resultError(firstResult, `Unable to inspect GitHub repository ${target.slug}.`),
      );
    }

    const warnings = (firstPayload.errors ?? []).map(({ message }) => message);
    const ownerType = firstRepository.owner?.__typename ?? 'Unknown';
    const organizationOwned = ownerType === 'Organization';

    let labels = [...(firstRepository.labels?.nodes ?? [])];
    let pageInfo = firstRepository.labels?.pageInfo;
    let labelsAvailable = Boolean(pageInfo) && !hasErrorPath(firstPayload, 'repository', 'labels');
    const cursors = new Set();
    while (labelsAvailable && pageInfo?.hasNextPage) {
      if (!pageInfo.endCursor || cursors.has(pageInfo.endCursor)) {
        labelsAvailable = false;
        break;
      }
      cursors.add(pageInfo.endCursor);
      const pageResult = this.#query(target, pageInfo.endCursor);
      const pagePayload = parsePayload(pageResult);
      const pageRepository = pagePayload?.data?.repository;
      const pageLabels = pageRepository?.labels;
      if (!pageLabels?.pageInfo || hasErrorPath(pagePayload, 'repository', 'labels')) {
        labelsAvailable = false;
        warnings.push(
          resultError(pageResult, `Could not inspect all repository labels for ${target.slug}.`),
        );
        break;
      }
      warnings.push(...(pagePayload.errors ?? []).map(({ message }) => message));
      labels = labels.concat(pageLabels.nodes ?? []);
      pageInfo = pageLabels.pageInfo;
    }

    const detailsResult = this.#run([
      'api',
      'graphql',
      '-f',
      `query=${SCHEMA_DETAILS_QUERY}`,
      '-f',
      `owner=${target.owner}`,
      '-f',
      `repo=${target.repo}`,
      '-F',
      `organizationOwned=${organizationOwned}`,
    ]);
    const details = parsePayload(detailsResult);
    const organization = details?.data?.organization;
    warnings.push(...(details?.errors ?? []).map(({ message }) => message));
    if (!details?.data && !details?.errors?.length) {
      warnings.push(
        resultError(
          detailsResult,
          'Organization schema and per-type pinning could not be inspected.',
        ),
      );
    }
    const repositoryTypes = readRepositoryIssueTypes(this.#runner, target);
    const repositoryFields = readRepositoryIssueFields(this.#runner, target);
    for (const [name, collection] of [
      ['issue types', repositoryTypes],
      ['issue fields', repositoryFields],
    ]) {
      if (collection.reason)
        warnings.push(`Could not inspect repository ${name}: ${collection.reason}`);
    }
    const notApplicable = { status: 'not_applicable', values: [] };

    return {
      repository: {
        slug: firstRepository.nameWithOwner ?? target.slug,
        ownerLogin: firstRepository.owner?.login ?? target.owner,
        ownerType,
        private: Boolean(firstRepository.isPrivate),
        viewerCanSeeIssueFields: Boolean(firstRepository.viewerCanSeeIssueFields),
      },
      organizationIssueTypes: organizationOwned
        ? completeNodes(organization?.issueTypes) &&
          !hasErrorPath(details, 'organization', 'issueTypes')
          ? available(organization.issueTypes.nodes.map(normalizeIssueType))
          : unavailable('Organization issue types could not be inspected.')
        : notApplicable,
      repositoryIssueTypes: {
        ...repositoryTypes,
        values: repositoryTypes.values.map(({ node_id, id, name, is_enabled }) => ({
          id: node_id ?? id,
          name,
          enabled: is_enabled,
        })),
      },
      organizationPinning: organizationOwned
        ? inspectPinning(details, 'organization')
        : notApplicable,
      repositoryPinning: inspectPinning(details, 'repository'),
      repositoryIssueFields: {
        ...repositoryFields,
        values: repositoryFields.values.map(normalizeField),
      },
      issueFields: organizationOwned
        ? !completeNodes(organization?.issueFields) ||
          hasErrorPath(details, 'organization', 'issueFields')
          ? unavailable('Organization issue fields could not be inspected.')
          : available(organization.issueFields.nodes.map(normalizeField))
        : notApplicable,
      repositoryLabels: labelsAvailable
        ? available(labels.map(normalizeLabel))
        : unavailable('Repository labels could not be completely inspected.'),
      organizationDefaultLabels: organizationOwned
        ? {
            status: 'manual',
            reason:
              'GitHub has no public API for listing organization default labels; inspect this organization setting manually.',
          }
        : {
            status: 'not_applicable',
            reason: 'Personal repositories have no organization defaults.',
          },
      warnings,
    };
  }
}
