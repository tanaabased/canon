import assert from 'node:assert/strict';

import parseValidateSkillArgs from '../utils/parse-validate-skill-args.js';

describe('skills/skill-author/utils/parse-validate-skill-args', () => {
  it('should parse validator values and help without exiting', () => {
    assert.deepEqual(
      parseValidateSkillArgs([
        '--skill-dir',
        '/skill',
        '--namespace',
        'agent-system',
        '--container',
        'openclaw-plugin',
        '--help',
      ]),
      {
        container: 'openclaw-plugin',
        help: true,
        namespace: 'agent-system',
        skillDir: '/skill',
      },
    );
  });
});
