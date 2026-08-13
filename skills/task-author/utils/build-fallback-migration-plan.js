import { METADATA_DEFINITIONS, TASK_KINDS, displayValue } from '../lib/task-author-contract.js';
import { renderMigratedTaskBody } from './render-migrated-task-body.js';

function findNamed(values, name) {
  return values.find((value) => String(value.name).toLowerCase() === String(name).toLowerCase());
}

function fieldValue(field) {
  if (field?.data_type === 'single_select') return field.single_select_option?.name ?? field.value;
  return field?.value;
}

function comparable(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function labels(issue) {
  return (issue.labels ?? []).map((label) => (typeof label === 'string' ? label : label.name));
}

/** Build a two-phase fallback-to-native migration plan with conflict preservation. */
export function buildFallbackMigrationPlan(target, capabilities, current, parsed) {
  const blockers = [...parsed.errors];
  const conflicts = [];
  const unavailable = [];
  const removableKeys = [];
  const fieldWrites = [];
  const expectedFields = [];
  let typeWrite = null;
  let expectedType = null;

  for (const [fallbackKey, value] of Object.entries(parsed.fallback)) {
    if (fallbackKey === 'type') {
      if (capabilities.issueTypes?.status !== 'ok') {
        unavailable.push({ key: fallbackKey, reason: 'Native issue types are unavailable.' });
        continue;
      }
      const desiredName = TASK_KINDS[String(value).toLowerCase()];
      const available = findNamed(capabilities.issueTypes.values, desiredName);
      if (!available) {
        unavailable.push({ key: fallbackKey, reason: `Issue type ${desiredName} is unavailable.` });
        continue;
      }
      const observed =
        typeof current.issue.type === 'string' ? current.issue.type : current.issue.type?.name;
      if (observed && comparable(observed) !== comparable(desiredName)) {
        conflicts.push({ key: fallbackKey, native: observed, fallback: value });
        continue;
      }
      expectedType = desiredName;
      if (!observed) typeWrite = desiredName;
      removableKeys.push(fallbackKey);
      continue;
    }

    const entry = Object.entries(METADATA_DEFINITIONS).find(
      ([key, definition]) => key !== 'type' && definition.fallbackKey === fallbackKey,
    );
    if (!entry || capabilities.issueFields?.status !== 'ok') {
      unavailable.push({ key: fallbackKey, reason: 'A compatible native field is unavailable.' });
      continue;
    }
    const [, definition] = entry;
    const field = findNamed(capabilities.issueFields.values, definition.fieldName);
    if (!field || String(field.data_type).toLowerCase() !== definition.fieldType) {
      unavailable.push({ key: fallbackKey, reason: 'A compatible native field is unavailable.' });
      continue;
    }
    let desired = value;
    if (definition.fieldType === 'single_select') {
      const option = findNamed(field.options ?? [], displayValue(value));
      if (!option) {
        unavailable.push({
          key: fallbackKey,
          reason: `Native option ${displayValue(value)} is unavailable.`,
        });
        continue;
      }
      desired = option.name;
    }
    const observedField = current.fields.find(
      (candidate) =>
        Number(candidate.issue_field_id ?? candidate.field_id ?? candidate.id) === Number(field.id),
    );
    const observed = fieldValue(observedField);
    if (
      observed !== undefined &&
      observed !== null &&
      comparable(observed) !== comparable(desired)
    ) {
      conflicts.push({ key: fallbackKey, native: observed, fallback: value });
      continue;
    }
    const expected = {
      id: Number(field.id),
      name: field.name,
      type: definition.fieldType,
      value: desired,
    };
    expectedFields.push(expected);
    if (observed === undefined || observed === null) {
      fieldWrites.push({ field_id: expected.id, value: expected.value });
    }
    removableKeys.push(fallbackKey);
  }

  const body = renderMigratedTaskBody(parsed.body, parsed.fallback, removableKeys);
  const nativeMutation = {
    ...(typeWrite ? { type: typeWrite } : {}),
    ...(fieldWrites.length > 0 ? { issue_field_values: fieldWrites } : {}),
  };
  const bodyMutation = body === current.issue.body ? {} : { body };
  return {
    blockers,
    plan: {
      target: `${target.slug}#${target.issueNumber}`,
      issue: {
        title: current.issue.title,
        body,
        labels: labels(current.issue),
        ...(expectedType ? { type: expectedType } : {}),
      },
      phases: [
        { name: 'write native values', mutation: nativeMutation },
        { name: 'remove verified fallback keys', mutation: bodyMutation },
      ],
      removableKeys,
      conflicts,
      unavailable,
      comments: [],
      expected: { type: expectedType, fields: expectedFields, labels: labels(current.issue) },
    },
  };
}
