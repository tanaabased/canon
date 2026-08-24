import extractAcceptanceCriteria from '../../task-completion-check/utils/extract-acceptance-criteria.js';
import { parseFallbackMetadata } from '../../task-author/utils/parse-fallback-metadata.js';
import extractTaskConstraints from './extract-task-constraints.js';
import { stripParentRollup } from './render-parent-rollup.js';

function labelNames(labels = []) {
  return labels
    .map((label) => (typeof label === 'string' ? label : label?.name))
    .filter(Boolean)
    .sort();
}

function normalizeIssue(issue) {
  if (!issue) return null;
  return {
    id: Number(issue.id) || null,
    number: Number(issue.number) || null,
    title: issue.title || '',
    body: issue.body || '',
    state: String(issue.state || '').toLowerCase(),
    stateReason: issue.state_reason || null,
    type: typeof issue.type === 'string' ? issue.type : (issue.type?.name ?? null),
    labels: labelNames(issue.labels),
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
    type: typeof issue.type === 'string' ? issue.type : (issue.type?.name ?? null),
    url: issue.html_url || issue.url || '',
  };
}

function normalizeField(field) {
  const name =
    field.name ?? field.issue_field_name ?? field.field?.name ?? field.issue_field?.name ?? '';
  const type = field.data_type ?? field.type ?? field.field?.data_type ?? '';
  const value =
    field.single_select_option?.name ??
    field.value?.name ??
    field.value ??
    field.number_value ??
    field.date_value ??
    null;
  return {
    id: Number(field.issue_field_id ?? field.field_id ?? field.id) || null,
    name,
    type,
    value,
  };
}

function normalizedWorkSize(fields, fallback) {
  const native = fields.find((field) => field.name.trim().toLowerCase() === 'work size');
  const nativeValue = native ? Number(native.value) : null;
  const fallbackValue = fallback['work-size'] === undefined ? null : Number(fallback['work-size']);
  if (Number.isInteger(nativeValue)) {
    return {
      value: nativeValue,
      source: 'native',
      conflict:
        Number.isInteger(fallbackValue) && fallbackValue !== nativeValue
          ? { native: nativeValue, fallback: fallbackValue }
          : null,
    };
  }
  if (Number.isInteger(fallbackValue)) {
    return { value: fallbackValue, source: 'fallback', conflict: null };
  }
  return { value: null, source: 'unavailable', conflict: null };
}

function normalizeComment(comment) {
  return {
    author: comment.user?.login ?? comment.author?.login ?? '',
    body: comment.body || '',
    createdAt: comment.created_at || comment.createdAt || '',
    url: comment.html_url || comment.url || '',
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
  const normalizedFields = fields.map(normalizeField);
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
      workSize: normalizedWorkSize(normalizedFields, parsedFallback.fallback),
    },
    acceptanceCriteria,
    constraints: extractTaskConstraints(parsedFallback.body),
    comments: comments.map(normalizeComment),
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
