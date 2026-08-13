import assert from 'node:assert/strict';

import parseInitSkillArgs from '../utils/parse-init-skill-args.js';

describe('skills/skill-author/utils/parse-init-skill-args', () => {
  it('should parse values, force, and help without exiting', () => {
    assert.deepEqual(
      parseInitSkillArgs(
        [
          '--slug',
          'example',
          '--openclaw-emoji',
          '🧩',
          '--openclaw-homepage',
          'https://example.com/skill',
          '--namespace',
          'agent-system',
          '--container',
          'openclaw-plugin',
          '--force',
          '--help',
        ],
        '/skills',
      ),
      {
        container: 'openclaw-plugin',
        force: true,
        help: true,
        namespace: 'agent-system',
        openclawEmoji: '🧩',
        openclawHomepage: 'https://example.com/skill',
        outputDir: '/skills',
        slug: 'example',
        type: 'generic',
      },
    );
  });

  it('should reject missing option values', () => {
    assert.throws(() => parseInitSkillArgs(['--slug'], '/skills'), /Missing value/);
  });
});
