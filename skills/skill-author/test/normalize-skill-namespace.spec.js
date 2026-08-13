import assert from 'node:assert/strict';

import normalizeSkillNamespace from '../utils/normalize-skill-namespace.js';

describe('skills/skill-author/utils/normalize-skill-namespace', () => {
  it('should preserve the default and validate explicit public namespaces', () => {
    assert.equal(normalizeSkillNamespace(), 'tanaab');
    assert.equal(normalizeSkillNamespace(' Agent-System '), 'agent-system');
    assert.throws(() => normalizeSkillNamespace('agent_system'), /lowercase letters/);
  });
});
