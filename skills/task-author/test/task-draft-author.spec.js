import assert from 'node:assert/strict';

import { authorTaskDraft } from '../lib/task-draft-author.js';
import fixtures, {
  completeBugSections,
  fakeClient,
  organizationCapabilities,
} from '../../../test/task-management-fixtures.js';

describe('Task Author T01-T15 draft fixtures', () => {
  for (const fixture of fixtures) {
    it(`should satisfy ${fixture.id} without mutating GitHub`, () => {
      const client = fakeClient(fixture.capabilities);
      const report = authorTaskDraft(fixture.input, { githubClient: client });

      assert.equal(report.mutatesGitHub, false);
      assert.equal(report.scoring.score, fixture.expected.score);
      assert.equal(report.assessment.errors.length, 0);
      assert.equal(report.assessment.values.taskScore.source, 'derived');
      assert.equal(report.metadata.native.fields.length, fixture.expected.nativeFields);
      assert.deepEqual(report.labels.apply, fixture.expected.labels);
      if (fixture.expected.fallback) {
        assert.deepEqual(report.metadata.fallback, fixture.expected.fallback);
      }
      assert.equal(
        report.comments.some((comment) => comment.kind === 'task-score'),
        true,
      );
      assert.deepEqual(client.calls, [
        'ensureAvailable',
        `inspectRepository:${report.target.slug}`,
      ]);
    });
  }

  it('should satisfy T04-T06 by keeping personal-repository metadata entirely in fallback', () => {
    for (const fixture of fixtures.filter(({ id }) => ['T04', 'T05', 'T06'].includes(id))) {
      const report = authorTaskDraft(fixture.input, {
        githubClient: fakeClient(fixture.capabilities),
      });
      assert.equal(report.metadata.native.type, null);
      assert.equal(report.metadata.native.fields.length, 0);
      assert.equal(report.metadata.fallback.type, fixture.input.kind.toLowerCase());
      assert.match(report.body, /schema: tanaab\/task-metadata\/v1/);
    }
  });

  it('should satisfy T07 by preserving underspecified evidence and refusing classification', () => {
    const report = authorTaskDraft(
      {
        target: 'acme/widgets#81',
        title: 'make sync better',
        originalBody: 'sync is annoying and should be improved',
        actionable: false,
        questions: [
          'Which task kind fits?',
          'What is the current condition?',
          'What outcome is desired?',
          'What observable acceptance evidence is required?',
        ],
      },
      { githubClient: fakeClient(organizationCapabilities()) },
    );

    assert.equal(report.status, 'needs_input');
    assert.equal(report.taskKind, null);
    assert.equal(report.body, 'sync is annoying and should be improved');
    assert.deepEqual(report.metadata.values, {});
    assert.equal(report.scoring.score, null);
    assert.deepEqual(report.labels.apply, ['needs triage']);
    assert.equal(report.questions.length, 4);
  });

  it('should satisfy T08 without inventing reproduction, estimates, or score', () => {
    const report = authorTaskDraft(
      {
        target: 'acme/widgets#82',
        title: 'restore task output',
        kind: 'Bug',
        sections: { ...completeBugSections, reproduction: '' },
        metadata: { impact: 'high' },
        actionable: false,
        reproductionAvailable: false,
      },
      { githubClient: fakeClient(organizationCapabilities()) },
    );

    assert.equal(report.status, 'needs_input');
    assert.equal(report.metadata.values.workSize, undefined);
    assert.equal(report.metadata.values.complexity, undefined);
    assert.equal(report.scoring.score, null);
    assert.ok(report.assessment.errors.some((error) => error.includes('assessment.impact')));
    assert.deepEqual(report.labels.apply, ['needs triage', 'needs reproduction']);
    assert.match(report.body, /## Reproduction or evidence\n\n## Impact/);
  });

  it('should satisfy T11 with a partial capsule and no duplicate native values', () => {
    const fixture = fixtures.find(({ id }) => id === 'T11');
    const report = authorTaskDraft(fixture.input, {
      githubClient: fakeClient(fixture.capabilities),
    });

    assert.deepEqual(report.metadata.fallback, {
      complexity: 'low',
      impact: 'medium',
      'task-score': 37,
    });
    assert.doesNotMatch(report.body.split('fallback:\n')[1], /priority|work-size/);
  });

  it('should satisfy T12 by stopping before repository inspection on an ambiguous target', () => {
    const client = fakeClient(organizationCapabilities());
    assert.throws(
      () => authorTaskDraft({ title: 'add a task', kind: 'Task' }, { githubClient: client }),
      /ambiguous.*OWNER\/REPO/i,
    );
    assert.deepEqual(client.calls, ['ensureAvailable', 'resolveCurrentRepository']);
  });

  it('should satisfy T13 with an explicit decomposition warning', () => {
    const fixture = fixtures.find(({ id }) => id === 'T13');
    const report = authorTaskDraft(fixture.input, {
      githubClient: fakeClient(fixture.capabilities),
    });
    assert.ok(report.warnings.some((warning) => warning.includes('Work size 21')));
    assert.equal(report.status, 'partial');
  });

  it('should satisfy T14 by previewing a durable Priority override comment', () => {
    const fixture = fixtures.find(({ id }) => id === 'T14');
    const report = authorTaskDraft(fixture.input, {
      githubClient: fakeClient(fixture.capabilities),
    });
    const comment = report.comments.find(({ kind }) => kind === 'priority-override');
    assert.match(comment.body, /contractual sequencing policy/);
    assert.match(comment.body, /Task score remains 22/);
  });

  it('should allow the scoring audit comment to be suppressed without suppressing the score', () => {
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const report = authorTaskDraft(
      { ...fixture.input, publishScoringAudit: false },
      { githubClient: fakeClient(fixture.capabilities) },
    );

    assert.equal(report.scoring.score, fixture.expected.score);
    assert.equal(report.scoring.auditPublication, 'suppressed');
    assert.equal(report.scoring.auditComment, '');
    assert.equal(
      report.comments.some(({ kind }) => kind === 'task-score'),
      false,
    );
  });

  it('should leave fallback eligibility unresolved when field inspection is unavailable', () => {
    const capabilities = organizationCapabilities();
    capabilities.issueFields = { status: 'unavailable', values: [] };
    capabilities.warnings = ['Could not inspect organization issue fields: HTTP 403'];
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const report = authorTaskDraft(fixture.input, {
      githubClient: fakeClient(capabilities),
    });

    assert.deepEqual(report.metadata.fallback, {});
    assert.equal(report.metadata.unresolved.length, 5);
    assert.equal(report.status, 'partial');
  });
});
