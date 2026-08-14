import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import { authorIssueFormSet } from '../lib/issue-form-author.js';

function parsedByBun(content) {
  const result = spawnSync(
    'bun',
    [
      '-e',
      'const text = await Bun.stdin.text(); process.stdout.write(JSON.stringify(Bun.YAML.parse(text)));',
    ],
    { encoding: 'utf8', input: content },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function submittedElements(document) {
  return document.body.filter(({ type }) => type !== 'markdown');
}

describe('skills/github-issue-form-author/lib/issue-form-author', () => {
  it('should render low-friction organization intake with native issue types', () => {
    const report = authorIssueFormSet('organization');
    const forms = report.files.filter(({ kind }) => kind !== null);

    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.operations, []);
    assert.deepEqual(
      forms.map(({ document }) => document.type),
      ['task', 'bug', 'feature'],
    );
    assert.deepEqual(
      forms.map(({ document }) => document.name),
      ['Task', 'Bug report', 'Feature'],
    );
    assert.deepEqual(
      forms.map(({ document }) => submittedElements(document).length),
      [3, 4, 3],
    );
    assert.deepEqual(
      forms.map(
        ({ document }) =>
          submittedElements(document).filter(({ validations }) => validations.required).length,
      ),
      [2, 3, 2],
    );
    assert.deepEqual(
      submittedElements(forms[0].document).map(({ id, attributes, validations }) => ({
        id,
        label: attributes.label,
        required: validations.required,
      })),
      [
        { id: 'work', label: 'What needs to be done, and why?', required: true },
        { id: 'completion', label: 'How will we know it is complete?', required: true },
        {
          id: 'task-context',
          label: 'What constraints, inputs, or approvals should we know about?',
          required: false,
        },
      ],
    );

    for (const { content, document } of forms) {
      const ids = submittedElements(document).map(({ id }) => id);
      assert.ok(!ids.includes('priority'));
      assert.ok(!ids.includes('work-size'));
      assert.ok(!ids.includes('complexity'));
      assert.ok(!ids.includes('impact'));
      assert.ok(!ids.includes('urgency'));
      assert.ok(!ids.includes('confidence'));
      assert.ok(!ids.includes('task-signals'));
      assert.equal(Object.hasOwn(document, 'labels'), false);
      assert.ok(submittedElements(document).every(({ type }) => type === 'textarea'));
      assert.deepEqual(parsedByBun(content), document);
    }
  });

  it('should use the same evidence questions for personal repositories without native type', () => {
    const organization = authorIssueFormSet('organization').files.filter(
      ({ kind }) => kind !== null,
    );
    const personal = authorIssueFormSet('personal').files.filter(({ kind }) => kind !== null);

    for (const [index, { content, document }] of personal.entries()) {
      assert.equal(Object.hasOwn(document, 'type'), false);
      assert.deepEqual(document.body, organization[index].document.body);
      assert.deepEqual(parsedByBun(content), document);
    }
  });

  it('should disable contributor blank issues without inventing contact links', () => {
    const report = authorIssueFormSet('organization');
    const chooser = report.files.find(({ path }) => path.endsWith('config.yml'));

    assert.deepEqual(chooser.document, { blank_issues_enabled: false });
    assert.deepEqual(parsedByBun(chooser.content), chooser.document);
  });
});
