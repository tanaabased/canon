export function result({ status = 0, stdout = '', stderr = '', error = null } = {}) {
  return { status, stdout, stderr, error };
}

export function makeField({
  id,
  name,
  dataType = 'SINGLE_SELECT',
  visibility = 'ORG_ONLY',
  options = [],
}) {
  return {
    __typename:
      dataType === 'SINGLE_SELECT'
        ? 'IssueFieldSingleSelect'
        : dataType === 'NUMBER'
          ? 'IssueFieldNumber'
          : 'IssueFieldDate',
    id: id ?? `field-${name}`,
    name,
    dataType,
    description: '',
    visibility,
    options: options.map((option, index) => ({
      id: `${name}-${index}`,
      name: option,
      color: 'GRAY',
      description: '',
    })),
  };
}

export function makeIssueType(name, pinnedFields = [], enabled = true) {
  return { id: `type-${name}`, name, isEnabled: enabled, pinnedFields };
}

export function makeLabel({
  name,
  color = 'ededed',
  description = '',
  isDefault = false,
  issueCount = 0,
  pullRequestCount = 0,
}) {
  return {
    id: `label-${name}`,
    name,
    color,
    description,
    isDefault,
    issues: { totalCount: issueCount },
    pullRequests: { totalCount: pullRequestCount },
  };
}

export function organizationPayload({
  fields = [],
  labels = [],
  types = [],
  hasNextPage = false,
  endCursor = null,
  errors = [],
} = {}) {
  return {
    data: {
      organization: {
        issueFields: { nodes: fields },
        issueTypes: { nodes: types },
      },
      repository: {
        nameWithOwner: 'tanaabased/canon',
        isPrivate: false,
        viewerCanSeeIssueFields: true,
        owner: { __typename: 'Organization', login: 'tanaabased' },
        issueFields: { nodes: fields },
        issueTypes: { nodes: types },
        labels: {
          totalCount: labels.length,
          pageInfo: { hasNextPage, endCursor },
          nodes: labels,
        },
      },
    },
    errors,
  };
}

export function createQueuedRunner(responses) {
  const calls = [];
  const queue = [...responses];
  const runner = (args) => {
    calls.push({ args });
    const next = queue.shift();
    if (!next) throw new Error(`Unexpected command: gh ${args.join(' ')}`);
    return typeof next === 'function' ? next(args) : next;
  };
  return { calls, runner };
}
