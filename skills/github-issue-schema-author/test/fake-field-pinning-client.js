import policy from '../../../references/task-management-schema.json' with { type: 'json' };
import { desiredOptionColor } from '../utils/desired-option-color.js';

function fields() {
  const managed = policy.issueFields.map((field, index) => ({
    id: `field-${field.name}`,
    restId: 500 + index,
    name: field.name,
    description: field.description ?? '',
    dataType: field.dataType,
    visibility: field.visibility,
    options: (field.options ?? []).map((name) => ({
      id: `option-${field.name}-${name}`,
      name,
      description: '',
      color: desiredOptionColor(field, name),
    })),
  }));
  return [
    ...managed,
    {
      id: 'field-Effort',
      restId: 599,
      name: 'Effort',
      description: 'Relative level of effort',
      dataType: 'single_select',
      visibility: 'organization_members_only',
      options: [],
    },
  ];
}

function issueTypes(stateFields, canonical, extraPinnedNames) {
  const field = (name) => {
    const match = stateFields.find((candidate) => candidate.name === name);
    return { id: match?.id ?? `field-${name}`, name };
  };
  return ['Task', 'Bug', 'Feature'].map((name) => {
    const managed = canonical
      ? policy.issueFields.map(({ name: fieldName }) => field(fieldName))
      : [
          field('Priority'),
          ...(name === 'Feature' ? [field('Start date'), field('Target date')] : []),
        ];
    return {
      id: `type-${name}`,
      name,
      enabled: true,
      pinnedFields: [...managed, field('Effort'), ...extraPinnedNames.map(field)],
    };
  });
}

export function fakeFieldPinningClient({ canonical = false, extraPinnedNames = [] } = {}) {
  const calls = [];
  const stateFields = fields();
  const types = issueTypes(stateFields, canonical, extraPinnedNames);
  return {
    calls,
    ensureAvailable() {
      calls.push('ensureAvailable');
      return [];
    },
    inspect(target) {
      calls.push(`inspect:${target.slug}`);
      return {
        repository: {
          slug: target.slug,
          ownerLogin: target.owner,
          ownerType: 'Organization',
          private: false,
          viewerCanSeeIssueFields: true,
        },
        organizationIssueTypes: { status: 'ok', values: structuredClone(types) },
        repositoryIssueTypes: { status: 'ok', values: structuredClone(types) },
        issueFields: { status: 'ok', values: structuredClone(stateFields) },
        repositoryLabels: { status: 'ok', values: [] },
        organizationDefaultLabels: { status: 'manual', reason: 'No public listing API.' },
        warnings: [],
      };
    },
    listIssueFields(organization) {
      calls.push({ operation: 'listIssueFields', organization });
      return {
        ok: true,
        value: stateFields.map(({ id, restId, name }) => ({ id: restId, nodeId: id, name })),
      };
    },
  };
}
