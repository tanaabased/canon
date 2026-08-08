import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import parseSkillFrontmatter from '../utils/parse-skill-frontmatter.js';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLDER_PATH = path.resolve(TEST_DIR, '..', 'scripts', 'init-skill.js');

describe('skills/skill-author/lib/skill-scaffolder', () => {
  it('should create and validate a skill in a temporary owner scope', async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), 'canon-skill-scaffolder-'));

    try {
      const result = spawnSync(
        'bun',
        [
          SCAFFOLDER_PATH,
          '--type',
          'generic',
          '--slug',
          'example-skill',
          '--display-name',
          'Example Skill',
          '--description',
          'Scaffold a focused example skill.',
          '--openclaw-emoji',
          '🧩',
          '--openclaw-homepage',
          'https://example.com/skills/example-skill',
          '--output-dir',
          outputDir,
        ],
        { encoding: 'utf8' },
      );
      const skillDir = path.join(outputDir, 'tanaab-example-skill');

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Created skill at/);
      const skillContent = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
      const openAiContent = await readFile(path.join(skillDir, 'agents', 'openai.yaml'), 'utf8');
      const frontmatter = parseSkillFrontmatter(skillContent);

      assert.match(skillContent, /## Optimization/);
      assert.match(skillContent, /\*\*Inspect:\*\*/);
      assert.match(skillContent, /\*\*Compare:\*\*/);
      assert.match(skillContent, /\*\*Recommend:\*\*/);
      assert.match(skillContent, /\*\*Apply:\*\*/);
      assert.match(skillContent, /\*\*Verify:\*\*/);
      assert.match(skillContent, /\*\*keep\*\*.*\*\*remove\*\*/s);
      assert.equal(frontmatter.metadata.openclaw.emoji, '🧩');
      assert.equal(
        frontmatter.metadata.openclaw.homepage,
        'https://example.com/skills/example-skill',
      );
      assert.match(openAiContent, /^interface:\n/);
      assert.doesNotMatch(openAiContent, /openclaw/i);
    } finally {
      await rm(outputDir, { force: true, recursive: true });
    }
  });

  it('should preserve product identity in an explicit OpenClaw plugin container', async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), 'canon-skill-scaffolder-'));

    try {
      const result = spawnSync(
        'bun',
        [
          SCAFFOLDER_PATH,
          '--type',
          'integration',
          '--namespace',
          'agent-system',
          '--container',
          'openclaw-plugin',
          '--slug',
          'github-cli',
          '--display-name',
          'Agent System GitHub CLI',
          '--description',
          'Agent System GitHub CLI guidance for agent-scoped operations.',
          '--brand-color',
          '#123456',
          '--openclaw-emoji',
          '🐙',
          '--openclaw-homepage',
          'https://example.com/skills/github-cli',
          '--output-dir',
          outputDir,
        ],
        { encoding: 'utf8' },
      );
      const skillDir = path.join(outputDir, 'github-cli');

      assert.equal(result.status, 0, result.stderr);
      const skillContent = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
      const openAiContent = await readFile(path.join(skillDir, 'agents', 'openai.yaml'), 'utf8');
      const frontmatter = parseSkillFrontmatter(skillContent);

      assert.equal(frontmatter.name, 'agent-system-github-cli');
      assert.equal(
        frontmatter.description,
        'Agent System GitHub CLI guidance for agent-scoped operations.',
      );
      assert.equal(frontmatter.metadata.owner, 'tanaab');
      assert.match(openAiContent, /brand_color: "#123456"/);
      assert.match(openAiContent, /\$agent-system-github-cli/);
      assert.doesNotMatch(openAiContent, /Tanaab-based/);
    } finally {
      await rm(outputDir, { force: true, recursive: true });
    }
  });
});
