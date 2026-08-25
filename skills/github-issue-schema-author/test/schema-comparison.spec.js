import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import policy from '../../../references/task-management-schema.json' with { type: 'json' };
import { classifySchemaLabels } from '../utils/classify-schema-labels.js';
import { compareIssueFields } from '../utils/compare-issue-fields.js';
import { compareIssueTypes } from '../utils/compare-issue-types.js';

function observedField(name, options = [], dataType = 'single_select') {
  return {
    id: `field-${name}`,
    name,
    dataType,
    options: options.map((option) => (typeof option === 'string' ? { name: option } : option)),
    visibility: 'organization_members_only',
  };
}

describe('skills/github-issue-schema-author schema comparison', () => {
  it('should preserve Effort and leave unrelated fields unmanaged', () => {
    const types = {
      status: 'ok',
      values: ['Task', 'Bug', 'Feature'].map((name) => ({
        id: `type-${name}`,
        name,
        enabled: true,
        pinnedFields: [{ name: 'Priority' }, { name: 'Effort' }],
      })),
    };
    const fields = {
      status: 'ok',
      values: [
        observedField('Priority', ['Urgent', 'High', 'Medium', 'Low']),
        observedField('Effort', ['High', 'Medium', 'Low']),
        observedField('External metric', [], 'number'),
        observedField('Start date', [], 'date'),
        observedField('Target date', [], 'date'),
      ],
    };

    const comparison = compareIssueFields(
      policy.issueFields,
      fields,
      types,
      policy.preservedUnmanagedFields,
    );

    assert.equal(comparison.status, 'drifted');
    assert.ok(comparison.missing.some(({ desired }) => desired.name === 'Work size'));
    assert.equal(comparison.migrationRequired.length, 0);
    assert.equal(
      comparison.unmanaged.find(({ name }) => name === 'Effort').classification,
      'preserved_unmanaged',
    );
    assert.equal(
      comparison.unmanaged.find(({ name }) => name === 'External metric').classification,
      'unmanaged',
    );
  });

  it('should report canonical option-color drift without requiring option migration', () => {
    const desired = policy.issueFields.find(({ name }) => name === 'Work size');
    const types = {
      status: 'ok',
      values: ['Task', 'Bug', 'Feature'].map((name) => ({
        id: `type-${name}`,
        name,
        enabled: true,
        pinnedFields: [{ name: 'Work size' }],
      })),
    };
    const workSize = observedField(
      'Work size',
      desired.options.map((name) => ({ name, color: 'gray' })),
    );
    workSize.visibility = 'all';

    const comparison = compareIssueFields(
      policy.issueFields,
      { status: 'ok', values: [workSize] },
      types,
      policy.preservedUnmanagedFields,
    );

    const drift = comparison.drifted.find(({ current }) => current.name === 'Work size');
    assert.ok(drift.differences.some(({ property }) => property === 'optionColors'));
    assert.equal(
      comparison.migrationRequired.some(({ current }) => current.name === 'Work size'),
      false,
    );
  });

  it('should compare organization and repository-effective issue types separately', () => {
    const organization = {
      status: 'ok',
      values: [
        { id: 'task', name: 'Task', enabled: true },
        { id: 'bug', name: 'Bug', enabled: true },
        { id: 'feature', name: 'Feature', enabled: false },
      ],
    };
    const repository = {
      status: 'ok',
      values: [
        { id: 'task', name: 'Task', enabled: true },
        { id: 'bug', name: 'Bug', enabled: true },
      ],
    };

    const comparison = compareIssueTypes(policy.issueTypes, organization, repository);

    assert.equal(comparison.organization.status, 'drifted');
    assert.equal(comparison.repository.status, 'missing');
    assert.equal(comparison.organization.drifted[0].path, 'issueTypes.Feature.enabled');
    assert.equal(comparison.repository.missing[0].path, 'issueTypes.Feature');
  });

  it('should classify canonical, automation, legacy, and project-specific labels without deletion', () => {
    const labels = {
      status: 'ok',
      values: [
        {
          name: 'documentation',
          color: '0075ca',
          description: 'Improvements or additions to documentation',
          issueCount: 2,
          pullRequestCount: 1,
        },
        { name: 'dependencies', color: '0366d6', description: '', issueCount: 0 },
        { name: 'enhancement', color: 'a2eeef', description: '', issueCount: 4 },
        { name: 'release', color: 'ffffff', description: '', issueCount: 3 },
      ],
    };

    const comparison = classifySchemaLabels(policy, labels);

    assert.equal(comparison.status, 'drifted');
    assert.equal(comparison.drifted[0].path, 'labels.documentation');
    assert.equal(comparison.drifted[0].current.associationCount, 3);
    assert.equal(comparison.automationOwned[0].name, 'dependencies');
    assert.equal(comparison.legacyUnmanaged[0].name, 'enhancement');
    assert.equal(comparison.projectSpecificCandidates[0].name, 'release');
    assert.deepEqual(comparison.deletionPlan, []);
  });
});
