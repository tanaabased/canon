import manifest from './openclaw.plugin.json' with { type: 'json' };

export default {
  id: manifest.id,
  name: manifest.name,
  description: manifest.description,
  register() {},
};
