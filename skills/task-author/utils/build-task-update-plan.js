import { CANONICAL_LABELS } from '../lib/task-author-contract.js';
import {
  isTaskScoreAuditComment,
  markTaskScoreCommentSuperseding,
} from './render-task-comments.js';

function issueTypeName(issue) {
  return typeof issue?.type === 'string' ? issue.type : (issue?.type?.name ?? null);
}

function labelNames(issue) {
  return (issue?.labels ?? [])
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter(Boolean);
}

function observedFieldValue(field) {
  if (field?.data_type === 'single_select') return field.single_select_option?.name ?? field.value;
  return field?.value;
}

function comparable(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function sameLabels(left, right) {
  const normalized = (values) => [...values].map((value) => value.toLowerCase()).sort();
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function reconciledLabels(issue, desired) {
  const canonical = new Set(Object.keys(CANONICAL_LABELS));
  const retained = labelNames(issue).filter(
    (name) => !canonical.has(name.toLowerCase()) || desired.includes(name.toLowerCase()),
  );
  for (const name of desired) {
    if (!retained.some((current) => current.toLowerCase() === name.toLowerCase()))
      retained.push(name);
  }
  return retained;
}

function nativeValue(field) {
  return field.type === 'single_select' ? (field.value?.name ?? field.value) : field.value;
}

/** Build an exact existing-issue PATCH while preserving unmanaged labels and comments. */
export function buildTaskUpdatePlan(draft, current, { revisionSummary = '' } = {}) {
  const errors = [];
  const labels = reconciledLabels(current.issue, draft.labels.apply);
  const hasPreviousScoreAudit = current.comments.some(({ body }) => isTaskScoreAuditComment(body));
  const desiredComments = draft.comments.map(({ kind, body }) => ({
    kind,
    body:
      kind === 'task-score' && hasPreviousScoreAudit ? markTaskScoreCommentSuperseding(body) : body,
  }));
  const comments = desiredComments
    .filter(({ body }) => !current.comments.some((comment) => comment.body === body))
    .map(({ kind, body }) => ({ kind, body }));
  if (revisionSummary.trim()) {
    comments.unshift({
      kind: 'revision-summary',
      body: `Task revision summary\n\n${revisionSummary.trim()}\n`,
    });
  }

  const expectedFields = draft.metadata.native.fields.map((field) => {
    const id = Number(field.id);
    if (!Number.isInteger(id) || id <= 0) {
      errors.push(`Native issue field ${field.name} does not expose a writable numeric id.`);
    }
    return { id, name: field.name, type: field.type, value: nativeValue(field) };
  });

  const changedFields = expectedFields.filter((expected) => {
    const observed = current.fields.find(
      (field) => Number(field.issue_field_id ?? field.field_id ?? field.id) === expected.id,
    );
    return comparable(observedFieldValue(observed)) !== comparable(expected.value);
  });

  const desiredType = draft.metadata.native.type?.name ?? null;
  const mutation = {};
  if (draft.title !== current.issue.title) mutation.title = draft.title;
  if (draft.body !== current.issue.body) mutation.body = draft.body;
  if (desiredType && comparable(issueTypeName(current.issue)) !== comparable(desiredType)) {
    mutation.type = desiredType;
  }
  if (!sameLabels(labelNames(current.issue), labels)) mutation.labels = labels;
  if (changedFields.length > 0) {
    mutation.issue_field_values = changedFields.map(({ id, value }) => ({
      field_id: id,
      value,
    }));
  }

  const changes = Object.entries(mutation).map(([property, after]) => ({
    property,
    before:
      property === 'issue_field_values'
        ? current.fields
        : property === 'labels'
          ? labelNames(current.issue)
          : property === 'type'
            ? issueTypeName(current.issue)
            : current.issue[property],
    after,
  }));

  return {
    errors,
    plan: {
      target: `${draft.target.slug}#${draft.target.issueNumber}`,
      issue: {
        title: draft.title,
        body: draft.body,
        ...(desiredType ? { type: desiredType } : {}),
        labels,
      },
      mutation,
      changes,
      comments,
      expected: { type: desiredType, fields: expectedFields, labels },
    },
  };
}
