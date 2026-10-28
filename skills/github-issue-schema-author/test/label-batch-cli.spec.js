import assert from 'node:assert/strict';
import schema from '../../../references/task-management-schema.json' with { type: 'json' };

import { runLabelBatchCli } from '../scripts/sync-labels-batch.js';
import { parseLabelBatchArgs } from '../utils/parse-label-batch-args.js';
import { fakeLabelClient } from './fake-issue-field-client.js';

describe('skills/github-issue-schema-author/scripts/sync-labels-batch', () => {
  it('should parse explicit targets and require separate digest-bound apply', () => {
    const parsed = parseLabelBatchArgs([
      'plan',
      '--organization',
      'acme',
      '--repository',
      'person/tools',
      '--repository',
      'acme/widgets',
      '--json',
    ]);
    assert.deepEqual(parsed.target.repositories, ['person/tools', 'acme/widgets']);
    assert.equal(parsed.target.organization, 'acme');
    assert.equal(parsed.json, true);
    for (const args of [
      ['plan'],
      ['apply', '--repository', 'person/tools'],
      ['plan', '--organization', 'acme', '--approved-digest', 'abc'],
      ['plan', '--organization', 'acme', '--organization', 'other'],
      ['plan', '--repository'],
      ['plan', '--force'],
    ])
      assert.throws(() => parseLabelBatchArgs(args));
  });

  it('should expose help without accessing GitHub', () => {
    let output = '';
    assert.equal(runLabelBatchCli(['--help'], { stdout: { write: (s) => (output += s) } }), 0);
    assert.match(output, /read-only/);
  });

  it('should render reviewable changes and return nonzero for stale apply without writing', () => {
    const client = fakeLabelClient();
    let output = '';
    const dependencies = {
      client,
      stdout: { write: (s) => (output += s) },
      stderr: {
        write: (s) => {
          throw new Error(s);
        },
      },
    };
    assert.equal(runLabelBatchCli(['plan', '--repository', 'person/tools'], dependencies), 0);
    assert.ok(
      output.includes(
        `create blocked: #${schema.labels.find(({ name }) => name === 'blocked').color}`,
      ),
    );
    assert.match(output, /renames: none; deletions: none/);
    assert.equal(
      runLabelBatchCli(
        ['apply', '--repository', 'person/tools', '--approved-digest', 'stale', '--json'],
        dependencies,
      ),
      1,
    );
    assert.equal(client.state.labels.length, 0);
  });
});
