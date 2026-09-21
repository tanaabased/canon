import manifest from './openclaw.plugin.json' with { type: 'json' };

export default {
  id: manifest.id,
  name: manifest.name,
  description: manifest.description,
  register(api) {
    if (api.pluginConfig?.guidance === false) return;
    api.on('before_prompt_build', () => ({
      appendSystemContext:
        'Prefer relevant tanaab-* skills for project, code, documentation, and release work. ' +
        'Read only the skills needed for the task and follow their workflows. ' +
        'Respect explicit user instructions and project-specific guidance.',
    }));
  },
};
