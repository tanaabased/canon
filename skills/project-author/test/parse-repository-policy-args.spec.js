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
        metadataPath: null,
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
      metadataPath: null,
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

  it('should require a metadata plan for creation and opt-in metadata writes', () => {
    for (const command of ['create', 'apply-metadata']) {
      assert.throws(
        () => parseRepositoryPolicyArgs([command, 'acme/widget']),
        /requires --metadata/,
      );
      assert.equal(
        parseRepositoryPolicyArgs([command, 'acme/widget', '--metadata', 'plan.json']).metadataPath,
        'plan.json',
      );
    }
    assert.throws(
      () => parseRepositoryPolicyArgs(['apply', 'acme/widget', '--metadata', 'plan.json']),
      /valid only/,
    );
    assert.throws(
      () => parseRepositoryPolicyArgs(['inspect-metadata', 'acme/widget', '--metadata']),
      /requires one JSON file/,
    );
  });
});
