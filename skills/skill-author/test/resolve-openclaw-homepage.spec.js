import assert from 'node:assert/strict';

import resolveOpenClawHomepage from '../utils/resolve-openclaw-homepage.js';

const BASE_OPTIONS = {
  canonicalHomepageBase: 'https://github.com/tanaabased/canon/tree/main/skills',
  canonicalSkillsRoot: '/repo/skills',
  folderName: 'example-skill',
  outputDir: '/repo/skills',
};

describe('skills/skill-author/utils/resolve-openclaw-homepage', () => {
  it('should derive the canonical skill homepage', () => {
    assert.equal(
      resolveOpenClawHomepage(BASE_OPTIONS),
      'https://github.com/tanaabased/canon/tree/main/skills/example-skill',
    );
  });

  it('should preserve an explicit homepage for a custom output directory', () => {
    assert.equal(
      resolveOpenClawHomepage({
        ...BASE_OPTIONS,
        homepage: 'https://example.com/skills/example-skill',
        outputDir: '/other/skills',
      }),
      'https://example.com/skills/example-skill',
    );
  });

  it('should reject a custom output directory without an explicit homepage', () => {
    assert.throws(
      () => resolveOpenClawHomepage({ ...BASE_OPTIONS, outputDir: '/other/skills' }),
      /OpenClaw homepage is required/,
    );
  });
});
