import policy from '../../../references/task-management-schema.json' with { type: 'json' };

function issueTypes() {
  return ['Task', 'Bug', 'Feature'].map((name) => ({
    id: `type-${name}`,
    name,
    enabled: true,
    pinnedFields: [],
  }));
}

function existingField(name, dataType, options = []) {
  return {
    id: `field-${name}`,
    name,
    description: '',
    dataType,
    visibility: 'organization_members_only',
    options: options.map((option) => ({ name: option, color: 'gray', description: '' })),
  };
}

export function initialFields() {
  return [
    existingField('Priority', 'single_select', ['Urgent', 'High', 'Medium', 'Low']),
    existingField('Effort', 'single_select', ['High', 'Medium', 'Low']),
    existingField('Start date', 'date'),
    existingField('Target date', 'date'),
  ];
}

export function fakeFieldAdditionClient({
  fields = initialFields(),
  ownerType = 'Organization',
  fieldsStatus = 'ok',
  failAt = null,
} = {}) {
  const calls = [];
  const state = { fields: structuredClone(fields) };
  let createCount = 0;

  return {
    calls,
    state,
    ensureAvailable() {
      calls.push('ensureAvailable');
      return [];
    },
    inspect(target) {
      calls.push(`inspect:${target.slug}`);
      const types = issueTypes();
      return {
        repository: {
          slug: target.slug,
          ownerLogin: target.owner,
          ownerType,
          private: false,
          viewerCanSeeIssueFields: fieldsStatus === 'ok',
        },
        organizationIssueTypes:
          ownerType === 'Organization'
            ? { status: 'ok', values: types }
            : { status: 'not_applicable', values: [] },
        repositoryIssueTypes:
          ownerType === 'Organization'
            ? { status: 'ok', values: types }
            : { status: 'not_applicable', values: [] },
        issueFields:
          ownerType !== 'Organization'
            ? { status: 'not_applicable', values: [] }
            : fieldsStatus === 'ok'
              ? { status: 'ok', values: structuredClone(state.fields) }
              : { status: 'unavailable', values: [], reason: 'Issue fields are unavailable.' },
        repositoryLabels: { status: 'ok', values: [] },
        organizationDefaultLabels: { status: 'manual', reason: 'No public listing API.' },
        warnings: [],
      };
    },
    createIssueField(organization, payload) {
      createCount += 1;
      calls.push({ operation: 'createIssueField', organization, payload });
      if (failAt === createCount) {
        return { ok: false, error: `POST /orgs/${organization}/issue-fields: HTTP 403` };
      }
      const field = {
        id: 1000 + createCount,
        name: payload.name,
        description: payload.description,
        dataType: payload.data_type,
        visibility: payload.visibility,
        options: (payload.options ?? []).map(({ name, color, description }) => ({
          name,
          color,
          description,
        })),
      };
      state.fields.push(field);
      return { ok: true, value: field };
    },
  };
}

export function allManagedFields() {
  const desired = policy.issueFields.filter(({ name }) =>
    ['Work size', 'Complexity', 'Impact', 'Task score'].includes(name),
  );
  return [
    ...initialFields(),
    ...desired.map((field) => ({
      id: `field-${field.name}`,
      name: field.name,
      description: field.description,
      dataType: field.dataType,
      visibility: field.visibility,
      options: (field.options ?? []).map((name) => ({
        name,
        color: 'gray',
        description: '',
      })),
    })),
  ];
}
