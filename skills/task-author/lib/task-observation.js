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
