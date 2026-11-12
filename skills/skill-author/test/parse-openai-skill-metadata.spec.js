import assert from 'node:assert/strict';

import parseOpenAiSkillMetadata from '../utils/parse-openai-skill-metadata.js';

describe('skills/skill-author/utils/parse-openai-skill-metadata', () => {
  it('should decode quoted punctuation and reject invalid YAML instead of accepting partial metadata', () => {
    const label = 'Fields: "quoted" \\ names # retained';
    assert.equal(
      parseOpenAiSkillMetadata(`interface:\n  display_name: ${JSON.stringify(label)}`)
        .interfaceValues.display_name,
      label,
    );
    assert.throws(() => parseOpenAiSkillMetadata('interface:\n  display_name: Fields: names'));
  });

  it('should parse interface, policy, and dependency tool values', () => {
    const content = `interface:
  display_name: "Example"
  brand_color: '#00c88a'
policy:
  allow_implicit_invocation: false
dependencies:
  tools:
    - type: "mcp"
      value: github`;

    assert.deepEqual(parseOpenAiSkillMetadata(content), {
      dependencyTools: [{ type: 'mcp', value: 'github' }],
      hasDependencyToolsSection: true,
      interfaceValues: { brand_color: '#00c88a', display_name: 'Example' },
      policyValues: { allow_implicit_invocation: 'false' },
    });
  });
});
