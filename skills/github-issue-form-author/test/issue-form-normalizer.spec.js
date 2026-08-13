import assert from 'node:assert/strict';

import { authorIssueForm } from '../lib/issue-form-author.js';
import { normalizeIssueFormSubmission } from '../lib/issue-form-normalizer.js';
import { renderFormSubmission } from '../utils/render-form-submission.js';

describe('skills/github-issue-form-author/lib/issue-form-normalizer', () => {
  it('should preserve unknown Markdown headings inside a known response', () => {
    const form = authorIssueForm('task', 'organization');
    const markdown = `### Context

Current behavior.

### User-provided heading

Supporting detail.

### Objective

Desired behavior.
`;

    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'organization',
    });

    assert.match(normalized.sections.context, /### User-provided heading/);
    assert.equal(normalized.sections.objective, 'Desired behavior.');
  });

  it('should reject duplicate known headings instead of losing submitted evidence', () => {
    const form = authorIssueForm('task', 'organization');
    const markdown = `### Context

Current behavior.

### Objective

An objective embedded by the submitter.

### Objective

The projected form response.
`;

    assert.throws(
      () =>
        normalizeIssueFormSubmission(markdown, {
          form,
          repositoryMode: 'organization',
        }),
      /duplicate form heading: Objective/,
    );
  });

  it('should leave unanswered personal estimates unset', () => {
    const form = authorIssueForm('task', 'personal');
    const markdown = renderFormSubmission(form, {
      'task-kind': 'Task',
      context: 'Current context',
      objective: 'Desired outcome',
      'in-scope': ['One supported behavior'],
      'out-of-scope': ['Unrelated behavior'],
      'acceptance-criteria': ['Observable evidence'],
    });

    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'personal',
    });

    assert.deepEqual(normalized.metadata, {});
    assert.deepEqual(normalized.scoring, {});
    assert.deepEqual(normalized.sections.acceptanceCriteria, ['Observable evidence']);
  });

  it('should translate only checked task signals into canonical intent', () => {
    const form = authorIssueForm('feature', 'personal');
    const markdown = renderFormSubmission(form, {
      'task-kind': 'Feature',
      'task-signals': [
        'Breaking change',
        'Maintainers welcome outside contributions',
        'Blocked by an external dependency',
      ],
    });

    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'personal',
    });

    assert.deepEqual(normalized.signals, { breakingChange: true, helpWanted: true });
    assert.deepEqual(normalized.relationships, { externalBlocker: true });
  });

  it('should normalize provider-safe scoring labels to canonical none values', () => {
    const form = authorIssueForm('bug', 'organization');
    const markdown = renderFormSubmission(form, {
      urgency: 'Not time-sensitive',
      enablement: 'No enabling effect',
      confidence: 'High',
    });
    const normalized = normalizeIssueFormSubmission(markdown, {
      form,
      repositoryMode: 'organization',
    });

    assert.equal(normalized.kind, 'bug');
    assert.deepEqual(normalized.scoring, {
      urgency: 'none',
      enablement: 'none',
      confidence: 'high',
    });
  });
});
