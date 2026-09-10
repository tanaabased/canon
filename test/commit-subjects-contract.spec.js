import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REFERENCE_URL = new URL('../references/commit-subjects.md', import.meta.url);
const AUTHORING_SKILLS = [
  'changelog-author',
  'github-action-author',
  'github-issue-form-author',
  'github-workflow-author',
  'javascript-author',
  'javascript-cli-author',
  'javascript-repo-standardizer',
  'openclaw-plugin-author',
  'project-author',
  'readme-author',
  'release-author',
  'shell-cli-author',
  'skill-author',
  'vitepress-author',
  'vue-author',
];

describe('references/commit-subjects contract', () => {
  let examples;

  before(async () => {
    const content = await readFile(REFERENCE_URL, 'utf8');
    examples = content
      .split('\n')
      .filter((line) => /^\| (Agent System|Manual) /.test(line))
      .map((line) =>
        line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim().replaceAll('`', '')),
      )
      .map(([delivery, issue, pr, owner, supplied, delivered]) => ({
        delivery,
        issue,
        pr,
        owner,
        supplied,
        delivered,
      }));
  });

  it('should prefix only the explicitly delegated first lifecycle input', () => {
    const delegated = examples.filter(({ owner }) => owner === 'Agent System');

    assert.deepEqual(delegated, [
      {
        delivery: 'Agent System first lifecycle commit',
        issue: '42',
        pr: '73',
        owner: 'Agent System',
        supplied: 'add OPENCLAW delivery support',
        delivered: '#42: add OPENCLAW delivery support',
      },
    ]);
  });

  for (const delivery of [
    'Agent System first commit without explicit prefix ownership',
    'Agent System PR follow-up',
    'Manual first commit',
    'Manual PR follow-up',
  ]) {
    it(`should require the complete supplied subject for ${delivery}`, () => {
      const matching = examples.filter((example) => example.delivery === delivery);
      assert.equal(matching.length, 1);
      const example = matching[0];

      assert.equal(example.owner, 'author');
      assert.equal(example.supplied, example.delivered);
      assert.match(example.supplied, /^#42: [a-z]+ /);
      assert.equal(example.issue, '42');
      assert.equal(example.pr, delivery === 'Manual first commit' ? 'none' : '73');
    });
  }

  it('should retain the backing issue, a single prefix, and all-caps proper names in delivered examples', () => {
    assert.equal(examples.length, 5);
    for (const { issue, pr, delivered } of examples) {
      assert.notEqual(issue, pr);
      assert.ok(delivered.startsWith(`#${issue}: `));
      assert.equal(delivered.match(/#\d+:/g).length, 1);
      assert.match(delivered, /^#\d+: [a-z]+ .*\b(OPENCLAW|EMORI)\b/);
      assert.doesNotMatch(delivered, /^#\d+: [a-z]+:/);
      for (const word of delivered.match(/[a-z]+/gi)) {
        assert.ok(word === word.toLowerCase() || word === word.toUpperCase(), word);
      }
    }
  });

  it('should link authoring guidance to the canonical owner without copying the subject template', async () => {
    const paths = [
      'AGENTS.md',
      'references/task-management-contract.md',
      'references/skill-standard.md',
      ...AUTHORING_SKILLS.map((skill) => `skills/${skill}/SKILL.md`),
    ];

    for (const relativePath of paths) {
      const url = new URL(`../${relativePath}`, import.meta.url);
      const content = await readFile(url, 'utf8');
      const links = [...content.matchAll(/\[[^\]\n]+\]\(([^)\n]+commit-subjects\.md)\)/g)];

      assert.ok(links.length > 0, relativePath);
      for (const [, target] of links) {
        assert.equal(new URL(target, url).href, REFERENCE_URL.href, relativePath);
      }
      assert.ok(!content.includes('#<issue-number>:'), relativePath);
    }
  });
});
