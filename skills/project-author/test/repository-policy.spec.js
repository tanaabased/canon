import assert from 'node:assert/strict';

import { runCli } from '../scripts/repository-policy.js';
import { CREATION_PLAN, TARGET } from './fake-github.js';

function captureStream() {
  let content = '';

  return {
    read: () => content,
    write: (chunk) => {
      content += chunk;
    },
  };
}

describe('skills/project-author/scripts/repository-policy', () => {
  it('should dispatch inspect and print JSON', () => {
    const stdout = captureStream();
    const stderr = captureStream();
    const report = { changes: [], status: 'aligned', target: TARGET };
    const calls = [];
    const client = {
      inspect: (slug) => {
        calls.push({ command: 'inspect', slug });
        return report;
      },
    };

    const status = runCli(['inspect', TARGET, '--json'], { client, stderr, stdout });

    assert.equal(status, 0);
    assert.deepEqual(calls, [{ command: 'inspect', slug: TARGET }]);
    assert.equal(stdout.read(), `${JSON.stringify(report, null, 2)}\n`);
    assert.equal(stderr.read(), '');
  });

  it('should pass apply authorization flags to the client', () => {
    const stdout = captureStream();
    const calls = [];
    const client = {
      apply: (slug, options) => {
        calls.push({ options, slug });
        return { changes: [], status: 'aligned', target: slug };
      },
    };

    const status = runCli(['apply', TARGET, '--initialize', '--rename-default'], {
      client,
      stdout,
    });

    assert.equal(status, 0);
    assert.deepEqual(calls, [{ options: { initialize: true, renameDefault: true }, slug: TARGET }]);
  });

  it('should print usage errors without constructing a client', () => {
    const stderr = captureStream();

    const status = runCli(['inspect'], { stderr });

    assert.equal(status, 1);
    assert.match(stderr.read(), /Expected one command and one explicit OWNER\/REPO slug/);
  });

  it('should pass the JSON plan to creation and metadata commands', () => {
    for (const [command, method] of [
      ['create', 'create'],
      ['inspect-metadata', 'inspectMetadata'],
      ['apply-metadata', 'applyMetadata'],
    ]) {
      const stdout = captureStream();
      const calls = [];
      const client = {
        [method]: (slug, plan) => {
          calls.push({ slug, plan });
          return { changes: [], status: 'aligned', target: slug };
        },
      };
      const status = runCli([command, TARGET, '--metadata', 'plan.json', '--json'], {
        client,
        stdout,
        readFile: () => JSON.stringify(CREATION_PLAN),
      });
      assert.equal(status, 0);
      assert.deepEqual(calls, [{ slug: TARGET, plan: CREATION_PLAN }]);
    }
  });

  it('should reject unreadable or malformed plans before mutation', () => {
    for (const readFile of [
      () => '{invalid',
      () => {
        throw new Error('unreadable');
      },
    ]) {
      const stderr = captureStream();
      let calls = 0;
      assert.equal(
        runCli(['create', TARGET, '--metadata', 'plan.json', '--json'], {
          client: {
            create: () => {
              calls += 1;
            },
          },
          readFile,
          stderr,
        }),
        1,
      );
      assert.equal(calls, 0);
      assert.ok(JSON.parse(stderr.read()).error);
    }
  });
});
