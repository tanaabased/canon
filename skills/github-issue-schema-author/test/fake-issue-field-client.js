import policy from '../../../references/task-management-schema.json' with { type: 'json' };
import { desiredOptionColor } from '../utils/desired-option-color.js';

const TYPE_NAMES = Object.freeze(['Task', 'Bug', 'Feature']);
const COLOR_FIELD_NAMES = Object.freeze(['Work size', 'Complexity', 'Impact']);
const PUBLIC_FIELD_NAMES = Object.freeze(['Work size', 'Complexity', 'Impact']);

function unpinnedIssueTypes() {
  return TYPE_NAMES.map((name) => ({ id: `type-${name}`, name, enabled: true, pinnedFields: [] }));
}

function inspection(target, { fields, fieldsStatus = 'ok', ownerType = 'Organization', types }) {
  const organizationOwned = ownerType === 'Organization';
  const applicableTypes = types ?? unpinnedIssueTypes();
  return {
    repository: {
      slug: target.slug,
      ownerLogin: target.owner,
      ownerType,
      private: false,
      viewerCanSeeIssueFields: organizationOwned && fieldsStatus === 'ok',
    },
    organizationIssueTypes: organizationOwned
      ? { status: 'ok', values: structuredClone(applicableTypes) }
      : { status: 'not_applicable', values: [] },
    repositoryIssueTypes: organizationOwned
      ? { status: 'ok', values: structuredClone(applicableTypes) }
      : { status: 'not_applicable', values: [] },
    issueFields: !organizationOwned
      ? { status: 'not_applicable', values: [] }
      : fieldsStatus === 'ok'
        ? { status: 'ok', values: structuredClone(fields) }
        : { status: 'unavailable', values: [], reason: 'Issue fields are unavailable.' },
    repositoryLabels: { status: 'ok', values: [] },
    organizationDefaultLabels: { status: 'manual', reason: 'No public listing API.' },
    warnings: [],
  };
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

export function allManagedFields() {
  const desired = policy.issueFields.filter(({ name }) =>
    ['Work size', 'Complexity', 'Impact'].includes(name),
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
        color: desiredOptionColor(field, name),
        description: '',
      })),
    })),
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
      return inspection(target, { fields: state.fields, fieldsStatus, ownerType });
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

function colorFields(useCanonicalColors = false) {
  let fieldId = 100;
  let optionId = 1000;
  return policy.issueFields
    .filter(({ name }) => COLOR_FIELD_NAMES.includes(name))
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

export function grayFieldColorState() {
  return colorFields(false);
}

export function fakeFieldColorClient({
  canonical = false,
  failAt = null,
  ownerType = 'Organization',
  stateFields = colorFields(canonical),
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
      return inspection(target, { fields: state.fields, ownerType });
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

export function fakeFieldVisibilityClient({ failAt = null, canonical = false } = {}) {
  const calls = [];
  const state = {
    fields: allManagedFields().map((field, index) => ({
      ...structuredClone(field),
      id: 700 + index,
      visibility: canonical || !PUBLIC_FIELD_NAMES.includes(field.name) ? field.visibility : 'all',
      options: (field.options ?? []).map((option, optionIndex) => ({
        ...option,
        id: 7000 + index * 100 + optionIndex,
        priority: optionIndex + 1,
      })),
    })),
  };
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
      return inspection(target, { fields: state.fields });
    },
    listIssueFields(organization) {
      calls.push({ operation: 'listIssueFields', organization });
      return { ok: true, value: structuredClone(state.fields) };
    },
    updateIssueFieldVisibility(organization, fieldId, visibility) {
      updateCount += 1;
      calls.push({ operation: 'updateIssueFieldVisibility', organization, fieldId, visibility });
      if (failAt === updateCount) {
        return {
          ok: false,
          error: `PATCH /orgs/${organization}/issue-fields/${fieldId}: HTTP 403`,
        };
      }
      const field = state.fields.find(({ id }) => id === fieldId);
      field.visibility = visibility;
      return { ok: true, value: structuredClone(field) };
    },
  };
}

export function fakeLabelClient({ labels = [], failAt = null } = {}) {
  const calls = [];
  const state = { labels: structuredClone(labels) };
  let writeCount = 0;
  return {
    calls,
    state,
    ensureAvailable() {
      calls.push('ensureAvailable');
      return [];
    },
    inspect(target) {
      calls.push(`inspect:${target.slug}`);
      const report = inspection(target, { fields: allManagedFields() });
      report.repositoryLabels = { status: 'ok', values: structuredClone(state.labels) };
      return report;
    },
    createLabel(target, payload) {
      writeCount += 1;
      calls.push({ operation: 'createLabel', target: target.slug, payload });
      if (failAt === writeCount) return { ok: false, error: 'POST label: HTTP 403' };
      const label = {
        id: `label-${payload.name}`,
        ...structuredClone(payload),
        default: false,
        issueCount: 0,
        pullRequestCount: 0,
      };
      state.labels.push(label);
      return { ok: true, value: label };
    },
    updateLabel(target, name, payload) {
      writeCount += 1;
      calls.push({ operation: 'updateLabel', target: target.slug, name, payload });
      if (failAt === writeCount) return { ok: false, error: 'PATCH label: HTTP 403' };
      const label = state.labels.find((candidate) => candidate.name === name);
      Object.assign(label, structuredClone(payload));
      return { ok: true, value: structuredClone(label) };
    },
  };
}

function pinningFields() {
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

function pinnedIssueTypes(fields, canonical, extraPinnedNames) {
  const field = (name) => {
    const match = fields.find((candidate) => candidate.name === name);
    return { id: match?.id ?? `field-${name}`, name };
  };
  return TYPE_NAMES.map((name) => {
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
  const fields = pinningFields();
  const types = pinnedIssueTypes(fields, canonical, extraPinnedNames);
  return {
    calls,
    ensureAvailable() {
      calls.push('ensureAvailable');
      return [];
    },
    inspect(target) {
      calls.push(`inspect:${target.slug}`);
      return inspection(target, { fields, types });
    },
    listIssueFields(organization) {
      calls.push({ operation: 'listIssueFields', organization });
      return {
        ok: true,
        value: fields.map(({ id, restId, name }) => ({ id: restId, nodeId: id, name })),
      };
    },
  };
}
