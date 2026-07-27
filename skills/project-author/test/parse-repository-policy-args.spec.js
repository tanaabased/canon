import assert from 'node:assert/strict';

import parseRepositoryPolicyArgs from '../utils/parse-repository-policy-args.js';

describe('skills/project-author/utils/parse-repository-policy-args', () => {
  it('should parse apply-only branch authorization flags', () => {
    assert.deepEqual(
      parseRepositoryPolicyArgs([
        'apply',
        'acme/widget',
        '--json',
        '--initialize',
        '--rename-default',
      ]),
      {
        command: 'apply',
        help: false,
        initialize: true,
        json: true,
        renameDefault: true,
        slug: 'acme/widget',
      },
    );
  });

  it('should return help without requiring command positionals', () => {
    assert.deepEqual(parseRepositoryPolicyArgs(['--help']), {
      command: null,
      help: true,
      initialize: false,
      json: false,
      renameDefault: false,
      slug: null,
    });
  });

  it('should reject unknown commands and options', () => {
    assert.throws(() => parseRepositoryPolicyArgs(['delete', 'acme/widget']), /Unknown command/);
    assert.throws(
      () => parseRepositoryPolicyArgs(['inspect', 'acme/widget', '--force']),
      /Unknown option/,
    );
  });

  it('should reject mutation flags outside apply', () => {
    assert.throws(
      () => parseRepositoryPolicyArgs(['inspect', 'acme/widget', '--rename-default']),
      /valid only with apply/,
    );
  });
});
