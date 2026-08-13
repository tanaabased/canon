import { highestSchemaStatus } from './schema-status.js';

function findNamed(values, name) {
  return values.find((value) => value.name.toLowerCase() === name.toLowerCase());
}

function normalizeVisibility(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'all') return 'all';
  if (['org_only', 'organization_only', 'organization_members_only'].includes(normalized)) {
    return 'organization_members_only';
  }
  return normalized || null;
}

function names(values) {
  return (values ?? []).map((value) => (typeof value === 'string' ? value : value.name));
}

function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function pinnedTypeNames(issueTypes, fieldName) {
  return issueTypes.values
    .filter(({ pinnedFields = [] }) =>
      pinnedFields.some(({ name }) => name.toLowerCase() === fieldName.toLowerCase()),
    )
    .map(({ name }) => name);
}

/** Compare managed fields while preserving every field that the policy does not own. */
export function compareIssueFields(desiredFields, observedFields, observedTypes, preservedNames) {
  if (observedFields.status !== 'ok') {
    return {
      status: observedFields.status === 'unavailable' ? 'unresolved' : observedFields.status,
      aligned: [],
      missing: [],
      drifted: [],
      migrationRequired: [],
      unmanaged: [],
      unresolved:
        observedFields.status === 'unavailable'
          ? [
              {
                path: 'issueFields',
                reason: observedFields.reason ?? 'Fields could not be inspected.',
              },
            ]
          : [],
    };
  }

  const aligned = [];
  const missing = [];
  const drifted = [];
  const migrationRequired = [];
  const unresolved = [];

  for (const desired of desiredFields) {
    const current = findNamed(observedFields.values, desired.name);
    if (!current) {
      missing.push({ path: `issueFields.${desired.name}`, desired, current: null });
      continue;
    }

    const differences = [];
    let fieldStatus = 'aligned';
    if (current.dataType !== desired.dataType) {
      differences.push({
        property: 'dataType',
        current: current.dataType,
        desired: desired.dataType,
      });
      fieldStatus = 'migration_required';
    }

    const currentOptions = names(current.options);
    const desiredOptions = desired.options ?? [];
    if (!sameValues(currentOptions, desiredOptions)) {
      const desiredSet = new Set(desiredOptions);
      const extraOptions = currentOptions.filter((option) => !desiredSet.has(option));
      differences.push({ property: 'options', current: currentOptions, desired: desiredOptions });
      fieldStatus =
        extraOptions.length > 0
          ? 'migration_required'
          : highestSchemaStatus([fieldStatus, 'drifted']);
    }

    const currentVisibility = normalizeVisibility(current.visibility);
    if (currentVisibility !== desired.visibility) {
      differences.push({
        property: 'visibility',
        current: currentVisibility,
        desired: desired.visibility,
      });
      fieldStatus = highestSchemaStatus([fieldStatus, 'drifted']);
    }

    if (observedTypes.status === 'ok') {
      const currentPinnedTypes = pinnedTypeNames(observedTypes, desired.name);
      if (!sameValues([...currentPinnedTypes].sort(), [...desired.pinnedIssueTypes].sort())) {
        differences.push({
          property: 'pinnedIssueTypes',
          current: currentPinnedTypes,
          desired: desired.pinnedIssueTypes,
        });
        fieldStatus = highestSchemaStatus([fieldStatus, 'drifted']);
      }
    } else {
      unresolved.push({
        path: `issueFields.${desired.name}.pinnedIssueTypes`,
        reason: 'Issue type pinning could not be inspected.',
      });
      fieldStatus = highestSchemaStatus([fieldStatus, 'unresolved']);
    }

    const record = {
      path: `issueFields.${desired.name}`,
      id: current.id ?? null,
      differences,
      current,
      desired,
    };
    if (fieldStatus === 'aligned') aligned.push({ name: desired.name, id: current.id ?? null });
    else if (fieldStatus === 'migration_required') migrationRequired.push(record);
    else if (fieldStatus === 'drifted') drifted.push(record);
  }

  const desiredNames = new Set(desiredFields.map(({ name }) => name.toLowerCase()));
  const preserved = new Set(preservedNames.map((name) => name.toLowerCase()));
  const unmanaged = observedFields.values
    .filter(({ name }) => !desiredNames.has(name.toLowerCase()))
    .map((field) => ({
      ...field,
      classification: preserved.has(field.name.toLowerCase()) ? 'preserved_unmanaged' : 'unmanaged',
    }));

  const status = highestSchemaStatus([
    unresolved.length > 0 ? 'unresolved' : 'aligned',
    migrationRequired.length > 0 ? 'migration_required' : 'aligned',
    drifted.length > 0 ? 'drifted' : 'aligned',
    missing.length > 0 ? 'missing' : 'aligned',
  ]);
  return { status, aligned, missing, drifted, migrationRequired, unmanaged, unresolved };
}
