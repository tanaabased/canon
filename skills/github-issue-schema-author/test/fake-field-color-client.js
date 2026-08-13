import policy from '../../../references/task-management-schema.json' with { type: 'json' };
import { desiredOptionColor } from '../utils/desired-option-color.js';

const COLOR_FIELDS = ['Work size', 'Complexity', 'Impact'];

function issueTypes() {
  return ['Task', 'Bug', 'Feature'].map((name) => ({
    id: `type-${name}`,
    name,
    enabled: true,
    pinnedFields: [],
  }));
}

function fields(useCanonicalColors = false) {
  let fieldId = 100;
  let optionId = 1000;
  return policy.issueFields
    .filter(({ name }) => COLOR_FIELDS.includes(name))
    .map((field) => ({
      id: fieldId++,
      name: field.name,
      description: field.description,
      dataType: field.dataType,
      visibility: field.visibility,
      options: field.options.map((name, index) => ({
        id: optionId++,
        name,
        description: `${field.name} ${name}`,
        color: useCanonicalColors ? desiredOptionColor(field, name) : 'gray',
        priority: index + 1,
      })),
    }));
}

export function fakeFieldColorClient({
  canonical = false,
  failAt = null,
  ownerType = 'Organization',
  stateFields = fields(canonical),
} = {}) {
  const calls = [];
  const state = { fields: structuredClone(stateFields) };
  let updateCount = 0;
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
          viewerCanSeeIssueFields: ownerType === 'Organization',
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
          ownerType === 'Organization'
            ? { status: 'ok', values: structuredClone(state.fields) }
            : { status: 'not_applicable', values: [] },
        repositoryLabels: { status: 'ok', values: [] },
        organizationDefaultLabels: { status: 'manual', reason: 'No public listing API.' },
        warnings: [],
      };
    },
    listIssueFields(organization) {
      calls.push({ operation: 'listIssueFields', organization });
      return { ok: true, value: structuredClone(state.fields) };
    },
    recolorIssueField(organization, fieldId, options) {
      updateCount += 1;
      calls.push({ operation: 'recolorIssueField', organization, fieldId, options });
      if (failAt === updateCount) {
        return {
          ok: false,
          error: `PATCH /orgs/${organization}/issue-fields/${fieldId}: HTTP 403`,
        };
      }
      const field = state.fields.find(({ id }) => id === fieldId);
      field.options = structuredClone(options);
      return { ok: true, value: structuredClone(field) };
    },
  };
}

export function grayFieldColorState() {
  return fields(false);
}
