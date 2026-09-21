import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import extractTopLevelSkillHeadings from '../utils/extract-top-level-skill-headings.js';
import hasOrderedSkillSections from '../utils/has-ordered-skill-sections.js';
import { splitLeadingSkillFrontmatter } from '../utils/parse-skill-frontmatter.js';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(TEST_DIR, '..', 'templates');

describe('skills/skill-author/templates', () => {
  it('should allow Preferred Tools to be present or absent before Workflow for every type', async () => {
    const templateNames = (await readdir(TEMPLATE_DIR)).filter((name) => name.endsWith('.md'));

    for (const templateName of templateNames) {
      const { body, frontmatter } = splitLeadingSkillFrontmatter(
        await readFile(path.join(TEMPLATE_DIR, templateName), 'utf8'),
      );
      const headings = extractTopLevelSkillHeadings(body);
      const optional = frontmatter.optional_top_level_headings;
      const toolsIndex = headings.indexOf('## Preferred Tools');
      const withoutTools = body.replace(/## Preferred Tools\n[\s\S]*?(?=## Workflow\n)/, '');
      const misplacedTools = withoutTools.replace(
        '## Workflow',
        '## Workflow\n\n## Preferred Tools',
      );

      assert.ok(optional.includes('## Preferred Tools'), templateName);
      assert.ok(toolsIndex >= 0, templateName);
      assert.equal(toolsIndex + 1, headings.indexOf('## Workflow'), templateName);
      assert.equal(hasOrderedSkillSections(body, headings, optional), true, templateName);
      assert.equal(hasOrderedSkillSections(withoutTools, headings, optional), true, templateName);
      assert.equal(
        hasOrderedSkillSections(misplacedTools, headings, optional),
        false,
        templateName,
      );
    }
  });

  it('should expose Deployment as an optional coding facet before GitHub Actions', async () => {
    const templateContent = await readFile(path.join(TEMPLATE_DIR, 'coding.md'), 'utf8');
    const { body, frontmatter } = splitLeadingSkillFrontmatter(templateContent);
    const sectionOrder = extractTopLevelSkillHeadings(body);
    const deploymentIndex = sectionOrder.indexOf('## Deployment');
    const githubActionsIndex = sectionOrder.indexOf('## GitHub Actions');

    assert.ok(frontmatter.optional_top_level_headings.includes('## Deployment'));
    assert.ok(deploymentIndex >= 0);
    assert.equal(deploymentIndex + 1, githubActionsIndex);
  });

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
      assert.match(
        templateContent,
        /\*\*keep\*\*.*\*\*reconcile\*\*.*\*\*deduplicate\*\*.*\*\*consolidate\/merge\*\*.*\*\*split\*\*.*\*\*extract\*\*.*\*\*move\*\*.*\*\*tighten\*\*.*\*\*remove\*\*/s,
        templateName,
      );
    }
  });
});
