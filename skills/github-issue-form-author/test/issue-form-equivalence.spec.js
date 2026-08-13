import assert from 'node:assert/strict';

import { authorTaskDraft } from '../../task-author/lib/task-draft-author.js';
import fixtures, { fakeClient } from '../../task-author/test/task-fixtures.js';
import { authorIssueForm } from '../lib/issue-form-author.js';
import {
  BODY_SHAPES,
  PERSONAL_METADATA_FIELDS,
  SIGNAL_OPTIONS,
  displayValue,
  formId,
} from '../lib/issue-form-contract.js';
import { normalizeIssueFormSubmission } from '../lib/issue-form-normalizer.js';
import { renderFormSubmission } from '../utils/render-form-submission.js';

function answersFor(input, repositoryMode) {
  const kind = input.kind.toLowerCase();
  const answers = Object.fromEntries(
    BODY_SHAPES[kind]
      .filter(({ key }) => key !== null && input.sections[key] !== undefined)
      .map(({ key }) => [formId(key), input.sections[key]]),
  );
  if (input.sections.environment) answers.environment = input.sections.environment;

  if (repositoryMode === 'personal') {
    answers['task-kind'] = displayValue(kind);
    for (const { id, key } of PERSONAL_METADATA_FIELDS) {
      if (input.metadata[key] !== undefined) answers[id] = displayValue(input.metadata[key]);
    }
  }
  for (const key of ['urgency', 'enablement', 'confidence']) {
    if (input.scoring[key] !== undefined) answers[key] = displayValue(input.scoring[key]);
  }

  answers['task-signals'] = SIGNAL_OPTIONS.filter(
    ({ kinds, signal, relationship }) =>
      kinds.includes(kind) &&
      ((signal && input.signals?.[signal] === true) ||
        (relationship && input.relationships?.[relationship] === true)),
  ).map(({ label }) => label);
  return answers;
}

describe('GitHub Issue Form Author F01 and T01-T06 equivalence', () => {
  for (const fixture of fixtures.filter(({ id }) => /^T0[1-6]$/.test(id))) {
    it(`should normalize ${fixture.id} to the exact Task Author semantics`, () => {
      const repositoryMode =
        fixture.capabilities.repository.ownerType === 'User' ? 'personal' : 'organization';
      const kind = fixture.input.kind.toLowerCase();
      const form = authorIssueForm(kind, repositoryMode);
      const markdown = renderFormSubmission(form, answersFor(fixture.input, repositoryMode));
      const normalized = normalizeIssueFormSubmission(markdown, {
        form,
        repositoryMode,
        nativeMetadata: repositoryMode === 'organization' ? fixture.input.metadata : {},
        title: fixture.input.title,
      });
      const fromForm = authorTaskDraft(
        { ...normalized, target: fixture.input.target },
        { githubClient: fakeClient(fixture.capabilities) },
      );
      const direct = authorTaskDraft(fixture.input, {
        githubClient: fakeClient(fixture.capabilities),
      });

      assert.equal(fromForm.body, direct.body);
      assert.deepEqual(fromForm.metadata.values, direct.metadata.values);
      assert.deepEqual(fromForm.metadata.native, direct.metadata.native);
      assert.deepEqual(fromForm.metadata.fallback, direct.metadata.fallback);
      assert.deepEqual(fromForm.labels.apply, direct.labels.apply);
      assert.equal(fromForm.scoring.score, direct.scoring.score);
      assert.equal(fromForm.scoring.auditComment, direct.scoring.auditComment);
      assert.deepEqual(fromForm.bodyEvidence, direct.bodyEvidence);

      if (repositoryMode === 'organization') {
        assert.doesNotMatch(markdown, /^### (Priority|Work size|Complexity) estimate$/m);
      } else {
        assert.match(markdown, /^### Work size estimate$/m);
      }
    });
  }
});
