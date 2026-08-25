import assert from 'node:assert/strict';

import { buildTaskAssessment } from '../utils/build-task-assessment.js';
import { classifyTaskLabels } from '../utils/classify-task-labels.js';
import { normalizeTaskMetadata } from '../utils/normalize-task-metadata.js';
import { normalizeTaskTarget } from '../utils/normalize-task-target.js';
import { parseFallbackMetadata } from '../utils/parse-fallback-metadata.js';
import { renderFallbackMetadata } from '../utils/render-fallback-metadata.js';
import { renderTaskBody } from '../utils/render-task-body.js';
import {
  completeBugSections,
  completeFeatureSections,
  completeTaskSections,
} from '../../../test/task-management-fixtures.js';

describe('Task Author deterministic utilities', () => {
  it('should normalize explicit repository and issue targets without directory inference', () => {
    assert.deepEqual(normalizeTaskTarget('acme/widgets#42'), {
      owner: 'acme',
      repo: 'widgets',
      slug: 'acme/widgets',
      url: 'https://github.com/acme/widgets',
      issueNumber: 42,
      issueUrl: 'https://github.com/acme/widgets/issues/42',
    });
    assert.equal(normalizeTaskTarget('https://github.com/acme/widgets').slug, 'acme/widgets');
    assert.throws(() => normalizeTaskTarget('widgets'), /OWNER\/REPO/);
    assert.throws(() => normalizeTaskTarget('https://example.com/acme/widgets'), /github.com/);
  });

  it('should reject invalid metadata and preserve unknown values as unset', () => {
    assert.deepEqual(normalizeTaskMetadata({}), { errors: [], values: {} });
    const invalid = normalizeTaskMetadata({
      workSize: 4,
      impact: 'huge',
      targetDate: 'soon',
      taskScore: 52,
    });
    assert.equal(invalid.errors.length, 4);
    assert.ok(invalid.errors.some((error) => error === 'metadata.taskScore is not supported.'));
  });

  it('should render canonical Bug headings and identify missing evidence', () => {
    const complete = renderTaskBody('bug', completeBugSections);
    assert.match(complete.body, /^## Observed behavior/);
    assert.match(complete.body, /## Reproduction or evidence/);
    assert.match(complete.body, /## Delivery and verification/);
    assert.deepEqual(complete.missing, []);

    const incomplete = renderTaskBody('bug', { ...completeBugSections, reproduction: '' });
    assert.deepEqual(incomplete.missing, ['reproduction']);
    assert.match(incomplete.body, /## Reproduction or evidence\n\n## Impact/);

    const withoutDelivery = renderTaskBody('bug', { ...completeBugSections, delivery: '' });
    assert.deepEqual(withoutDelivery.missing, ['delivery']);
    assert.match(withoutDelivery.body, /## Delivery and verification\n\n## Acceptance criteria/);
  });

  it('should render the broad Task delivery contract without requiring exclusions', () => {
    const complete = renderTaskBody('task', completeTaskSections);
    assert.match(complete.body, /^## Context/);
    assert.match(complete.body, /## Outcome/);
    assert.match(complete.body, /## Scope\n\n- Consolidate/);
    assert.match(complete.body, /## Delivery and verification/);
    assert.deepEqual(complete.missing, []);

    const withoutExclusions = renderTaskBody('task', {
      ...completeTaskSections,
      outOfScope: [],
    });
    assert.doesNotMatch(withoutExclusions.body, /### Out of scope/);
  });

  it('should render one bounded Feature with required delivery evidence', () => {
    const complete = renderTaskBody('feature', completeFeatureSections);
    assert.match(complete.body, /^## Problem or opportunity/);
    assert.match(complete.body, /## Scope\n\n### In scope/);
    assert.match(complete.body, /## Delivery and verification/);
    assert.deepEqual(complete.missing, []);

    const withoutDelivery = renderTaskBody('feature', {
      ...completeFeatureSections,
      delivery: '',
    });
    assert.deepEqual(withoutDelivery.missing, ['delivery']);
    assert.match(
      withoutDelivery.body,
      /## Delivery and verification\n\n## Alternatives and constraints/,
    );
  });

  it('should render ordered fallback YAML without unset or native-only concepts', () => {
    const block = renderFallbackMetadata({
      impact: 'very-high',
      type: 'feature',
      'work-size': 8,
      'target-date': null,
    });
    assert.ok(block.indexOf('type: feature') < block.indexOf('work-size: 8'));
    assert.ok(block.indexOf('work-size: 8') < block.indexOf('impact: very-high'));
    assert.match(block, /schema: tanaab\/task-metadata\/v2/);
    assert.doesNotMatch(block, /target-date|null/);
    assert.equal(renderFallbackMetadata({}), '');
  });

  it('should reject older schemas and unsupported fallback keys', () => {
    const parsed = parseFallbackMetadata(`## Context

Legacy capsule.

### Task metadata

\`\`\`yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  complexity: medium
  obsolete-key: 52
\`\`\`
`);

    assert.deepEqual(parsed.errors, [
      'Unsupported fallback key: obsolete-key.',
      'Fallback schema must be tanaab/task-metadata/v2.',
    ]);
    assert.deepEqual(parsed.fallback, { complexity: 'medium' });
  });

  it('should enforce canonical label eligibility and avoid creating missing definitions', () => {
    const report = classifyTaskLabels({
      kind: 'feature',
      metadata: { complexity: 'medium', workSize: 5 },
      signals: { helpWanted: true, goodFirstIssue: true },
      actionable: true,
      hasAcceptanceCriteria: true,
      availableLabels: ['help wanted'],
    });
    assert.deepEqual(report.apply, ['help wanted']);
    assert.deepEqual(report.missing, []);
    assert.ok(report.warnings.some((warning) => warning.includes('good first issue')));
  });

  it('should require provenance for estimates and reserve Priority for humans or policy', () => {
    const accepted = buildTaskAssessment(
      { priority: 'high', workSize: 3, complexity: 'medium', impact: 'high' },
      {
        priority: { source: 'human', rationale: 'A maintainer selected this override.' },
        workSize: { source: 'agent', rationale: 'The change is bounded and multi-step.' },
        complexity: { source: 'agent', rationale: 'Several concerns interact.' },
        impact: { source: 'agent', rationale: 'A major workflow becomes more reliable.' },
      },
    );

    assert.deepEqual(accepted.errors, []);
    assert.equal(accepted.values.priority.source, 'human');
    assert.equal(accepted.values.complexity.source, 'agent');

    const rejected = buildTaskAssessment(
      { priority: 'high' },
      {
        priority: { source: 'agent', rationale: 'The agent prefers this order.' },
      },
    );
    assert.ok(rejected.errors.some((error) => error.includes('human- or policy-controlled')));
  });
});
