import assert from 'node:assert/strict';

import { runProjectMilestoneCommand } from '../scripts/project-milestone.js';

function stream() {
  let value = '';
  return {
    get value() {
      return value;
    },
    write(chunk) {
      value += chunk;
    },
  };
}

describe('project-milestone-author/scripts/project-milestone', () => {
  it('should dispatch one mode with JSON read from stdin', () => {
    const stdout = stream();
    const code = runProjectMilestoneCommand(['inspect', '--input', '-'], {
      execute: {
        inspect: (input) => ({ status: 'inspected', target: input.target }),
      },
      readFile: () => '{"target":"acme/widgets#4"}',
      stdout,
    });

    assert.equal(code, 0);
    assert.deepEqual(JSON.parse(stdout.value), {
      status: 'inspected',
      target: 'acme/widgets#4',
    });
  });

  it('should expose help and return failure for unsafe apply results', () => {
    const stdout = stream();
    assert.equal(runProjectMilestoneCommand(['--help'], { stdout }), 0);
    assert.match(stdout.value, /inspect\|draft\|apply/);

    assert.equal(
      runProjectMilestoneCommand(['apply', '--input', '-'], {
        execute: { apply: () => ({ status: 'approval_required' }) },
        readFile: () => '{}',
        stdout: stream(),
      }),
      1,
    );
  });
});
