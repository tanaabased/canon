import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import { classifySchemaLabels } from '../utils/classify-schema-labels.js';
import { compareIssueFields } from '../utils/compare-issue-fields.js';
import { compareIssueTypes } from '../utils/compare-issue-types.js';
import { normalizeSchemaTarget } from '../utils/normalize-schema-target.js';
import { highestSchemaStatus, summarizeSchemaStatuses } from '../utils/schema-status.js';
import { GitHubSchemaClient } from './github-schema-client.js';

/** Inspect one explicit repository without creating or changing GitHub state. */
export function inspectGitHubIssueSchema(
  input,
  { client = new GitHubSchemaClient(), policy = taskManagementSchema } = {},
) {
  const target = normalizeSchemaTarget(input);
  const warnings = client.ensureAvailable();
  const observed = client.inspect(target);
  const issueTypes = compareIssueTypes(
    policy.issueTypes,
    observed.organizationIssueTypes,
    observed.repositoryIssueTypes,
  );
  const issueFields = compareIssueFields(
    policy.issueFields,
    observed.issueFields,
    observed.repositoryIssueTypes,
    policy.preservedUnmanagedFields,
  );
  const repositoryLabels = classifySchemaLabels(policy, observed.repositoryLabels);
  const surfaceStatuses = [
    issueTypes.organization.status,
    issueTypes.repository.status,
    issueFields.status,
    repositoryLabels.status,
  ];

  return {
    mode: 'inspect',
    mutatesGitHub: false,
    policyVersion: policy.schemaVersion,
    target,
    status: highestSchemaStatus(surfaceStatuses),
    summary: summarizeSchemaStatuses(surfaceStatuses),
    repository: observed.repository,
    issueTypes,
    issueFields,
    labels: {
      repository: repositoryLabels,
      organizationDefaults: observed.organizationDefaultLabels,
    },
    warnings: [...warnings, ...observed.warnings],
    operations: [],
  };
}
