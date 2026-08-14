function fieldId(field) {
  return Number(field?.field_id ?? field?.issue_field_id ?? field?.id);
}

function observedValue(field) {
  if (field?.data_type === 'single_select') {
    return field.single_select_option?.name ?? field.value;
  }
  return field?.value;
}

function replacement(field, value = observedValue(field)) {
  const id = fieldId(field);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('An issue field value does not expose a writable numeric field id.');
  }
  if (value === undefined) {
    throw new Error(`Issue field ${id} does not expose a preservable value.`);
  }
  return { field_id: id, value };
}

/** Merge desired writes into the complete observed replacement set required by GitHub. */
export function buildReplacementIssueFieldValues(currentFields = [], desiredWrites = []) {
  const values = new Map(
    currentFields.map((field) => {
      const entry = replacement(field);
      return [entry.field_id, entry];
    }),
  );
  for (const desired of desiredWrites) {
    const entry = replacement(desired, desired.value);
    values.set(entry.field_id, entry);
  }
  return [...values.values()];
}
