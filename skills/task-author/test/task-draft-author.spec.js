import assert from 'node:assert/strict';

import { authorTaskDraft } from '../lib/task-draft-author.js';
import fixtures, {
  completeBugSections,
  completeFeatureSections,
  fakeClient,
  organizationCapabilities,
} from '../../../test/task-management-fixtures.js';

describe('skills/task-author/lib/task-draft-author', () => {
  for (const fixture of fixtures) {
    it(`should satisfy ${fixture.id} without mutating GitHub`, () => {
      const client = fakeClient(fixture.capabilities);
      const report = authorTaskDraft(fixture.input, { githubClient: client });

      assert.equal(report.mutatesGitHub, false);
      assert.equal(report.assessment.errors.length, 0);
      assert.equal(report.metadata.native.fields.length, fixture.expected.nativeFields);
      assert.deepEqual(report.labels.apply, fixture.expected.labels);
      if (fixture.expected.fallback) {
        assert.deepEqual(report.metadata.fallback, fixture.expected.fallback);
      }
      assert.deepEqual(report.comments, []);
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
      assert.match(report.body, /schema: tanaab\/task-metadata\/v2/);
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
    assert.deepEqual(report.labels.apply, ['needs triage']);
    assert.equal(report.questions.length, 4);
  });

  it('should satisfy T08 without inventing reproduction or estimates', () => {
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
    assert.ok(report.assessment.errors.some((error) => error.includes('assessment.impact')));
    assert.deepEqual(report.labels.apply, ['needs triage', 'needs reproduction']);
    assert.match(report.body, /## Reproduction or evidence\n\n## Impact/);
  });

  it('should keep an oversized Feature unready pending decomposition', () => {
    const report = authorTaskDraft(
      {
        target: 'acme/widgets',
        title: 'bundle task inspection, reporting, and automation',
        kind: 'Feature',
        sections: {
          ...completeFeatureSections,
          inScope: ['Task inspection', 'Reporting dashboards', 'Automation triggers'],
        },
        metadata: { workSize: 13 },
        assessment: {
          workSize: {
            source: 'agent',
            rationale: 'The request spans three independently deliverable capabilities.',
          },
        },
        actionable: false,
      },
      { githubClient: fakeClient(organizationCapabilities()) },
    );

    assert.equal(report.status, 'needs_input');
    assert.ok(report.warnings.some((warning) => warning.includes('decomposition review')));
    assert.deepEqual(report.labels.apply, ['needs triage']);
  });

  it('should satisfy T11 with a partial capsule and no duplicate native values', () => {
    const fixture = fixtures.find(({ id }) => id === 'T11');
    const report = authorTaskDraft(fixture.input, {
      githubClient: fakeClient(fixture.capabilities),
    });

    assert.deepEqual(report.metadata.fallback, {
      complexity: 'low',
      impact: 'medium',
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

  it('should satisfy T14 with policy-controlled Priority provenance', () => {
    const fixture = fixtures.find(({ id }) => id === 'T14');
    const report = authorTaskDraft(fixture.input, {
      githubClient: fakeClient(fixture.capabilities),
    });
    assert.equal(report.assessment.values.priority.source, 'policy');
    assert.match(report.assessment.values.priority.rationale, /contractual sequencing policy/);
    assert.deepEqual(report.comments, []);
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
    assert.equal(report.metadata.unresolved.length, 4);
    assert.equal(report.status, 'partial');
  });
});
