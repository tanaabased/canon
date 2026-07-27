import assert from 'node:assert/strict';

import validateOpenClawMetadata from '../utils/validate-openclaw-metadata.js';

describe('skills/skill-author/utils/validate-openclaw-metadata', () => {
  it('should accept display metadata and known gating lists', () => {
    assert.deepEqual(
      validateOpenClawMetadata({
        emoji: '🛠️',
        homepage: 'https://github.com/tanaabased/canon/tree/main/skills/skill-author',
        os: ['darwin', 'linux'],
        requires: {
          anyBins: ['bun', 'node'],
          bins: ['git'],
          config: ['browser.enabled'],
          env: ['GITHUB_TOKEN'],
        },
      }),
      [],
    );
  });

  it('should reject missing or malformed required metadata', () => {
    assert.deepEqual(validateOpenClawMetadata(null), [
      'SKILL.md frontmatter metadata.openclaw must be a mapping.',
    ]);
    assert.deepEqual(validateOpenClawMetadata({ emoji: '', homepage: 'http://example.com' }), [
      'SKILL.md frontmatter metadata.openclaw.emoji must be a nonempty string.',
      'SKILL.md frontmatter metadata.openclaw.homepage must be a nonempty HTTPS URL.',
    ]);
  });

  it('should reject malformed known gating fields without rejecting unknown fields', () => {
    assert.deepEqual(
      validateOpenClawMetadata({
        custom: { retained: true },
        emoji: '🧩',
        homepage: 'https://example.com/skill',
        os: ['plan9'],
        requires: { anyBins: 'bun', bins: [''] },
      }),
      [
        'SKILL.md frontmatter metadata.openclaw.os contains an unsupported platform.',
        'SKILL.md frontmatter metadata.openclaw.requires.anyBins must be a list of nonempty strings when present.',
        'SKILL.md frontmatter metadata.openclaw.requires.bins must be a list of nonempty strings when present.',
      ],
    );
  });
});
