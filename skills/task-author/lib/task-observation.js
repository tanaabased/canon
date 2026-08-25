import { WORK_SIZES } from './task-author-contract.js';

function canonicalWorkSize(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const numericValue = Number(value);
  return WORK_SIZES.includes(numericValue) ? numericValue : null;
}

export function observedIssueTypeName(issue) {
  return typeof issue?.type === 'string' ? issue.type : (issue?.type?.name ?? null);
}

export function observedLabelNames(labels = []) {
  if (!Array.isArray(labels)) return [];
  return labels.map((label) => (typeof label === 'string' ? label : label?.name)).filter(Boolean);
}

export function observedIssueFieldValue(field) {
  if (field?.single_select_option?.name !== undefined) return field.single_select_option.name;
  return field?.value;
}

export function normalizeObservedIssueField(field) {
  return {
    id: Number(field.issue_field_id ?? field.field_id ?? field.id) || null,
    name:
      field.issue_field_name ?? field.name ?? field.field?.name ?? field.issue_field?.name ?? '',
    type: field.data_type ?? field.type ?? field.field?.data_type ?? '',
    value:
      field.single_select_option?.name ??
      field.value?.name ??
      field.value ??
      field.number_value ??
      field.date_value ??
      null,
  };
}

export function normalizeObservedComment(comment) {
  return {
    author: comment.user?.login ?? comment.author?.login ?? '',
    body: comment.body || '',
    createdAt: comment.created_at || comment.createdAt || '',
    url: comment.html_url || comment.url || '',
  };
}

export function observedWorkSize(fields, fallback = {}) {
  const native = fields.find(({ name }) => name.trim().toLowerCase() === 'work size');
  const nativeValue = canonicalWorkSize(native?.value);
  const fallbackValue = canonicalWorkSize(fallback['work-size']);
  if (nativeValue !== null) {
    return {
      value: nativeValue,
      source: 'native',
      conflict:
        fallbackValue !== null && fallbackValue !== nativeValue
          ? { native: nativeValue, fallback: fallbackValue }
          : null,
    };
  }
  if (fallbackValue !== null) {
    return { value: fallbackValue, source: 'fallback', conflict: null };
  }
  return { value: null, source: 'unavailable', conflict: null };
}
