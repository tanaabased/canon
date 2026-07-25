import assert from 'node:assert/strict';

import {
  applyControlDerivedProps,
  createPlaygroundState,
  generateComponentUsage,
  getPreviewProps,
} from '../templates/component-playground-codegen.js';

describe('skills/vue-author/templates/component-playground-codegen', () => {
  it('should derive object-array props and generate escaped component usage', () => {
    const schema = {
      controls: {
        itemCount: { default: 1, kind: 'number' },
      },
      name: 'ExampleCard',
      props: {
        active: { default: false, kind: 'boolean' },
        items: {
          countControl: 'itemCount',
          default: [],
          fields: [{ path: 'label' }],
          kind: 'object-array',
          presets: { default: [{ label: 'One' }, { label: 'Two' }] },
          defaultPreset: 'default',
        },
        title: { default: '', kind: 'string' },
      },
      slots: {
        default: { default: 'Hello <world>', kind: 'text' },
      },
    };
    const state = createPlaygroundState(schema, {
      props: { active: true, title: 'A & B' },
    });
    applyControlDerivedProps(schema, state, 'itemCount');

    const { code } = generateComponentUsage(schema, state);
    assert.match(code, /active/);
    assert.match(code, /title="A &amp; B"/);
    assert.match(code, /Hello &lt;world&gt;/);
    assert.equal(getPreviewProps(schema, state).items.length, 1);
  });
});
