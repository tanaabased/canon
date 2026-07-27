import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import extractTopLevelSkillHeadings from '../utils/extract-top-level-skill-headings.js';
import { splitLeadingSkillFrontmatter } from '../utils/parse-skill-frontmatter.js';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(TEST_DIR, '..', 'templates');

describe('skills/skill-author/templates', () => {
  it('should expose Optimization as an optional facet before bundled resources', async () => {
    const templateNames = (await readdir(TEMPLATE_DIR)).filter((name) => name.endsWith('.md'));

    for (const templateName of templateNames) {
      const templateContent = await readFile(path.join(TEMPLATE_DIR, templateName), 'utf8');
      const { body, frontmatter } = splitLeadingSkillFrontmatter(templateContent);
      const sectionOrder = extractTopLevelSkillHeadings(body);
      const optimizationIndex = sectionOrder.indexOf('## Optimization');
      const resourcesIndex = sectionOrder.indexOf('## Bundled Resources');

      assert.ok(frontmatter.optional_top_level_headings.includes('## Optimization'), templateName);
      assert.ok(optimizationIndex >= 0, templateName);
      assert.equal(optimizationIndex + 1, resourcesIndex, templateName);
    }
  });
});
