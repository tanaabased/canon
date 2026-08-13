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

describe('skills/github-issue-form-author/lib/issue-form-author', () => {
  it('should render organization forms with native issue types and no mirrored native metadata', () => {
    const report = authorIssueFormSet('organization');
    const forms = report.files.filter(({ kind }) => kind !== null);

    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.operations, []);
    assert.deepEqual(
      forms.map(({ document }) => document.type),
      ['Task', 'Bug', 'Feature'],
    );
    for (const { content, document } of forms) {
      const ids = document.body.map(({ id }) => id).filter(Boolean);
      assert.ok(ids.includes('urgency'));
      assert.ok(ids.includes('enablement'));
      assert.ok(ids.includes('confidence'));
      assert.ok(!ids.includes('work-size'));
      assert.ok(!ids.includes('task-score'));
      assert.equal(Object.hasOwn(document, 'labels'), false);
      assert.deepEqual(parsedByBun(content), document);
    }
  });

  it('should render personal forms with portable metadata but never ask for Task score', () => {
    const report = authorIssueFormSet('personal');
    const forms = report.files.filter(({ kind }) => kind !== null);

    for (const { content, document } of forms) {
      const ids = document.body.map(({ id }) => id).filter(Boolean);
      assert.equal(Object.hasOwn(document, 'type'), false);
      assert.ok(ids.includes('task-kind'));
      assert.ok(ids.includes('priority'));
      assert.ok(ids.includes('work-size'));
      assert.ok(ids.includes('complexity'));
      assert.ok(ids.includes('impact'));
      assert.ok(!ids.includes('task-score'));
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
