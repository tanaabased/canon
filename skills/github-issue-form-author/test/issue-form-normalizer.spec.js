import assert from 'node:assert/strict';

import { authorIssueForm } from '../lib/issue-form-author.js';
import { normalizeIssueFormSubmission } from '../lib/issue-form-normalizer.js';
import { renderFormSubmission } from '../utils/render-form-submission.js';

describe('skills/github-issue-form-author/lib/issue-form-normalizer', () => {
  it('should preserve unknown Markdown headings inside a known response', () => {
    const form = authorIssueForm('task', 'organization');
    const markdown = `### What needs to be done, and why?

Current behavior.

### User-provided heading

Supporting detail.

### How will we know it is complete?

Desired behavior.
`;

    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'organization',
    });

    assert.match(normalized.intakeEvidence.responses.work.value, /### User-provided heading/);
    assert.equal(normalized.intakeEvidence.responses.completion.value, 'Desired behavior.');
    assert.equal(normalized.intakeEvidence.rawMarkdown, markdown.trim());
  });

  it('should reject duplicate known headings instead of losing submitted evidence', () => {
    const form = authorIssueForm('task', 'organization');
    const markdown = `### What needs to be done, and why?

Current behavior.

### How will we know it is complete?

An embedded outcome.

### How will we know it is complete?

The projected form response.
`;

    assert.throws(
      () => normalizeIssueFormSubmission(markdown, { form, repositoryMode: 'organization' }),
      /duplicate form heading: How will we know it is complete\?/,
    );
  });

  it('should hand personal submissions to semantic normalization without estimates', () => {
    const form = authorIssueForm('task', 'personal');
    const markdown = renderFormSubmission(form, {
      work: 'Release checks are repeated manually.',
      completion: 'One consolidated health summary is available.',
    });

    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'personal',
      title: 'add a health summary',
    });

    assert.equal(normalized.kind, 'task');
    assert.equal(normalized.title, 'add a health summary');
    assert.equal(normalized.normalizationRequired, true);
    assert.deepEqual(normalized.metadata, {});
    assert.deepEqual(normalized.scoring, {});
    assert.deepEqual(Object.keys(normalized.intakeEvidence.responses), ['work', 'completion']);
  });

  it('should retain observed organization metadata without asking for it in the form', () => {
    const form = authorIssueForm('feature', 'organization');
    const markdown = renderFormSubmission(form, {
      problem: 'Automation lacks a stable inspection surface.',
      outcome: 'Expose a supported JSON contract.',
    });
    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'organization',
      nativeMetadata: { priority: 'high' },
    });

    assert.equal(normalized.kind, 'feature');
    assert.deepEqual(normalized.metadata, { priority: 'high' });
    assert.deepEqual(normalized.signals, {});
    assert.deepEqual(normalized.relationships, {});
  });
});
