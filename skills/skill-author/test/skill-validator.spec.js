import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const VALIDATOR_PATH = path.resolve(TEST_DIR, '..', 'scripts', 'validate-skill.js');

describe('skills/skill-author/lib/skill-validator', () => {
  it('should report contract errors for a temporary malformed skill', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'canon-skill-validator-'));
    const skillDir = path.join(tempDir, 'bad-skill');

    try {
      await mkdir(skillDir);
      await writeFile(path.join(skillDir, 'SKILL.md'), '# Missing frontmatter\n');
      const result = spawnSync('bun', [VALIDATOR_PATH, '--skill-dir', skillDir], {
        encoding: 'utf8',
      });
      const output = `${result.stdout}\n${result.stderr}`;

      assert.equal(result.status, 1);
      assert.match(output, /agents\/openai\.yaml/);
      assert.match(output, /frontmatter/);
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });

  it('should report missing OpenClaw metadata through the existing validator', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'canon-skill-validator-'));
    const skillDir = path.join(tempDir, 'tanaab-example');

    try {
      await mkdir(path.join(skillDir, 'agents'), { recursive: true });
      await writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: tanaab-example
description: Tanaab-based example skill. Use when testing validation.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags:
    - tanaab
    - generic
    - example
---

# Example
`,
      );
      await writeFile(path.join(skillDir, 'agents', 'openai.yaml'), 'interface:\n');

      const result = spawnSync('bun', [VALIDATOR_PATH, '--skill-dir', skillDir], {
        encoding: 'utf8',
      });
      const output = `${result.stdout}\n${result.stderr}`;

      assert.equal(result.status, 1);
      assert.match(output, /metadata must contain 'openclaw'/);
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });
});
