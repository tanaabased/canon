import assert from 'node:assert/strict';

import { calculateTaskScore } from '../utils/calculate-task-score.js';
import { buildTaskAssessment } from '../utils/build-task-assessment.js';
import { classifyTaskLabels } from '../utils/classify-task-labels.js';
import { normalizeTaskMetadata } from '../utils/normalize-task-metadata.js';
import { normalizeTaskTarget } from '../utils/normalize-task-target.js';
import { renderFallbackMetadata } from '../utils/render-fallback-metadata.js';
import { renderTaskBody } from '../utils/render-task-body.js';
import { renderTaskScoreComment } from '../utils/render-task-comments.js';
import { completeBugSections } from '../../../test/task-management-fixtures.js';

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
    const invalid = normalizeTaskMetadata({ workSize: 4, impact: 'huge', targetDate: 'soon' });
    assert.equal(invalid.errors.length, 3);
  });

  it('should render canonical Bug headings and identify missing evidence', () => {
    const complete = renderTaskBody('bug', completeBugSections);
    assert.match(complete.body, /^## Observed behavior/);
    assert.match(complete.body, /## Reproduction or evidence/);
    assert.deepEqual(complete.missing, []);

    const incomplete = renderTaskBody('bug', { ...completeBugSections, reproduction: '' });
    assert.deepEqual(incomplete.missing, ['reproduction']);
    assert.match(incomplete.body, /## Reproduction or evidence\n\n## Impact/);
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
    assert.doesNotMatch(block, /target-date|null/);
    assert.equal(renderFallbackMetadata({}), '');
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

  it('should satisfy T15 score boundaries and leave insufficient evidence unset', () => {
    const cases = [
      ['very-high', 'immediate', 'foundational', 'high', 1, 100],
      ['low', 'none', 'none', 'high', 1, 15],
      ['very-high', 'high', 'foundational', 'high', 13, 67],
      ['very-high', 'high', 'foundational', 'high', 21, 64],
    ];
    for (const [impact, urgency, enablement, confidence, workSize, expected] of cases) {
      assert.equal(
        calculateTaskScore({ impact, urgency, enablement, confidence, workSize }).score,
        expected,
      );
    }
    assert.equal(
      calculateTaskScore({
        impact: 'high',
        urgency: 'high',
        enablement: 'none',
        workSize: 3,
      }).score,
      null,
    );
  });

  it('should render a collapsed advisory scoring audit without private planning fields', () => {
    const scoring = calculateTaskScore({
      impact: 'high',
      urgency: 'moderate',
      enablement: 'substantial',
      confidence: 'high',
      workSize: 5,
    });
    const comment = renderTaskScoreComment(scoring, {
      impact: 'A major workflow becomes more reliable.',
    });

    assert.match(comment, /^<details>\n<summary>Automated task assessment — advisory/);
    assert.match(comment, /not a delivery commitment/);
    assert.match(comment, /- Formula: `task-score\/v1`/);
    assert.match(comment, /<\/details>\n$/);
    assert.doesNotMatch(comment, /Priority|Complexity|Start date|Target date/);
  });

  it('should require provenance for estimates and reserve Priority for humans or policy', () => {
    const scoring = calculateTaskScore({
      impact: 'high',
      urgency: 'moderate',
      enablement: 'some',
      confidence: 'high',
      workSize: 3,
    });
    const accepted = buildTaskAssessment(
      { priority: 'high', workSize: 3, complexity: 'medium', impact: 'high' },
      scoring,
      {
        priority: { source: 'human', rationale: 'A maintainer selected this override.' },
        workSize: { source: 'agent', rationale: 'The change is bounded and multi-step.' },
        complexity: { source: 'agent', rationale: 'Several concerns interact.' },
        impact: { source: 'agent', rationale: 'A major workflow becomes more reliable.' },
        urgency: { source: 'agent', rationale: 'The cost recurs during releases.' },
        enablement: { source: 'agent', rationale: 'One follow-up becomes possible.' },
        confidence: { source: 'agent', rationale: 'The evidence is directly reproducible.' },
      },
    );

    assert.deepEqual(accepted.errors, []);
    assert.equal(accepted.values.priority.source, 'human');
    assert.equal(accepted.values.complexity.source, 'agent');
    assert.equal(accepted.values.taskScore.source, 'derived');

    const rejected = buildTaskAssessment(
      { priority: 'high' },
      { score: null, factors: {} },
      {
        priority: { source: 'agent', rationale: 'The agent prefers this order.' },
      },
    );
    assert.ok(rejected.errors.some((error) => error.includes('human- or policy-controlled')));
  });
});
