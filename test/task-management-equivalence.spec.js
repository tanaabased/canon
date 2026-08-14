import assert from 'node:assert/strict';

import { authorIssueForm } from '../skills/github-issue-form-author/lib/issue-form-author.js';
import { normalizeIssueFormSubmission } from '../skills/github-issue-form-author/lib/issue-form-normalizer.js';
import { renderFormSubmission } from '../skills/github-issue-form-author/utils/render-form-submission.js';
import fixtures from './task-management-fixtures.js';

function text(value) {
  return Array.isArray(value) ? value.join('\n') : String(value ?? '');
}

function intakeAnswers({ kind, sections }) {
  const normalizedKind = kind.toLowerCase();
  if (normalizedKind === 'task') {
    return {
      work: [sections.context, sections.outcome, ...sections.scope].map(text).join('\n'),
      completion: [...sections.acceptanceCriteria, sections.delivery].map(text).join('\n'),
      'task-context': [sections.constraints, ...sections.outOfScope]
        .filter(Boolean)
        .map(text)
        .join('\n'),
    };
  }
  if (normalizedKind === 'bug') {
    return {
      observed: sections.observedBehavior,
      expected: sections.expectedBehavior,
      investigation: [sections.reproduction, sections.environment]
        .filter(Boolean)
        .map(text)
        .join('\n'),
      'additional-context': [sections.impactSummary, ...sections.acceptanceCriteria]
        .map(text)
        .join('\n'),
    };
  }
  return {
    problem: sections.problem,
    outcome: sections.desiredOutcome,
    'additional-context': [
      ...sections.inScope,
      ...sections.outOfScope,
      ...sections.acceptanceCriteria,
      sections.alternatives,
    ]
      .filter(Boolean)
      .map(text)
      .join('\n'),
  };
}

function sourceEvidence(sections) {
  return Object.values(sections)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map(text);
}

describe('task-management cross-skill intake boundary', () => {
  for (const fixture of fixtures.filter(({ id }) => /^T0[1-6]$/.test(id))) {
    it(`should preserve ${fixture.id} evidence without treating intake as canonical`, () => {
      const repositoryMode =
        fixture.capabilities.repository.ownerType === 'User' ? 'personal' : 'organization';
      const kind = fixture.input.kind.toLowerCase();
      const form = authorIssueForm(kind, repositoryMode);
      const markdown = renderFormSubmission(form, intakeAnswers(fixture.input));
      const normalized = normalizeIssueFormSubmission(markdown, {
        form,
        repositoryMode,
        nativeMetadata: repositoryMode === 'organization' ? fixture.input.metadata : {},
        title: fixture.input.title,
      });

      assert.equal(normalized.normalizationRequired, true);
      assert.equal(normalized.kind, kind);
      assert.equal(normalized.title, fixture.input.title);
      assert.equal(normalized.originalBody, markdown.trim());
      for (const evidence of sourceEvidence(fixture.input.sections)) {
        assert.match(normalized.intakeEvidence.rawMarkdown, new RegExp(escapeRegex(evidence)));
      }
      assert.deepEqual(normalized.scoring, {});
      assert.deepEqual(normalized.signals, {});
      if (repositoryMode === 'organization') {
        assert.deepEqual(normalized.metadata, fixture.input.metadata);
      } else {
        assert.deepEqual(normalized.metadata, {});
      }
    });
  }
});

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
