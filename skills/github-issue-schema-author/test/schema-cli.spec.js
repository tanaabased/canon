import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { runCli } from '../scripts/inspect-schema.js';
import { parseSchemaInspectionArgs } from '../utils/parse-schema-inspection-args.js';
import { renderSchemaInspection } from '../utils/render-schema-inspection.js';

function capture() {
  let value = '';
  return { stream: { write: (chunk) => (value += chunk) }, value: () => value };
}

describe('skills/github-issue-schema-author CLI', () => {
  it('should require an explicit repository target', () => {
    assert.throws(() => parseSchemaInspectionArgs(['inspect']), /explicit OWNER\/REPO target/);
    assert.throws(
      () => parseSchemaInspectionArgs(['apply', 'tanaabased/canon']),
      /Expected command/,
    );
  });

  it('should render the read-only boundary and preserved Effort field', () => {
    const report = {
      target: { slug: 'tanaabased/canon' },
      status: 'missing',
      issueTypes: {
        organization: { status: 'aligned', missing: [], drifted: [] },
        repository: { status: 'aligned', missing: [], drifted: [] },
      },
      issueFields: {
        status: 'missing',
        missing: [{ path: 'issueFields.Work size' }],
        drifted: [],
        migrationRequired: [],
        unmanaged: [{ name: 'Effort', classification: 'preserved_unmanaged' }],
      },
      labels: {
        repository: { status: 'aligned', missing: [], drifted: [] },
        organizationDefaults: { status: 'manual' },
      },
      warnings: [],
    };

    const rendered = renderSchemaInspection(report);

    assert.match(rendered, /mutates GitHub: no/);
    assert.match(rendered, /issueFields\.Work size/);
    assert.match(rendered, /Effort/);
  });

  it('should expose help without constructing a GitHub client', () => {
    const stdout = capture();
    const stderr = capture();

    const status = runCli(['--help'], { stdout: stdout.stream, stderr: stderr.stream });

    assert.equal(status, 0);
    assert.match(stdout.value(), /read-only/);
    assert.equal(stderr.value(), '');
  });
});
