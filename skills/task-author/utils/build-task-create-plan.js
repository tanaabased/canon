import { createHash } from 'node:crypto';

function nativeFieldValue(field) {
  if (field.type === 'single_select') return field.value?.name ?? field.value;
  return field.value;
}

/** Build the exact GitHub create payload and managed follow-up comments from a task draft. */
export function buildTaskCreatePlan(draft) {
  const errors = [];
  const issueFieldValues = draft.metadata.native.fields.map((field) => {
    const fieldId = Number(field.id);
    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      errors.push(`Native issue field ${field.name} does not expose a writable numeric id.`);
    }
    return {
      field_id: fieldId,
      value: nativeFieldValue(field),
    };
  });

  const issue = {
    title: draft.title,
    body: draft.body,
  };
  if (draft.metadata.native.type) issue.type = draft.metadata.native.type.name;
  if (draft.labels.apply.length > 0) issue.labels = [...draft.labels.apply];
  if (issueFieldValues.length > 0) issue.issue_field_values = issueFieldValues;

  return {
    errors,
    plan: {
      target: draft.target.slug,
      issue,
      comments: draft.comments.map(({ kind, body }) => ({ kind, body })),
      expected: {
        type: draft.metadata.native.type?.name ?? null,
        fields: draft.metadata.native.fields.map((field, index) => ({
          id: issueFieldValues[index].field_id,
          name: field.name,
          type: field.type,
          value: issueFieldValues[index].value,
        })),
        labels: [...draft.labels.apply],
      },
    },
  };
}

/** Bind publication authorization to the exact ordered mutation plan. */
export function taskCreatePlanDigest(plan) {
  return `sha256:${createHash('sha256').update(JSON.stringify(plan)).digest('hex')}`;
}
