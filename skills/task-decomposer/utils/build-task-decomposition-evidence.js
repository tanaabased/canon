import extractAcceptanceCriteria from '../../task-completion-check/utils/extract-acceptance-criteria.js';
import {
  normalizeObservedComment,
  normalizeObservedIssueField,
  observedIssueTypeName,
  observedLabelNames,
  observedWorkSize,
} from '../../task-author/lib/task-observation.js';
import { parseFallbackMetadata } from '../../task-author/utils/parse-fallback-metadata.js';
import extractTaskConstraints from './extract-task-constraints.js';
import { stripParentRollup } from './render-parent-rollup.js';

function normalizeIssue(issue) {
  if (!issue) return null;
  return {
    id: Number(issue.id) || null,
    number: Number(issue.number) || null,
    title: issue.title || '',
    body: issue.body || '',
    state: String(issue.state || '').toLowerCase(),
    stateReason: issue.state_reason || null,
    type: observedIssueTypeName(issue),
    labels: observedLabelNames(issue.labels).sort(),
    assignees: (issue.assignees ?? [])
      .map(({ login }) => login)
      .filter(Boolean)
      .sort(),
    milestone: issue.milestone
      ? { number: Number(issue.milestone.number), title: issue.milestone.title || '' }
      : null,
    url: issue.html_url || issue.url || '',
  };
}

function normalizeRepositoryCandidate(issue) {
  if (!issue) return null;
  return {
    id: Number(issue.id) || null,
    number: Number(issue.number) || null,
    title: issue.title || '',
    state: String(issue.state || '').toLowerCase(),
    stateReason: issue.state_reason || null,
    type: observedIssueTypeName(issue),
    url: issue.html_url || issue.url || '',
  };
}

function normalizeLinkedWork(events = []) {
  return events.flatMap((event) => {
    const source = event.source?.issue;
    if (!source?.pull_request && !event.commit_id) return [];
    return [
      {
        event: event.event || '',
        commitId: event.commit_id || null,
        issue: source ? normalizeIssue(source) : null,
      },
    ];
  });
}

/** Build a stable, read-only evidence package for one exact parent task. */
export default function buildTaskDecompositionEvidence({
  target,
  repository = null,
  issue = null,
  fields = [],
  comments = [],
  timeline = [],
  parent = null,
  subIssues = [],
  nestedSubIssues = [],
  blockedBy = [],
  blocking = [],
  repositoryIssues = [],
}) {
  const normalizedIssue = normalizeIssue(issue);
  const semanticBody = stripParentRollup(normalizedIssue?.body ?? '');
  const normalizedFields = fields.map(normalizeObservedIssueField);
  const parsedFallback = parseFallbackMetadata(semanticBody);
  const acceptanceCriteria = extractAcceptanceCriteria(parsedFallback.body);

  return {
    mutatesGitHub: false,
    target,
    repository: repository
      ? {
          slug: repository.repository?.slug ?? target.slug,
          ownerType: repository.repository?.ownerType ?? 'Unknown',
          private: Boolean(repository.repository?.private),
          capabilities: {
            issueTypes: repository.issueTypes?.status ?? 'unavailable',
            issueFields: repository.issueFields?.status ?? 'unavailable',
            labels: repository.labels?.status ?? 'unavailable',
          },
        }
      : null,
    issue: normalizedIssue,
    metadata: {
      fields: normalizedFields,
      fallback: parsedFallback.fallback,
      fallbackErrors: parsedFallback.errors,
      workSize: observedWorkSize(normalizedFields, parsedFallback.fallback),
    },
    acceptanceCriteria,
    constraints: extractTaskConstraints(parsedFallback.body),
    comments: comments.map(normalizeObservedComment),
    linkedWork: normalizeLinkedWork(timeline),
    parent: normalizeIssue(parent),
    subIssues: subIssues.map(normalizeIssue),
    nestedSubIssues: nestedSubIssues.map(({ issue: child, subIssues: nested }) => ({
      issue: normalizeIssue(child),
      subIssues: nested.map(normalizeIssue),
    })),
    dependencies: {
      blockedBy: blockedBy.map(normalizeIssue),
      blocking: blocking.map(normalizeIssue),
    },
    repositoryTasks: repositoryIssues
      .filter((item) => !item.pull_request)
      .map(normalizeRepositoryCandidate),
  };
}
