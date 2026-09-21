import assert from 'node:assert/strict';

import plugin from '../index.js';

function register(pluginConfig) {
  const hooks = new Map();
  plugin.register({ pluginConfig, on: (name, handler) => hooks.set(name, handler) });
  return hooks;
}

describe('index', () => {
  it('should append stable guidance without replacing the prompt or changing the event', () => {
    const hooks = register();
    assert.deepEqual([...hooks.keys()], ['before_prompt_build']);
    const event = Object.freeze({ prompt: 'Keep the user request.', messages: Object.freeze([]) });
    const result = hooks.get('before_prompt_build')(event, {});
    assert.deepEqual(Object.keys(result), ['appendSystemContext']);
    assert.match(result.appendSystemContext, /tanaab-\*/);
    assert.match(result.appendSystemContext, /explicit user instructions/);
    assert.equal(result.appendSystemContext.length < 350, true);
    assert.deepEqual(hooks.get('before_prompt_build')({ prompt: 'Another request.' }, {}), result);
  });

  it('should leave skills available without registering a hook when guidance is disabled', () => {
    assert.equal(register({ guidance: false }).size, 0);
    assert.equal(register({ guidance: true }).size, 1);
  });
});
