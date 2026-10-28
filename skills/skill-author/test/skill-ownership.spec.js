import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { getBundledLargeIconPath, getBundledSmallIconPath } from '../lib/skill-contract.js';
import { initializeSkill } from '../lib/skill-scaffolder.js';
import { validateSkillDir } from '../lib/skill-validator.js';
import parseOpenAiSkillMetadata from '../utils/parse-openai-skill-metadata.js';
import parseSkillFrontmatter from '../utils/parse-skill-frontmatter.js';

describe('skills/skill-author/lib/skill-ownership', () => {
  let rootDir;
  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(os.tmpdir(), 'canon-ownership-'));
  });
  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  function scaffold(options = {}) {
    return initializeSkill({
      type: 'generic',
      slug: 'example',
      displayName: 'Example',
      description: 'Create a focused example skill.',
      categoryTag: 'skills',
      openclawEmoji: '🧩',
      openclawHomepage: 'https://example.com/skill',
      container: 'standalone',
      outputDir: rootDir,
      ...options,
    });
  }

  async function rewriteSkill(skillDir, transform) {
    const file = path.join(skillDir, 'SKILL.md');
    const original = await readFile(file, 'utf8');
    await writeFile(file, transform(original));
  }

  it('should preserve default ownership, public identity, metadata and artwork', async () => {
    const { result, skillDir } = await scaffold();
    const metadata = parseSkillFrontmatter(await readFile(path.join(skillDir, 'SKILL.md'), 'utf8'));
    const { interfaceValues: openai } = parseOpenAiSkillMetadata(
      await readFile(path.join(skillDir, 'agents/openai.yaml'), 'utf8'),
    );
    assert.deepEqual(result.errors, []);
    assert.equal(path.basename(skillDir), 'tanaab-example');
    assert.equal(metadata.name, 'tanaab-example');
    assert.equal(metadata.description, 'Tanaab-based Create a focused example skill.');
    assert.equal(metadata.license, 'MIT');
    assert.equal(metadata.metadata.owner, 'tanaab');
    assert.deepEqual(metadata.metadata.tags, ['tanaab', 'generic', 'skills']);
    assert.deepEqual(metadata.metadata.openclaw, {
      emoji: '🧩',
      homepage: 'https://example.com/skill',
    });
    assert.equal(openai.brand_color, '#00c88a');
    assert.equal(openai.display_name, 'Example');
    assert.match(openai.default_prompt, /\$tanaab-example/);
    for (const [name, source] of [
      ['icon-small.svg', getBundledSmallIconPath()],
      ['icon-large.png', getBundledLargeIconPath()],
    ]) {
      assert.deepEqual(await readFile(path.join(skillDir, 'assets', name)), await readFile(source));
    }
    assert.deepEqual((await validateSkillDir(skillDir)).errors, []);
  });

  it('should keep owner independent of namespace and every supported container', async () => {
    for (const [owner, namespace, container] of [
      [undefined, 'piro', 'codex-plugin'],
      ['pirog', 'piro', 'standalone'],
      ['pirog', 'piro', 'codex-plugin'],
      ['pirog', 'agent-system', 'openclaw-plugin'],
      ['pirog', 'tanaab', 'standalone'],
    ]) {
      const { result, skillDir } = await scaffold({
        owner,
        namespace,
        container,
        outputDir: path.join(rootDir, `${owner}-${namespace}-${container}`),
      });
      const metadata = parseSkillFrontmatter(
        await readFile(path.join(skillDir, 'SKILL.md'), 'utf8'),
      );
      assert.deepEqual(result.errors, []);
      assert.equal(
        path.basename(skillDir),
        container === 'standalone' ? `${namespace}-example` : 'example',
      );
      assert.equal(metadata.name, `${namespace}-example`);
      assert.equal(metadata.metadata.owner, owner ?? 'tanaab');
      assert.deepEqual(metadata.metadata.tags, [owner ?? 'tanaab', 'generic', 'skills']);
      assert.equal(metadata.description.startsWith('Tanaab-based'), namespace === 'tanaab');
      assert.deepEqual(
        (await validateSkillDir(skillDir, { owner, namespace, container })).errors,
        [],
      );
      if (owner === 'pirog') {
        assert.ok(
          (await validateSkillDir(skillDir, { namespace, container })).errors.some((e) =>
            e.includes('requested owner'),
          ),
        );
      }
    }
  });

  it('should render explicit ownership through all existing type templates', async () => {
    for (const type of ['generic', 'coding', 'integration', 'workflow', 'meta']) {
      const { result } = await scaffold({
        owner: 'pirog',
        type,
        outputDir: path.join(rootDir, type),
      });
      assert.deepEqual(result.errors, [], type);
    }
  });

  it('should reject invalid scaffold owners before writing a skill', async () => {
    for (const owner of [null, false, '', 'PIROG', ' pirog', 'other']) {
      await assert.rejects(scaffold({ owner }), /Skill owner must be one of/);
    }
    const { result } = await scaffold();
    assert.deepEqual(result.errors, []);
  });

  it('should reject supported owner ids as categories for either owner', async () => {
    for (const owner of ['tanaab', 'pirog']) {
      for (const categoryTag of ['tanaab', 'pirog', 'generic']) {
        await assert.rejects(scaffold({ owner, categoryTag }), /beyond supported owners and type/);
      }
    }
  });

  it('should reject malformed declared and requested owners', async () => {
    const { skillDir } = await scaffold();
    for (const owner of [null, 42, '', 'PIROG', 'other']) {
      const report = await validateSkillDir(skillDir, { owner });
      assert.ok(report.errors.some((e) => e.includes('Skill owner must be one of')));
    }
    const original = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
    for (const owner of ['null', 'false', '42', '[]', '""', 'PIROG', '" pirog "', 'other']) {
      await writeFile(
        path.join(skillDir, 'SKILL.md'),
        original.replace('owner: tanaab', `owner: ${owner}`),
      );
      const report = await validateSkillDir(skillDir);
      assert.ok(
        report.errors.some((e) => e.includes('metadata.owner')),
        owner,
      );
    }
    await writeFile(path.join(skillDir, 'SKILL.md'), original.replace('  owner: tanaab\n', ''));
    assert.ok(
      (await validateSkillDir(skillDir)).errors.some((e) => e.includes("must contain 'owner'")),
    );
  });

  it('should require the declared owner tag and a genuine category, rejecting competing owners', async () => {
    const { skillDir } = await scaffold({ owner: 'pirog' });
    const original = await readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
    for (const [tags, expected] of [
      [['generic', 'skills'], ['selected owner tag: pirog']],
      [
        ['tanaab', 'generic', 'skills'],
        ['selected owner tag: pirog', 'competing owner tag: tanaab'],
      ],
      [
        ['pirog', 'tanaab', 'generic'],
        ['competing owner tag: tanaab', 'additional category tag'],
      ],
      [['pirog', 'generic'], ['additional category tag']],
    ]) {
      await writeFile(path.join(skillDir, 'SKILL.md'), original);
      await rewriteSkill(skillDir, (text) =>
        text.replace(
          '    - pirog\n    - generic\n    - skills',
          tags.map((tag) => `    - ${tag}`).join('\n'),
        ),
      );
      const { errors } = await validateSkillDir(skillDir, { owner: 'pirog' });
      for (const message of expected)
        assert.ok(
          errors.some((e) => e.includes(message)),
          errors.join('\n'),
        );
    }
  });
});
